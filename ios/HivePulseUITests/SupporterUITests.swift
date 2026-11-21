import XCTest

/// The paywall, reached the two ways a beekeeper can reach it.
///
/// A simulator has no store account, so the real service could only ever show "not for sale here"
/// — `-mockStoreOffers` stands in for the till, the way `-mockCameraPreview` stands in for the
/// camera. Queries go by accessibility identifier or by class, never by guessing at SwiftUI's
/// element tree.
final class SupporterUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    private func launch(_ extra: [String]) {
        app.launchArguments = ["-resetKeychain", "-mockAuthenticated"] + extra
        app.launch()
    }

    private func openFromSettings() {
        XCTAssertTrue(app.tabBars.buttons["Settings"].waitForExistence(timeout: 10))
        app.tabBars.buttons["Settings"].tap()
        let row = app.buttons["settingsSupporter"]
        XCTAssertTrue(row.waitForExistence(timeout: 10), "Settings must offer the supporter page")
        row.tap()
    }

    // MARK: - Reaching it

    func test_settingsHasTheSupporterRow() {
        // A store reviewer who cannot find the purchase rejects the build, so this row existing
        // is itself the thing under test.
        launch(["-mockStoreOffers"])

        XCTAssertTrue(app.tabBars.buttons["Settings"].waitForExistence(timeout: 10))
        app.tabBars.buttons["Settings"].tap()

        XCTAssertTrue(app.buttons["settingsSupporter"].waitForExistence(timeout: 10))
    }

    func test_theMembersGateOpensThePaywallRatherThanALink() {
        // It used to open /contribute in Safari: an external purchase route, and a dead end since
        // that page stopped mentioning the subscription (#535). It must stay inside the app.
        launch(["-mockStoreOffers"])

        XCTAssertTrue(app.tabBars.buttons["Members"].waitForExistence(timeout: 10))
        app.tabBars.buttons["Members"].tap()
        let gate = app.buttons["membersBecomeSupporter"]
        XCTAssertTrue(gate.waitForExistence(timeout: 10))
        gate.tap()

        XCTAssertTrue(app.buttons["supporterRestore"].waitForExistence(timeout: 10),
                      "the app's own paywall should be showing, not a browser")
    }

    // MARK: - What it shows

    func test_aPriceIsShownWhenTheStoreHasSomethingToSell() {
        launch(["-mockStoreOffers"])
        openFromSettings()

        XCTAssertTrue(app.buttons["supporterBuy_$rc_annual"].waitForExistence(timeout: 10))
    }

    func test_restoreIsReachableWithoutBuyingAnything() {
        // Apple requires it, and somebody who changed phone has no other way back to what they
        // paid for.
        launch(["-mockStoreOffers"])
        openFromSettings()

        XCTAssertTrue(app.buttons["supporterRestore"].waitForExistence(timeout: 10))
    }

    func test_aStoreWithNoProductsSaysSoInsteadOfShowingAnEmptyList() {
        // What a deployment looks like before the console work is finished. An empty page under a
        // "Support HivePulse" heading reads as broken.
        launch(["-mockStoreOffers", "-mockStoreEmpty"])
        openFromSettings()

        XCTAssertTrue(app.staticTexts["supporterUnavailable"].waitForExistence(timeout: 10))
    }

    func test_aDismissedSheetLeavesThePageAsItWas() {
        // A cancellation is not an error. The offer has to still be there to buy.
        launch(["-mockStoreOffers", "-mockStoreCancels"])
        openFromSettings()
        let buy = app.buttons["supporterBuy_$rc_annual"]
        XCTAssertTrue(buy.waitForExistence(timeout: 10))

        buy.tap()

        XCTAssertTrue(buy.waitForExistence(timeout: 10), "the offer must survive a cancellation")
        XCTAssertFalse(app.staticTexts["supporterActive"].exists)
    }

    func test_anAccountThatAlreadyPaidIsNotSoldToAgain() {
        // Including a web purchase and an admin grant: the server is what knows, and the paywall
        // has to ask before it offers.
        app.launchArguments = ["-resetKeychain", "-mockAuthenticatedSupporter", "-mockStoreOffers"]
        app.launch()
        openFromSettings()

        XCTAssertTrue(app.staticTexts["supporterActive"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["supporterManage"].exists,
                      "and it must point at the place that can actually cancel")
    }
}
