import type { ConfigurationHealth } from '@/lib/api';

/**
 * What the admin health page says about the Paddle API key (#528).
 *
 * A function rather than three branches inside the component, because the one thing worth
 * testing here is arithmetic the renderer cannot show: `days_left` is **negative** once the key
 * has expired, and a sentence reading "expired -28 day(s) ago" is the kind of detail that makes
 * somebody doubt the whole warning.
 */
export interface Notice {
  key: string;
  values?: Record<string, number>;
}

export function paddleKeyNotice(config: ConfigurationHealth): Notice | null {
  // Not an absence: the live Paddle account does not allow a key without an expiry date, so
  // there is one, and it is only missing from here.
  if (!config.paddle_key_expiry_known) return { key: 'admin.health.paddleKeyUnknown' };

  const left = config.paddle_key_days_left ?? 0;

  // Expired first, and it keeps `expiring_soon` set as well — a page that only said "expiring
  // soon" would fall silent the moment the thing it warned about happened.
  if (config.paddle_key_expired) {
    return { key: 'admin.health.paddleKeyExpired', values: { days: Math.abs(left) } };
  }
  if (config.paddle_key_expiring_soon) {
    return { key: 'admin.health.paddleKeyExpiring', values: { days: left } };
  }
  return null;
}
