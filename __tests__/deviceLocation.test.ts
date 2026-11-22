import { describe, it, expect, vi, afterEach } from 'vitest';
import { locationIfAlreadyAllowed } from '@/lib/deviceLocation';

/**
 * The quiet half of #555: the hornet map centres on the beekeeper, and must never be the reason
 * a permission prompt appears. A prompt nobody asked for is a prompt they refuse, and a refusal
 * is remembered for the whole origin — including the report form, where the location is the
 * entire point.
 */
function withNavigator(parts: {
  permission?: PermissionState | 'throws';
  position?: { lat: number; lng: number } | 'error' | 'never';
  hasGeolocation?: boolean;
  hasPermissions?: boolean;
}) {
  const getCurrentPosition = vi.fn(
    (ok: PositionCallback, fail?: PositionErrorCallback) => {
      if (parts.position === 'error') fail?.({ code: 1 } as GeolocationPositionError);
      else if (parts.position && parts.position !== 'never') {
        ok({ coords: { latitude: parts.position.lat, longitude: parts.position.lng } } as
          GeolocationPosition);
      }
      // 'never' calls neither, which is the browser that goes quiet.
    });

  const query = parts.permission === 'throws'
    ? vi.fn(() => Promise.reject(new Error('unsupported')))
    : vi.fn(() => Promise.resolve({ state: parts.permission ?? 'prompt' } as PermissionStatus));

  vi.stubGlobal('navigator', {
    geolocation: parts.hasGeolocation === false ? undefined : { getCurrentPosition },
    permissions: parts.hasPermissions === false ? undefined : { query },
  });
  return { getCurrentPosition, query };
}

afterEach(() => vi.unstubAllGlobals());

describe('locationIfAlreadyAllowed', () => {
  it('answers with the position once permission is already granted', async () => {
    withNavigator({ permission: 'granted', position: { lat: 51.1, lng: 13.7 } });

    expect(await locationIfAlreadyAllowed()).toEqual({ lat: 51.1, lng: 13.7 });
  });

  it('does not ask the browser anything while permission is only "prompt"', async () => {
    // The whole point: no prompt, and therefore no refusal to inherit.
    const { getCurrentPosition } = withNavigator({ permission: 'prompt' });

    expect(await locationIfAlreadyAllowed()).toBeNull();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('stays quiet when permission was denied', async () => {
    const { getCurrentPosition } = withNavigator({ permission: 'denied' });

    expect(await locationIfAlreadyAllowed()).toBeNull();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('treats a browser with no Permissions API as "cannot tell", which is no', async () => {
    // Safari had geolocation long before it could be asked about it. Not being able to tell
    // "granted" from "will prompt" is exactly when to say nothing.
    const { getCurrentPosition } = withNavigator({ hasPermissions: false });

    expect(await locationIfAlreadyAllowed()).toBeNull();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('treats a Permissions API that throws the same way', async () => {
    withNavigator({ permission: 'throws' });

    expect(await locationIfAlreadyAllowed()).toBeNull();
  });

  it('answers null without geolocation at all', async () => {
    withNavigator({ hasGeolocation: false });

    expect(await locationIfAlreadyAllowed()).toBeNull();
  });

  it('answers null when the position is refused at the last moment', async () => {
    // Permission granted and the fix fails anyway — no sky, no signal, a denied kill switch.
    withNavigator({ permission: 'granted', position: 'error' });

    expect(await locationIfAlreadyAllowed()).toBeNull();
  });

  it('gives up rather than leaving a map waiting for ever', async () => {
    // A browser that calls neither callback. The option's own timeout does not cover this.
    vi.useFakeTimers();
    withNavigator({ permission: 'granted', position: 'never' });

    const pending = locationIfAlreadyAllowed(1000);
    await vi.advanceTimersByTimeAsync(1001);

    expect(await pending).toBeNull();
    vi.useRealTimers();
  });
});
