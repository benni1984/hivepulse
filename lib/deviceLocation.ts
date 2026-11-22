/**
 * Where the browser thinks it is — but only if it has already been told it may say (#555).
 *
 * The hornet map centres on the beekeeper, because a nest two valleys away matters and one in
 * another country does not. What it must **not** do is make a permission prompt appear because
 * somebody opened a map: a prompt nobody asked for is a prompt they refuse, and a refusal is
 * remembered for the whole origin — including the report form, where the location genuinely is
 * the point.
 *
 * So this asks the Permissions API first and answers `null` for anything but `granted`. The
 * places where the beekeeper *asked* for their location — the report form, the trap form, moving
 * hives — call `navigator.geolocation` directly and should keep doing so; prompting there is the
 * answer to a button they pressed.
 */
export interface DeviceLocation {
  lat: number;
  lng: number;
}

/** Long enough for a warm fix, short enough that a map is never left waiting on it. */
const DEFAULT_TIMEOUT_MS = 6000;

export async function locationIfAlreadyAllowed(
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<DeviceLocation | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;

  // No Permissions API (Safari used not to have one for geolocation) means we cannot tell
  // "granted" from "will prompt", and the quiet answer is the safe one.
  if (!navigator.permissions?.query) return null;

  try {
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    if (status.state !== 'granted') return null;
  } catch {
    // A browser that refuses the question has not granted anything either.
    return null;
  }

  return new Promise<DeviceLocation | null>(resolve => {
    let settled = false;
    const done = (value: DeviceLocation | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    // `timeout` in the options only bounds the position request; a browser that never calls
    // back at all would leave this promise open for ever, and the caller is a map that should
    // not care.
    const timer = setTimeout(() => done(null), timeoutMs);

    navigator.geolocation.getCurrentPosition(
      position => {
        clearTimeout(timer);
        done({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        done(null);
      },
      { timeout: timeoutMs, maximumAge: 5 * 60 * 1000 },
    );
  });
}
