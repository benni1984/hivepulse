import XCTest

/// The card that asks what somebody thinks, on the screen they land on (#546).
///
/// `FeedbackPromptTests` covers *when* it appears. This covers that it appears at all — on both
/// halves of the apiary list, because the screen has two: a list, and an empty state that is not
/// a list. Somebody who has had the app for three days without naming a colony is exactly who to
/// ask why, and they only ever see the second one.
///
/// Three days cannot be waited out in a simulator, so `-mockFeedbackDue` brings the question
/// forward, the way `-mockStoreOffers` stands in for a store and `-mockCameraPreview` for a
/// camera.
///
/// Every query goes through `element(_:)` rather than `app.buttons[...]` or `app.links[...]`:
/// which class SwiftUI gives a `Link` with a custom button style is not something to guess at.
/// And every assertion carries the element tree, because two rounds of this went on guesses —
/// first a date in the UserDefaults argument domain that never arrived, then an accessibility
/// identifier on the card's own stack, which can make SwiftUI treat the container as the
/// element and hide the buttons inside it. A failure that says what *was* on screen ends that.
final class FeedbackPromptUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    private func element(_ app: XCUIApplication, _ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    /// The whole element tree, trimmed to something a job log can carry.
    private func whatIsOnScreen(_ app: XCUIApplication) -> String {
        String(app.debugDescription.prefix(6000))
    }

    private func launch(_ extra: [String]) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = extra + ["-resetKeychain", "-guidedTourSeen", "YES"]
        app.launch()
        return app
    }

    func test_theCardAsksOverTheApiaryList() {
        let app = launch(["-mockApiaryWithHive", "-mockFeedbackDue"])

        let dismiss = element(app, "feedbackPromptDismiss")
        XCTAssertTrue(dismiss.waitForExistence(timeout: 15),
                      "the card belongs above the list. On screen:\n\(whatIsOnScreen(app))")
    }

    func test_theCardAlsoAsksOnTheEmptyScreen() {
        // The branch without a List. It is the one this feature would have missed.
        let app = launch(["-mockAuthenticated", "-mockFeedbackDue"])

        let dismiss = element(app, "feedbackPromptDismiss")
        XCTAssertTrue(dismiss.waitForExistence(timeout: 15),
                      "an account with no apiaries still sees the question. On screen:\n"
                      + whatIsOnScreen(app))
    }

    func test_aFreshInstallIsNotAskedAnything() {
        // Without the flag the real rule applies, and on a device whose first launch is now,
        // that rule says nothing. Somebody who arrived today has nothing to say yet.
        let app = launch(["-mockApiaryWithHive"])

        XCTAssertTrue(app.navigationBars.firstMatch.waitForExistence(timeout: 15))
        XCTAssertFalse(element(app, "feedbackPromptDismiss").exists)
    }

    func test_noThanksTakesItAway() {
        let app = launch(["-mockApiaryWithHive", "-mockFeedbackDue"])
        let dismiss = element(app, "feedbackPromptDismiss")
        XCTAssertTrue(dismiss.waitForExistence(timeout: 15), whatIsOnScreen(app))

        dismiss.tap()

        // `waitForExistence` cannot assert an absence; this waits for the disappearance.
        let gone = expectation(for: NSPredicate(format: "exists == false"), evaluatedWith: dismiss)
        wait(for: [gone], timeout: 10)
    }

    func test_theOfferToWriteIsThere() {
        let app = launch(["-mockApiaryWithHive", "-mockFeedbackDue"])

        // Only that it exists. Tapping it hands the simulator a `mailto:` and leaves the app,
        // which tells us nothing and costs a flake.
        XCTAssertTrue(element(app, "feedbackPromptSend").waitForExistence(timeout: 15),
                      whatIsOnScreen(app))
    }
}
