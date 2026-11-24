import XCTest

/// The tour points at the real button and waits for the real tap (#449).
///
/// The carousel had `GuidedTourUITests`, which swiped through six pages and pressed "Get
/// started". There is nothing to swipe any more, so what this asserts instead is the thing the
/// issue is about: that every tour is reachable from Settings for ever, that starting one lights
/// a real control, and that the control underneath is *still a control* — the overlay is drawn
/// around it, not over it.
///
/// Queries go by identifier and by element class, never by guesswork: four CI rounds at forty
/// minutes each were lost to that, and `app.debugDescription` goes into every failure message
/// so the next one is not.
final class TourUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", "-mockApiaryWithHive", "-guidedTourSeen", "YES"]
        app.launch()
        return app
    }

    /// Settings, then the one row that opens the tours — they have a screen of their own, so
    /// that nine rows with a sentence each do not push the danger zone off the end of Settings.
    private func openTheTourList(_ app: XCUIApplication) {
        let settings = app.tabBars.buttons.element(boundBy: 4)
        XCTAssertTrue(settings.waitForExistence(timeout: 20),
                      "no settings tab\n\(app.debugDescription)")
        settings.tap()

        let link = app.buttons["guidedToursLink"]
        for _ in 0..<8 where !link.exists { app.swipeUp(velocity: .slow) }
        XCTAssertTrue(link.waitForExistence(timeout: 10),
                      "no way into the tours from Settings\n\(app.debugDescription)")
        link.tap()
    }

    func testEveryTourIsOfferedInSettings() throws {
        // The half the carousel could not be: all of them, by name, startable, for ever.
        let app = launch()
        openTheTourList(app)

        let first = app.buttons["startTour-first-steps"]
        XCTAssertTrue(first.waitForExistence(timeout: 20),
                      "the tour list did not open\n\(app.debugDescription)")

        for id in ["offline", "qr-codes", "hornets", "year", "treatments",
                   "sharing", "custom-fields", "moves"] {
            let button = app.buttons["startTour-\(id)"]
            if !button.exists { app.swipeUp() }
            XCTAssertTrue(button.waitForExistence(timeout: 5),
                          "no way to start \(id)\n\(app.debugDescription)")
        }
    }

    func testStartingATourLightsAControlAndCanBeLeft() throws {
        let app = launch()
        openTheTourList(app)

        let start = app.buttons["startTour-first-steps"]
        XCTAssertTrue(start.waitForExistence(timeout: 20),
                      "the tour list did not open\n\(app.debugDescription)")
        start.tap()

        // It takes the beekeeper to the tab the first step lives on by itself: the list in
        // Settings is the one place where every tour starts somewhere else.
        // The caption, not the card: an identifier on the card's stack is stamped onto each of
        // its children rather than making one container element (see `TourHost.card`).
        let card = app.staticTexts["tourText"]
        XCTAssertTrue(card.waitForExistence(timeout: 10),
                      "no tour card after starting\n\(app.debugDescription)")

        // Never trap them: a way out on every step.
        let stop = app.buttons["tourStop"]
        XCTAssertTrue(stop.waitForExistence(timeout: 5),
                      "no way out of the tour\n\(app.debugDescription)")
        stop.tap()
        XCTAssertTrue(card.waitForNonExistence(timeout: 5),
                      "the tour did not close\n\(app.debugDescription)")
    }

    func testTheLitControlIsStillAControl() throws {
        // The overlay goes around the target, never over it. If that were wrong this tap would
        // land on a shade and the form would never open — which is exactly the bug the four
        // rectangles on the website exist to avoid.
        let app = launch()
        openTheTourList(app)

        let start = app.buttons["startTour-first-steps"]
        XCTAssertTrue(start.waitForExistence(timeout: 20),
                      "the tour list did not open\n\(app.debugDescription)")
        start.tap()

        let newApiary = app.buttons["newApiaryButton"]
        XCTAssertTrue(newApiary.waitForExistence(timeout: 10),
                      "the tour did not reach the apiary list\n\(app.debugDescription)")
        newApiary.tap()

        // The form opened, so the tap went through the overlay to the real button.
        XCTAssertTrue(app.navigationBars.buttons["Save"].waitForExistence(timeout: 10)
                      || app.textFields.firstMatch.waitForExistence(timeout: 5),
                      "the create form did not open\n\(app.debugDescription)")
    }
}
