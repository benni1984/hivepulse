import XCTest
@testable import HivePulse

/// The paywall's decisions, without a store account and without a network.
///
/// The cases that matter are the ones that cost money or trust: selling to somebody who already
/// paid, treating a dismissed sheet as a failure, and letting a failed request of ours look like
/// a failed payment.
@MainActor
final class SupporterViewModelTests: XCTestCase {

    // MARK: - Doubles

    private final class FakePurchases: PurchaseServiceProtocol {
        var canSell = true
        var available: [SupporterOffer] = [SupporterOffer(id: "annual", title: "Yearly", price: "€19.99")]
        var outcome: PurchaseOutcome = .bought
        var restoreFinds = false
        var thrown: Error?

        var identified: [String] = []
        var forgotten = false
        var bought: [SupporterOffer] = []
        var managed = 0

        func offers() async throws -> [SupporterOffer] {
            if let thrown { throw thrown }
            return available
        }

        /// Holds a purchase open until the test lets go, so the "only one at a time" guard is
        /// actually exercised. Without it the fake never suspends, the first purchase finishes
        /// before the second begins, and the test would pass with the guard deleted.
        var holdsUntilReleased = false
        private var gate: CheckedContinuation<Void, Never>?

        func release() {
            gate?.resume()
            gate = nil
        }

        func buy(_ offer: SupporterOffer) async throws -> PurchaseOutcome {
            bought.append(offer)
            if holdsUntilReleased {
                await withCheckedContinuation { gate = $0 }
            }
            if let thrown { throw thrown }
            return outcome
        }

        func restore() async throws -> Bool {
            if let thrown { throw thrown }
            return restoreFinds
        }

        func manageSubscription() async throws { managed += 1 }
        func identify(userID: String) async { identified.append(userID) }
        func forget() async { forgotten = true }
    }

    private final class FakeSubscriptions: SubscriptionServiceProtocol {
        /// Switched on, because most of these tests are about what happens once it is. The
        /// switch itself has its own cases below.
        var current = SubscriptionOut(status: "none", source: nil,
                                      storeCheckoutEnabled: true, storeManaged: false)
        var syncs = 0
        var syncThrows: Error?
        var mineThrows: Error?

        func mine() async throws -> SubscriptionOut {
            if let mineThrows { throw mineThrows }
            return current
        }

        func sync() async throws -> SubscriptionOut {
            syncs += 1
            if let syncThrows { throw syncThrows }
            return current
        }
    }

    private struct Boom: LocalizedError {
        var errorDescription: String? { "the store said no" }
    }

    private func make(_ purchases: FakePurchases,
                      _ subscriptions: FakeSubscriptions,
                      userID: String? = "u-1") -> SupporterViewModel {
        SupporterViewModel(purchases: purchases, subscriptions: subscriptions, userID: userID)
    }

    // MARK: - What it offers

    func testTheAccountIsBoundBeforeAnythingIsOffered() async {
        // RevenueCat matches purchases on this id. A purchase made while the SDK still holds an
        // anonymous one is a successful payment attached to no account -- the only failure here
        // that costs somebody money.
        let purchases = FakePurchases()
        let vm = make(purchases, FakeSubscriptions())

        await vm.load()

        XCTAssertEqual(purchases.identified, ["u-1"])
    }

    func testSomebodyWhoAlreadyPaidIsNotSoldTheSameThingAgain() async {
        // Including a web purchase and an admin grant: `is_supporter` is derived from all four
        // sources, and the store knows about only one of them.
        let subscriptions = FakeSubscriptions()
        subscriptions.current = SubscriptionOut(status: "active", source: "web", storeManaged: false)
        let vm = make(FakePurchases(), subscriptions)

        await vm.load()

        XCTAssertEqual(vm.state, .alreadySupporter)
    }

    func testAGracePeriodStillCountsAsPaidFor() async {
        // The store is retrying a card. Selling a second subscription to somebody whose bank is
        // merely slow would be charging them twice.
        let subscriptions = FakeSubscriptions()
        subscriptions.current = SubscriptionOut(status: "grace", source: "apple", storeManaged: true)
        let vm = make(FakePurchases(), subscriptions)

        await vm.load()

        XCTAssertEqual(vm.state, .alreadySupporter)
    }

    func testABuildWithoutAKeySaysSoRatherThanShowingNothing() async {
        let purchases = FakePurchases()
        purchases.canSell = false
        let vm = make(purchases, FakeSubscriptions())

        await vm.load()

        XCTAssertEqual(vm.state, .unavailable)
    }

    func testAConfiguredStoreWithNoProductsIsTheSameAnswer() async {
        // What a deployment looks like before anybody finished the console work. An empty list
        // behind a "Subscribe" heading looks broken; this says what is going on.
        let purchases = FakePurchases()
        purchases.available = []
        let vm = make(purchases, FakeSubscriptions())

        await vm.load()

        XCTAssertEqual(vm.state, .unavailable)
    }

    func testBeingUnableToAskTheServerMeansNotSelling() async {
        // The server carries the permission to sell, not just the entitlement, so silence is
        // no longer something to work around. Unknown is closed: the switch exists precisely
        // so that going live is an act somebody performs and not something a failed request
        // can bring about (#530).
        let subscriptions = FakeSubscriptions()
        subscriptions.mineThrows = Boom()
        let vm = make(FakePurchases(), subscriptions)

        await vm.load()

        XCTAssertEqual(vm.state, .unavailable)
    }

    func testNothingIsSoldUntilTheServerSaysThisDeploymentMay() async {
        // The default, and the state every deployment is in until somebody switches it on.
        let subscriptions = FakeSubscriptions()
        subscriptions.current = SubscriptionOut(status: "none", source: nil,
                                                storeCheckoutEnabled: false, storeManaged: false)
        let vm = make(FakePurchases(), subscriptions)

        await vm.load()

        XCTAssertEqual(vm.state, .unavailable, "a key alone must not start selling")
    }

    func testAnAccountThatAlreadyPaidIsStillToldSoWhileTheSwitchIsOff() async {
        // The switch gates selling, not reading. Somebody who pays must not be shown "cannot
        // be bought here" over a feature they already have.
        let subscriptions = FakeSubscriptions()
        subscriptions.current = SubscriptionOut(status: "active", source: "apple",
                                                storeCheckoutEnabled: false, storeManaged: true)
        let vm = make(FakePurchases(), subscriptions)

        await vm.load()

        XCTAssertEqual(vm.state, .alreadySupporter)
    }

    // MARK: - Buying

    func testADismissedSheetIsNotAnError() async {
        // Somebody changed their mind. Telling them something went wrong is both untrue and the
        // kind of thing that stops them trying again.
        let purchases = FakePurchases()
        purchases.outcome = .cancelled
        let subscriptions = FakeSubscriptions()
        let vm = make(purchases, subscriptions)
        await vm.load()

        await vm.buy(purchases.available[0])

        XCTAssertNil(vm.notice)
        XCTAssertFalse(vm.didUnlock)
        XCTAssertEqual(subscriptions.syncs, 0, "nothing was bought, so there is nothing to sync")
        XCTAssertNil(vm.buying, "and the row must not be left spinning")
    }

    func testAPurchaseAsksTheServerToCatchUp() async {
        let purchases = FakePurchases()
        let subscriptions = FakeSubscriptions()
        let vm = make(purchases, subscriptions)
        await vm.load()

        await vm.buy(purchases.available[0])

        XCTAssertEqual(subscriptions.syncs, 1, "or the unlock waits for the webhook")
        XCTAssertTrue(vm.didUnlock)
        XCTAssertEqual(vm.state, .alreadySupporter)
    }

    func testAFailedSyncIsNotAFailedPurchase() async {
        // The money is gone and the webhook is on its way. Reporting our own failed request as a
        // failed payment is a lie that costs a support mail -- and would be the second charge if
        // they believed it and bought again.
        let purchases = FakePurchases()
        let subscriptions = FakeSubscriptions()
        subscriptions.syncThrows = Boom()
        let vm = make(purchases, subscriptions)
        await vm.load()

        await vm.buy(purchases.available[0])

        XCTAssertNil(vm.notice)
        XCTAssertTrue(vm.didUnlock)
        XCTAssertEqual(vm.state, .alreadySupporter)
    }

    func testAStoreFailureIsShown() async {
        let purchases = FakePurchases()
        let vm = make(purchases, FakeSubscriptions())
        await vm.load()
        purchases.thrown = Boom()

        await vm.buy(purchases.available[0])

        XCTAssertEqual(vm.notice, "the store said no")
        XCTAssertFalse(vm.didUnlock)
    }

    func testOnlyOnePurchaseRunsAtATime() async {
        // Two taps on two rows would mean two charges.
        let purchases = FakePurchases()
        let vm = make(purchases, FakeSubscriptions())
        await vm.load()
        let offer = purchases.available[0]
        purchases.holdsUntilReleased = true

        let first = Task { await vm.buy(offer) }
        // Until the fake is genuinely inside `buy` and suspended there. Spinning rather than
        // sleeping keeps it deterministic: the loop cannot end before the first purchase started.
        while purchases.bought.isEmpty { await Task.yield() }

        await vm.buy(offer)                 // the second tap, which must be refused
        XCTAssertEqual(purchases.bought.count, 1, "a second tap while one is in flight is a second charge")

        purchases.release()
        await first.value
    }

    // MARK: - Restoring

    func testRestoringNothingSaysSoAndLeavesTheScreenUsable() async {
        let purchases = FakePurchases()
        purchases.restoreFinds = false
        let vm = make(purchases, FakeSubscriptions())
        await vm.load()
        let before = vm.state

        await vm.restore()

        XCTAssertNotNil(vm.notice)
        XCTAssertEqual(vm.state, before, "the offers must still be there to buy")
        XCTAssertFalse(vm.didUnlock)
    }

    func testRestoringAPurchaseUnlocksAndSyncs() async {
        // The only way back for somebody who reinstalled or changed phone.
        let purchases = FakePurchases()
        purchases.restoreFinds = true
        let subscriptions = FakeSubscriptions()
        let vm = make(purchases, subscriptions)
        await vm.load()

        await vm.restore()

        XCTAssertEqual(subscriptions.syncs, 1)
        XCTAssertTrue(vm.didUnlock)
        XCTAssertEqual(vm.state, .alreadySupporter)
    }

    // MARK: - Managing

    func testManagingHandsOverToTheStore() async {
        // The app cannot cancel a store subscription and must not appear to.
        let purchases = FakePurchases()
        let vm = make(purchases, FakeSubscriptions())

        await vm.manageSubscription()

        XCTAssertEqual(purchases.managed, 1)
    }

    func testSignedOutNothingIsBound() async {
        // No account, no id to bind. The paywall is reachable from Settings only while signed
        // in, but a nil id must not become the string "nil" in RevenueCat's records.
        let purchases = FakePurchases()
        let vm = make(purchases, FakeSubscriptions(), userID: nil)

        await vm.load()

        XCTAssertTrue(purchases.identified.isEmpty)
    }
}
