import Foundation

/// What the paywall is showing. One enum rather than a handful of booleans, because the states
/// genuinely exclude each other and the combinations that booleans allow -- "already a supporter
/// and also here are three prices" -- are the ones that look broken.
enum SupporterScreenState: Equatable {
    case loading
    /// Nothing to buy here: no key in this build, or a configured store with no products. Both
    /// end in the same sentence, because to the person reading it they are the same thing.
    case unavailable
    case offers([SupporterOffer])
    /// Already paid for, from any of the four sources -- including a web purchase and an admin
    /// grant. The paywall must not try to sell to somebody who already bought.
    case alreadySupporter
    case failed(String)
}

@MainActor
final class SupporterViewModel: ObservableObject {
    @Published private(set) var state: SupporterScreenState = .loading
    /// The offer currently at the till, so its row can show a spinner and the others can be
    /// disabled. Nil when nothing is in flight.
    @Published private(set) var buying: SupporterOffer?
    /// Shown as a transient notice rather than as a failed screen: the paywall is still usable
    /// after a restore that found nothing.
    @Published var notice: String?
    /// Set once, when a purchase or restore actually unlocked something, so the screen that
    /// presented this can refresh the account and close.
    @Published private(set) var didUnlock = false

    private let purchases: PurchaseServiceProtocol
    private let subscriptions: any SubscriptionServiceProtocol
    private let userID: String?

    init(purchases: PurchaseServiceProtocol = PurchaseServices.current,
         subscriptions: any SubscriptionServiceProtocol = SubscriptionService(),
         userID: String?) {
        self.purchases = purchases
        self.subscriptions = subscriptions
        self.userID = userID
    }

    func load() async {
        state = .loading

        // Binding before offering, every time. `identify` is cheap when the id already matches,
        // and a purchase made while the SDK holds an anonymous id is a payment attached to no
        // account -- the one failure in this feature that costs somebody money.
        if let userID { await purchases.identify(userID: userID) }

        // Asked first, because somebody who bought on the website or was granted it by hand must
        // not be sold the same thing again.
        let current = try? await subscriptions.mine()
        if current?.grantsAccess == true {
            state = .alreadySupporter
            return
        }

        // Two things have to be true to show a price: this deployment is allowed to sell, which
        // only the server knows, and this build has a key, which only the app knows.
        //
        // **No answer counts as "no".** The honest reading of silence is "unknown", and the whole
        // point of the switch is that going live is an act somebody performs rather than something
        // a failed request can bring about (#530). The cost is that a connection problem hides the
        // prices for a moment; the cost the other way round is taking money a week early, in a
        // store whose products are not approved yet.
        guard current?.storeCheckoutEnabled == true, purchases.canSell else {
            state = .unavailable
            return
        }

        do {
            let offers = try await purchases.offers()
            state = offers.isEmpty ? .unavailable : .offers(offers)
        } catch {
            state = .failed(error.localizedDescription)
        }
    }

    func buy(_ offer: SupporterOffer) async {
        guard buying == nil else { return }
        buying = offer
        defer { buying = nil }
        do {
            switch try await purchases.buy(offer) {
            case .cancelled:
                // Somebody changed their mind. Not an error, and saying so would tell them
                // something went wrong when nothing did.
                return
            case .bought:
                await settle()
            }
        } catch {
            notice = error.localizedDescription
        }
    }

    func restore() async {
        guard buying == nil else { return }
        do {
            if try await purchases.restore() {
                await settle()
            } else {
                notice = NSLocalizedString("supporter.restore.nothing", comment: "")
            }
        } catch {
            notice = error.localizedDescription
        }
    }

    func manageSubscription() async {
        do {
            try await purchases.manageSubscription()
        } catch {
            notice = error.localizedDescription
        }
    }

    /// The store says it is paid for; now the server has to agree, because the server is what
    /// every client reads.
    ///
    /// A failed sync is deliberately **not** a failed purchase. The webhook is the authority and
    /// arrives within seconds anyway; telling somebody their payment failed because one request
    /// of ours did would be a lie that costs a support mail.
    private func settle() async {
        _ = try? await subscriptions.sync()
        didUnlock = true
        state = .alreadySupporter
    }
}
