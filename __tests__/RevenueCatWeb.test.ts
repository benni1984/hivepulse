/**
 * Buying on the website, with no store anywhere near it (#541).
 *
 * This is the one file that knows RevenueCat exists, so it is the one place these rules can be
 * held: the purchase is bound to *this* account, a cancelled sheet is not an error, and a
 * missing key is a normal state rather than a crash. The page's own tests mock this module, the
 * same way the apps' paywall tests mock `PurchaseService` and `PurchaseGateway`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

class FakePurchasesError extends Error {
  constructor(public errorCode: number) {
    super('fake');
  }
}

const state = vi.hoisted(() => ({
  configured: false,
  appUserId: '',
  configure: vi.fn(),
  changeUser: vi.fn(),
  getOfferings: vi.fn(),
  purchase: vi.fn(),
}));

vi.mock('@revenuecat/purchases-js', () => {
  const shared = {
    getAppUserId: () => state.appUserId,
    changeUser: state.changeUser,
    getOfferings: state.getOfferings,
    purchase: state.purchase,
  };
  class PurchasesError extends Error {
    constructor(public errorCode: number) { super('rc'); }
  }
  return {
    Purchases: {
      isConfigured: () => state.configured,
      configure: (cfg: { apiKey: string; appUserId: string }) => {
        state.configure(cfg);
        state.configured = true;
        state.appUserId = cfg.appUserId;
        return shared;
      },
      getSharedInstance: () => shared,
    },
    PurchasesError,
    ErrorCode: { UserCancelledError: 1 },
  };
});

function offering(over: Record<string, unknown> = {}) {
  const annual = {
    identifier: '$rc_annual',
    product: { currentPrice: { formattedPrice: '19,99 €' } },
  };
  return { current: { annual, availablePackages: [annual], ...over } };
}

async function mod() {
  return import('@/lib/revenuecatWeb');
}

describe('revenuecatWeb', () => {
  beforeEach(() => {
    vi.resetModules();
    state.configured = false;
    state.appUserId = '';
    state.configure.mockReset();
    state.changeUser.mockReset().mockImplementation(async (id: string) => {
      state.appUserId = id;
    });
    state.getOfferings.mockReset().mockResolvedValue(offering());
    state.purchase.mockReset().mockResolvedValue({});
    vi.stubEnv('NEXT_PUBLIC_REVENUECAT_WEB_KEY', 'app_public_test');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('offers the yearly package, priced as RevenueCat quotes it', async () => {
    const offer = await (await mod()).loadSupporterOffer('user-1');

    expect(offer).toEqual({ id: '$rc_annual', price: '19,99 €' });
  });

  it('configures the SDK with the HivePulse account id and the public key', async () => {
    // The webhook matches on this id. Anything else is a payment credited to nobody.
    await (await mod()).loadSupporterOffer('user-1');

    expect(state.configure).toHaveBeenCalledWith({
      apiKey: 'app_public_test', appUserId: 'user-1',
    });
  });

  it('moves an already-configured SDK to the account that is signed in now', async () => {
    // One browser, two accounts, no reload. Configuring twice throws, and selling to whoever
    // the SDK happens to still hold would be the worst failure this feature has.
    state.configured = true;
    state.appUserId = 'somebody-else';

    await (await mod()).loadSupporterOffer('user-1');

    expect(state.changeUser).toHaveBeenCalledWith('user-1');
    expect(state.configure).not.toHaveBeenCalled();
  });

  it('does not change the user when it is already the right one', async () => {
    state.configured = true;
    state.appUserId = 'user-1';

    await (await mod()).loadSupporterOffer('user-1');

    expect(state.changeUser).not.toHaveBeenCalled();
  });

  it('says there is nothing on sale rather than reaching for a store without a key', async () => {
    // The normal state of every test run and of a deployment whose store side is unfinished.
    vi.stubEnv('NEXT_PUBLIC_REVENUECAT_WEB_KEY', '');

    expect(await (await mod()).loadSupporterOffer('user-1')).toBeNull();
    expect(state.getOfferings).not.toHaveBeenCalled();
  });

  it('says there is nothing on sale when no offering is current', async () => {
    state.getOfferings.mockResolvedValue({ current: null });

    expect(await (await mod()).loadSupporterOffer('user-1')).toBeNull();
  });

  it('falls back to the first package when the offering has no annual one', async () => {
    // An offering configured differently should still sell something rather than nothing.
    const other = {
      identifier: 'supporter_monthly',
      product: { currentPrice: { formattedPrice: '2,49 €' } },
    };
    state.getOfferings.mockResolvedValue({
      current: { annual: null, availablePackages: [other] },
    });

    expect(await (await mod()).loadSupporterOffer('user-1'))
      .toEqual({ id: 'supporter_monthly', price: '2,49 €' });
  });

  it('buys the package and reports it', async () => {
    expect(await (await mod()).buySupporter('user-1')).toBe('bought');
    expect(state.purchase).toHaveBeenCalled();
  });

  it('hands the till the address and the language, so neither has to be asked for', async () => {
    await (await mod()).buySupporter('user-1', { email: 'bee@example.com', locale: 'pl' });

    const args = state.purchase.mock.calls[0][0];
    expect(args.customerEmail).toBe('bee@example.com');
    expect(args.selectedLocale).toBe('pl');
    expect(args.defaultLocale).toBe('en');
    expect(args.rcPackage.identifier).toBe('$rc_annual');
  });

  it('treats a closed sheet as a cancellation and not as a failure', async () => {
    const { PurchasesError } = await import('@revenuecat/purchases-js');
    state.purchase.mockRejectedValue(new (PurchasesError as unknown as
      new (c: number) => Error)(1));

    expect(await (await mod()).buySupporter('user-1')).toBe('cancelled');
  });

  it('lets a real failure through instead of swallowing it as a cancellation', async () => {
    // A declined card must reach the page. Reporting it as "changed your mind" would leave
    // somebody staring at a button that silently does nothing.
    state.purchase.mockRejectedValue(new Error('card declined'));

    await expect((await mod()).buySupporter('user-1')).rejects.toThrow('card declined');
  });

  it('does not mistake somebody else’s error class for a cancellation', async () => {
    // `errorCode` is an ordinary property name. Matching on it alone would let an unrelated
    // error silently end a purchase as though the customer had closed the window.
    state.purchase.mockRejectedValue(new FakePurchasesError(1));

    await expect((await mod()).buySupporter('user-1')).rejects.toBeInstanceOf(FakePurchasesError);
  });

  it('refuses to buy when the offering holds no package at all', async () => {
    state.getOfferings.mockResolvedValue({ current: { annual: null, availablePackages: [] } });

    await expect((await mod()).buySupporter('user-1')).rejects.toThrow(/on sale/);
  });
});
