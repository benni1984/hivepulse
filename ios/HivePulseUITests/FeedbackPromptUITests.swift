import XCTest

/// The card that asks what somebody thinks, on the screen they land on (#546).
///
/// `FeedbackPromptTests` covers *when* it appears. This covers that it appears at all — on both
/// halves of the apiary list, because the screen has two: a list, and an empty state that is not
/// a list at all. Somebody who has kept the app for three days without naming a colony is
/// exactly who to ask why, and they only ever see the second one.
///
/// The dates arrive as launch arguments, which land in the UserDefaults argument domain and so
/// shadow whatever the simulator kept from an earlier run.
///
/// Every query goes through `element(_:)` rather than `app.buttons[...]` or `app.links[...]`:
/// which class SwiftUI gives a `Link` with a custom button style is not something to guess at,
/// and guessing it is what cost four CI rounds the last time.
final class FeedbackPromptUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    private func element(_ app: XCUIApplication, _ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    private func launch(_ extra: [String], daysOld: Double = 4) -> XCUIApplication {
        let app = XCUIApplication()
        let since = Date().timeIntervalSince1970 - daysOld * 24 * 60 * 60
        app.launchArguments = extra + [
            "-resetKeychain", "-guidedTourSeen", "YES",
            "-feedbackAsked", "NO",
            "-firstLaunchAt", String(since),
        ]
        app.launch()
        return app
    }

    func test_theCardAsksOverTheApiaryList() {
        let app = launch(["-mockApiaryWithHive"])

        XCTAssertTrue(element(app, "feedbackPromptDismiss").waitForExistence(timeout: 15),
                      "the card belongs above the list")
    }

    func test_theCardAlsoAsksOnTheEmptyScreen() {
        // The branch without a List. It is the one this feature would have missed.
        let app = launch(["-mockAuthenticated"])

        XCTAssertTrue(element(app, "feedbackPromptDismiss").waitForExistence(timeout: 15),
                      "an account with no apiaries still sees the question")
    }

    func test_itIsNotAskedOnTheFirstDay() {
        let app = launch(["-mockApiaryWithHive"], daysOld: 0)

        // Wait for the screen to settle, then assert the absence rather than racing it.
        XCTAssertTrue(app.navigationBars.firstMatch.waitForExistence(timeout: 15))
        XCTAssertFalse(element(app, "feedbackPromptDismiss").exists,
                       "somebody who arrived today has nothing to say yet")
    }

    func test_noThanksTakesItAway() {
        let app = launch(["-mockApiaryWithHive"])
        let dismiss = element(app, "feedbackPromptDismiss")
        XCTAssertTrue(dismiss.waitForExistence(timeout: 15))

        dismiss.tap()

        // `waitForExistence` cannot assert an absence; this waits for the disappearance.
        let gone = expectation(for: NSPredicate(format: "exists == false"), evaluatedWith: dismiss)
        wait(for: [gone], timeout: 10)
    }

    func test_theOfferToWriteIsThere() {
        let app = launch(["-mockApiaryWithHive"])

        // Only that it exists. Tapping it hands the simulator a `mailto:` and leaves the app,
        // which tells us nothing and costs a flake.
        XCTAssertTrue(element(app, "feedbackPromptSend").waitForExistence(timeout: 15))
    }
}
