import XCTest

final class GuidedTourUITests: XCTestCase {

    private var app: XCUIApplication!

    private let pageTitles = [
        "Welcome to HivePulse", "Every hive at a scan", "Inspections in seconds",
        "Spot problems early", "Never miss an inspection", "Protect your region",
    ]

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    // MARK: - Tests

    func test_firstLogin_showsTour_andSkipOpensApiaries() {
        launch(["-resetKeychain", "-mockServer", "-guidedTourSeen", "NO"])
        logIn()

        XCTAssertTrue(app.staticTexts["Welcome to HivePulse"].waitForExistence(timeout: 5))
        dismissSystemAlertIfPresent()
        app.buttons["Skip"].tap()

        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 5))
    }

    func test_tour_nextThroughAllPages_thenGetStarted() {
        launch(["-resetKeychain", "-mockServer", "-guidedTourSeen", "NO"])
        logIn()
        XCTAssertTrue(app.staticTexts[pageTitles[0]].waitForExistence(timeout: 5))
        dismissSystemAlertIfPresent()

        for title in pageTitles.dropFirst() {
            app.buttons["Next"].tap()
            XCTAssertTrue(app.staticTexts[title].waitForExistence(timeout: 5))
        }
        XCTAssertTrue(app.buttons["Get started"].waitForExistence(timeout: 5))
        app.buttons["Get started"].tap()

        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 5))
    }

    func test_loginWhenTourAlreadySeen_goesStraightToApiaries() {
        launch(["-resetKeychain", "-mockServer", "-guidedTourSeen", "YES"])
        logIn()

        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["Skip"].exists)
    }

    func test_settings_showGuidedTourAgain_opensTourAndReturns() {
        launch(["-resetKeychain", "-mockAuthenticated", "-guidedTourSeen", "YES"])
        dismissSystemAlertIfPresent()
        XCTAssertTrue(app.tabBars.buttons["Settings"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Settings"].tap()

        let showAgain = app.buttons["showGuidedTourButton"]
        for _ in 0..<8 where !showAgain.exists { app.swipeUp(velocity: .slow) }
        XCTAssertTrue(showAgain.waitForExistence(timeout: 5))
        showAgain.tap()

        XCTAssertTrue(app.staticTexts["Welcome to HivePulse"].waitForExistence(timeout: 5))
        app.buttons["Skip"].tap()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 5))
    }

    // MARK: - Helpers

    private func launch(_ arguments: [String]) {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = arguments
        app.launch()
    }

    private func logIn() {
        let email = app.textFields["Email"]
        XCTAssertTrue(email.waitForExistence(timeout: 5))
        email.tap()
        email.typeText("tester@example.com")
        let password = app.secureTextFields["Password"]
        password.tap()
        password.typeText("password123")
        app.buttons["Log In"].tap()
    }

    /// Signing in asks for notification permission; the springboard alert would swallow taps meant for the tour.
    private func dismissSystemAlertIfPresent() {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        for label in ["Allow", "Don\u{2019}t Allow", "Don't Allow"] {
            let button = springboard.buttons[label]
            if button.waitForExistence(timeout: 2) {
                button.tap()
                return
            }
        }
    }
}
