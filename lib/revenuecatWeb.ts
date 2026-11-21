/**
 * Buying the supporter subscription on the website (#541).
 *
 * The Paddle checkout runs **on our own page**, through `@revenuecat/purchases-js`. It used to be
 * a hosted link on `pay.rev.cat` (#479), and that could never work: Paddle approves a checkout
 * domain only if the domain carries the seller's terms of service, privacy notice and refund
 * policy, and `pay.rev.cat` is RevenueCat's domain with no setting anywhere to put them there.
 * `hivepulse.multihead.de` carries all three and was approved the day it was submitted.
 *
 * Everything RevenueCat-shaped lives in this one file, so the page sees `SupporterOffer` and
 * `PurchaseOutcome` and its tests run without a store — the same arrangement the two apps use
 * (`PurchaseService.swift`, `PurchaseGateway.kt`).
 */

/** What the page shows on the button: the price this customer will actually be charged. */
export interface SupporterOffer {
  /** The package identifier, for the page's own keys and for debugging. */
  id: string;
  /** Already formatted by the SDK in the customer's currency and locale, e.g. "€19,99". */
  price: string;
}

/**
 * How a purchase ended.
 *
 * `cancelled` is not an error and must not be shown as one — somebody closed the sheet, which on
 * the iPhone and on Android is also a silent outcome (`-mockStoreCancels`). Anything else throws.
 */
export type PurchaseOutcome = 'bought' | 'cancelled';

/**
 * The public SDK key, a build value.
 *
 * Public on purpose and safe in a public repository's *build* — it identifies the app, it does
 * not authorise anything. It is still not written into the repository: it arrives from a Vercel
 * environment variable, the way the apps take theirs from a secret.
 *
 * Empty is a normal state, not a misconfiguration: every test run and every deployment whose
 * store side is unfinished has it empty, and the page then says the subscription cannot be
 * bought here yet. That is the same sentence it shows when the server's `web_checkout_enabled`
 * is false, because to a visitor the two are the same fact.
 */
export function webCheckoutKey(): string {
  return process.env.NEXT_PUBLIC_REVENUECAT_WEB_KEY ?? '';
}

/**
 * The SDK is loaded only when somebody is actually about to buy.
 *
 * A static import would put Paddle's checkout machinery into the bundle of every dashboard page,
 * including the ones a free account never leaves. It also keeps the module out of the way of the
 * unit tests, which mock this file rather than the SDK.
 */
async function sdk() {
  return import('@revenuecat/purchases-js');
}

/**
 * Configure once per account, and never with a value from a URL.
 *
 * **`appUserId` is the HivePulse `user.id` and nothing else.** The webhook matches on it, so a
 * purchase carrying anything else is money taken and credited to nobody — the single worst
 * failure this feature has. It was the reason the old link was built on the server; the reason
 * did not go away, it just moved to a named argument.
 *
 * `changeUser` covers the case the SDK's own guard does not: one browser, two accounts, no
 * reload. Configuring twice throws, and configuring once and then selling to whoever signed in
 * next would be exactly the failure above.
 */
async function instance(userId: string) {
  const { Purchases } = await sdk();
  if (!Purchases.isConfigured()) {
    return Purchases.configure({ apiKey: webCheckoutKey(), appUserId: userId });
  }
  const shared = Purchases.getSharedInstance();
  if (shared.getAppUserId() !== userId) await shared.changeUser(userId);
  return shared;
}

/**
 * Which package the page offers.
 *
 * The yearly one, and the yearly one is the product: beekeeping is seasonal, and a monthly
 * subscription invites a cancellation every November. `annual` is RevenueCat's own name for it;
 * falling back to the first available package means an offering that was configured differently
 * still sells something rather than showing nothing at all.
 */
export async function loadSupporterOffer(userId: string): Promise<SupporterOffer | null> {
  if (!webCheckoutKey()) return null;
  const offerings = await (await instance(userId)).getOfferings();
  const current = offerings.current;
  if (!current) return null;
  const pkg = current.annual ?? current.availablePackages[0];
  if (!pkg) return null;
  return { id: pkg.identifier, price: pkg.product.currentPrice.formattedPrice };
}

/**
 * Open the checkout and wait for it.
 *
 * The offering is read again rather than carried in from `loadSupporterOffer`: a `Package` is an
 * SDK object, and handing it through React state would make the page's props depend on a type
 * the page is not supposed to know. The call is cached by the SDK and costs nothing visible.
 */
export async function buySupporter(
  userId: string,
  opts: { email?: string; locale?: string } = {},
): Promise<PurchaseOutcome> {
  const { ErrorCode, PurchasesError } = await sdk();
  const purchases = await instance(userId);
  const current = (await purchases.getOfferings()).current;
  const pkg = current?.annual ?? current?.availablePackages[0];
  if (!pkg) throw new Error('No subscription is on sale.');

  try {
    await purchases.purchase({
      rcPackage: pkg,
      customerEmail: opts.email,
      // So the till speaks the account's language. purchases-js covers all five of ours; an
      // unknown one falls back to English rather than failing, which is why this is passed
      // through unchecked.
      selectedLocale: opts.locale,
      defaultLocale: 'en',
    });
    return 'bought';
  } catch (e) {
    if (e instanceof PurchasesError && e.errorCode === ErrorCode.UserCancelledError) {
      return 'cancelled';
    }
    throw e;
  }
}
