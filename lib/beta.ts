/**
 * Where testers sign up. Both links come from the stores and do not exist until a test
 * track has been created there, so each is empty until then and the page says so instead
 * of offering a dead button.
 *
 * Google requires a new personal developer account to run a **closed** test with at least
 * 12 opted-in testers for 14 consecutive days before the app may be published. That is why
 * this page exists: recruiting those twelve is the gating step, not the store texts.
 *
 * Play Console → Testing → Closed testing → Testers → "Copy link" gives the Android URL.
 * App Store Connect → TestFlight → Public link gives the iPhone one.
 */
export interface BetaLinks {
  /** Play Console opt-in URL for the closed test. */
  android: string;
  /** TestFlight public link. */
  ios: string;
  /** Where testers write; no account needed. */
  email: string;
}

export const BETA: BetaLinks = {
  android: 'https://play.google.com/apps/testing/com.hivepulse.app',
  ios: 'https://testflight.apple.com/join/zpTayMSE',
  email: 'hivepulse@multihead.de',
};

export function hasAnyBetaLink(links: BetaLinks = BETA): boolean {
  return links.android.trim().length > 0 || links.ios.trim().length > 0;
}
