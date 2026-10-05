import XCTest

/// Push stops working silently when the entitlement goes missing: the app still builds, still
/// uploads, and simply never receives a notification. These read the repository rather than
/// the bundle, because a simulator build carries no entitlements at all.
final class PushEntitlementTests: XCTestCase {

    /// ios/ , derived from this file's location so it works wherever the checkout lives.
    private var iosRoot: URL {
        URL(fileURLWithPath: #filePath)        // .../ios/HivePulseTests/PushEntitlementTests.swift
            .deletingLastPathComponent()       // .../ios/HivePulseTests
            .deletingLastPathComponent()       // .../ios
    }

    func test_theAppAsksForPushInTheProductionEnvironment() throws {
        let url = iosRoot.appendingPathComponent("HivePulse/HivePulse.entitlements")
        let data = try Data(contentsOf: url)
        let plist = try PropertyListSerialization.propertyList(from: data, format: nil)
        let entitlements = try XCTUnwrap(plist as? [String: Any])

        XCTAssertEqual(
            entitlements["aps-environment"] as? String, "production",
            "development would register the device with Apple's sandbox, which the server never talks to"
        )
    }

    func test_theAppIsAllowedToOfferSignInWithApple() throws {
        // Same silent failure as push: without the entitlement the button is drawn, tapped,
        // and then does nothing anybody can explain from the outside.
        let url = iosRoot.appendingPathComponent("HivePulse/HivePulse.entitlements")
        let data = try Data(contentsOf: url)
        let plist = try PropertyListSerialization.propertyList(from: data, format: nil)
        let entitlements = try XCTUnwrap(plist as? [String: Any])

        let scopes = entitlements["com.apple.developer.applesignin"] as? [String]
        XCTAssertEqual(scopes, ["Default"])
    }

    func test_theBuildActuallyUsesThatFile() throws {
        // An entitlements file nothing points at is decoration.
        let project = try String(contentsOf: iosRoot.appendingPathComponent("project.yml"), encoding: .utf8)
        XCTAssertTrue(
            project.contains("CODE_SIGN_ENTITLEMENTS: HivePulse/HivePulse.entitlements"),
            "project.yml must point the app target at the entitlements file"
        )
    }

    func test_noSilentPushBackgroundMode() throws {
        // The reminders are ordinary alerts. remote-notification would be a capability we do
        // not use, and Apple asks what it is for.
        let info = try String(contentsOf: iosRoot.appendingPathComponent("HivePulse/Resources/Info.plist"), encoding: .utf8)
        XCTAssertFalse(info.contains("remote-notification"))
    }
}
