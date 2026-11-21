#if DEBUG
import Foundation

/// A store that behaves, for UI tests and for looking at the paywall in a simulator.
///
/// A simulator has no store account, so the real service can only ever reach the "cannot be
/// bought here" state there. Switched on with `-mockStoreOffers`, the way the camera is replaced
/// by `-mockCameraPreview`.
///
/// It does **not** pretend the purchase reached the backend. `is_supporter` still comes from the
/// server, so a UI test that wants the unlocked Members screen uses `-mockAuthenticatedSupporter`
/// and talks to `MockURLProtocol`. This only stands in for the till.
final class MockPurchaseService: PurchaseServiceProtocol {

    /// `-mockStoreCancels` makes the next purchase come back cancelled, which is the case worth
    /// a test: a dismissed sheet must leave the paywall as it was and show no error.
    private var alwaysCancels: Bool {
        ProcessInfo.processInfo.arguments.contains("-mockStoreCancels")
    }

    /// `-mockStoreEmpty` is a configured store with no products — what a deployment looks like
    /// before anybody finished the console work, and a state the paywall has to survive.
    private var isEmpty: Bool {
        ProcessInfo.processInfo.arguments.contains("-mockStoreEmpty")
    }

    var canSell: Bool { true }

    func offers() async throws -> [SupporterOffer] {
        if isEmpty { return [] }
        return [
            SupporterOffer(id: "$rc_annual", title: "Supporter (1 Year)", price: "€19.99"),
        ]
    }

    func buy(_ offer: SupporterOffer) async throws -> PurchaseOutcome {
        alwaysCancels ? .cancelled : .bought
    }

    func restore() async throws -> Bool {
        ProcessInfo.processInfo.arguments.contains("-mockStoreHasPurchase")
    }

    func manageSubscription() async throws {}
    func identify(userID: String) async {}
    func forget() async {}
}
#endif
