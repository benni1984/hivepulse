//
//  Buying the supporter subscription on the iPhone.
//
//  The store sells; the server decides. RevenueCat verifies the receipt and tells the backend
//  through its webhook, the backend writes `subscriptions`, and `is_supporter` is derived from
//  that table — so what this file does is take money and then ask the server to catch up. It
//  never decides anybody's access (api-contract.md, "What the apps implement").
//
//  Nothing outside this file imports RevenueCat. The paywall and its view model see
//  `SupporterOffer` and `PurchaseOutcome`, which is what lets `SupporterViewModelTests` run
//  without a store account and what would make a later move to native StoreKit a change to one
//  file rather than to the screen.
//
import Foundation
import RevenueCat

/// One tier offered for sale, as the paywall needs it.
struct SupporterOffer: Identifiable, Equatable {
    /// RevenueCat's package identifier; the service maps it back to the real package.
    let id: String
    /// The store's own title for the product.
    let title: String
    /// Already formatted by the store, in the currency of the signed-in store account. Never
    /// formatted here: the price somebody is shown has to be the price their store will charge.
    let price: String
}

/// What came of a purchase. A dismissed sheet is an outcome, not an error — showing it as one
/// tells somebody who simply changed their mind that something went wrong.
enum PurchaseOutcome: Equatable {
    case bought
    case cancelled
}

protocol PurchaseServiceProtocol {
    /// False in a build with no key. The paywall then says it cannot be bought here, rather
    /// than showing an empty list and looking broken.
    var canSell: Bool { get }

    func offers() async throws -> [SupporterOffer]
    func buy(_ offer: SupporterOffer) async throws -> PurchaseOutcome
    /// True when the restore found a subscription that grants access.
    func restore() async throws -> Bool
    /// Opens the system sheet. The app cannot cancel a store subscription and must not pretend
    /// to; this hands over to the place that can.
    func manageSubscription() async throws

    /// Binds the SDK to the signed-in account, on every way in. RevenueCat's `app_user_id` is
    /// the HivePulse `user.id` and nothing else, because the webhook matches on it; a purchase
    /// made while the SDK still holds an anonymous id is a payment attached to no account.
    func identify(userID: String) async
    /// On sign-out, or the next person to use this phone inherits the subscription.
    func forget() async
}

// MARK: - The real one

final class RevenueCatPurchaseService: PurchaseServiceProtocol {

    /// The **public** SDK key, injected per configuration via `REVENUECAT_PUBLIC_KEY` in
    /// project.yml → Info.plist. Empty in a local build and in a build from source, which is
    /// deliberate: this repository is public, so no key is written down in it.
    ///
    /// The `$(` check is not paranoia. An unexpanded build setting arrives as the literal
    /// string `$(REVENUECAT_PUBLIC_KEY)`, and handing that to `configure` would point the app
    /// at nothing while every call reported a plausible-looking failure. `APIClient` guards its
    /// base URL the same way.
    static var publicKey: String {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: "RevenueCatPublicKey") as? String,
              !raw.isEmpty, !raw.hasPrefix("$(") else { return "" }
        return raw
    }

    /// Configures the SDK once, if there is a key. Called from the app's root rather than from
    /// `didFinishLaunching`: RevenueCat asks for that explicitly when an app user id of our own
    /// is passed in, because of iOS 15 prewarming.
    ///
    /// `Purchases.shared` traps when the SDK was never configured, so every method below goes
    /// through `canSell` first. A missing key must leave the rest of the app untouched — the
    /// same position the backend takes with no RevenueCat key at all.
    static func configureIfPossible() {
        guard !isConfigured, !publicKey.isEmpty else { return }
        Purchases.logLevel = .warn
        Purchases.configure(withAPIKey: publicKey)
        isConfigured = true
    }

    private(set) static var isConfigured = false

    /// The packages last fetched, by identifier. The paywall hands back a `SupporterOffer`, and
    /// the purchase needs the real `Package` — keeping the map here is what keeps the vendor
    /// type out of the view layer.
    private var packages: [String: Package] = [:]

    var canSell: Bool { Self.isConfigured }

    func offers() async throws -> [SupporterOffer] {
        guard canSell else { return [] }
        let offerings = try await Purchases.shared.offerings()
        // The current offering, not a named product: a price or a product can then change in the
        // dashboard without a release.
        let available = offerings.current?.availablePackages ?? []
        packages = Dictionary(available.map { ($0.identifier, $0) }, uniquingKeysWith: { first, _ in first })
        return available.map {
            SupporterOffer(id: $0.identifier,
                           title: $0.storeProduct.localizedTitle,
                           price: $0.storeProduct.localizedPriceString)
        }
    }

    func buy(_ offer: SupporterOffer) async throws -> PurchaseOutcome {
        guard canSell, let package = packages[offer.id] else { return .cancelled }
        let result = try await Purchases.shared.purchase(package: package)
        // `PurchaseResultData` carries `userCancelled` beside the customer info. Reading the flag
        // rather than matching on an error code keeps a dismissed sheet from looking like a
        // failure -- RevenueCat throws for a cancellation too, in some paths.
        return result.userCancelled ? .cancelled : .bought
    }

    func restore() async throws -> Bool {
        guard canSell else { return false }
        let info = try await Purchases.shared.restorePurchases()
        return Self.grantsAccess(info)
    }

    func manageSubscription() async throws {
        guard canSell else { return }
        try await Purchases.shared.showManageSubscriptions()
    }

    func identify(userID: String) async {
        guard canSell, Purchases.shared.appUserID != userID else { return }
        // Silently, the way Settings reads the subscription it only needs for a warning. Failing
        // to bind is not fatal: the account stays signed in, the webhook knows what it knew, and
        // the next launch tries again. What it would cost is a purchase made in *this* session
        // going unattributed -- which is why the paywall binds again before it offers anything.
        _ = try? await Purchases.shared.logIn(userID)
    }

    func forget() async {
        guard canSell else { return }
        _ = try? await Purchases.shared.logOut()
    }

    /// The entitlement the backend already uses by that name (`REVENUECAT_ENTITLEMENT`).
    static let entitlement = "supporter"

    private static func grantsAccess(_ info: CustomerInfo) -> Bool {
        info.entitlements[entitlement]?.isActive == true
    }
}

// MARK: - Which one the app uses

/// The app's purchase service, swappable the way the camera is by `-mockCameraPreview`: a
/// simulator has no store account, so without this a UI test could only ever see the "cannot be
/// bought here" state.
enum PurchaseServices {
    static var current: PurchaseServiceProtocol = {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-mockStoreOffers") {
            return MockPurchaseService()
        }
        #endif
        return RevenueCatPurchaseService()
    }()
}
