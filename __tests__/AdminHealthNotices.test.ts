import { describe, it, expect } from 'vitest';
import { paddleKeyNotice } from '@/lib/adminHealthNotices';
import type { ConfigurationHealth } from '@/lib/api';

/**
 * What the admin health page says about the Paddle API key (#528).
 *
 * Separate from `AdminHealthPage.test.tsx` because that file's translation mock returns the key
 * and drops the values, so the one thing worth checking here — that a key which expired 28 days
 * ago is reported as 28 and not as −28 — cannot be seen through the renderer.
 */
const healthy: ConfigurationHealth = {
  environment: 'production',
  signing_key_is_the_public_default: false,
  crash_reporting_configured: true,
  push_android_configured: true,
  push_ios_configured: true,
  paddle_key_expiry_known: true,
  paddle_key_expires_at: '2099-01-01',
  paddle_key_days_left: 999,
  paddle_key_expiring_soon: false,
  paddle_key_expired: false,
};

describe('paddleKeyNotice', () => {
  it('says nothing while the date is far away', () => {
    expect(paddleKeyNotice(healthy)).toBeNull();
  });

  it('reports a missing date as a finding of its own', () => {
    // The live Paddle account does not allow a key without an expiry date, so there is one and
    // it is only missing from here.
    const notice = paddleKeyNotice({
      ...healthy, paddle_key_expiry_known: false, paddle_key_expires_at: null,
      paddle_key_days_left: null,
    });

    expect(notice).toEqual({ key: 'admin.health.paddleKeyUnknown' });
  });

  it('counts down inside the last month', () => {
    const notice = paddleKeyNotice({
      ...healthy, paddle_key_expires_at: '2027-03-15', paddle_key_days_left: 14,
      paddle_key_expiring_soon: true,
    });

    expect(notice).toEqual({ key: 'admin.health.paddleKeyExpiring', values: { days: 14 } });
  });

  it('reports a key that has already expired in positive days', () => {
    // `days_left` is negative by then. "Expired -28 day(s) ago" is the kind of detail that
    // makes somebody doubt the whole warning.
    const notice = paddleKeyNotice({
      ...healthy, paddle_key_expires_at: '2027-02-01', paddle_key_days_left: -28,
      paddle_key_expiring_soon: true, paddle_key_expired: true,
    });

    expect(notice).toEqual({ key: 'admin.health.paddleKeyExpired', values: { days: 28 } });
  });

  it('prefers "expired" over "expiring soon" when both are set', () => {
    // The server sets both on purpose, so that a page which only knew "soon" would not fall
    // silent at the moment the thing it warned about actually happened.
    const notice = paddleKeyNotice({
      ...healthy, paddle_key_days_left: -1, paddle_key_expiring_soon: true,
      paddle_key_expired: true,
    });

    expect(notice?.key).toBe('admin.health.paddleKeyExpired');
  });

  it('survives a server that sends no number with its flag', () => {
    // An older server, or one that answered oddly. Zero days is wrong but harmless; a crash on
    // the health page is not.
    const notice = paddleKeyNotice({
      ...healthy, paddle_key_days_left: null, paddle_key_expiring_soon: true,
    });

    expect(notice).toEqual({ key: 'admin.health.paddleKeyExpiring', values: { days: 0 } });
  });
});
