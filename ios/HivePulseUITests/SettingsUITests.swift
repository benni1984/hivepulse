import XCTest

final class SettingsUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", "-mockAuthenticated"]
        app.launch()
        navigateToSettings()
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    // MARK: - Top-of-form elements (no scroll needed)

    func test_settings_showsUserEmail() {
        XCTAssertTrue(app.staticTexts["tester@example.com"].waitForExistence(timeout: 5))
    }

    func test_settings_showsLanguageOptions() {
        XCTAssertTrue(app.staticTexts["English"].waitForExistence(timeout: 5))
    }

    func test_settings_showsSaveProfileButton() {
        XCTAssertTrue(app.buttons["Save Profile"].waitForExistence(timeout: 5))
    }

    // MARK: - Lower-form elements (scroll required)

    func test_settings_showsChangePasswordSection() {
        XCTAssertTrue(scrollDownUntilVisible(app.staticTexts["Change Password"]))
    }

    func test_settings_showsChangePasswordButton() {
        app.swipeUp()
        XCTAssertTrue(app.buttons["Change Password"].waitForExistence(timeout: 5))
    }

    func test_settings_showsLogoutButton() {
        app.swipeUp()
        app.swipeUp()
        XCTAssertTrue(app.buttons["Log Out"].waitForExistence(timeout: 5))
    }

    func test_settings_showsDangerZoneSection() {
        app.swipeUp()
        app.swipeUp()
        XCTAssertTrue(app.staticTexts["Danger Zone"].waitForExistence(timeout: 5))
    }

    func test_settings_showsDeleteAccountButton() {
        app.swipeUp()
        app.swipeUp()
        XCTAssertTrue(app.buttons["Delete Account"].waitForExistence(timeout: 5))
    }

    // MARK: - Reminder settings (scroll required)

    func test_settings_showsRemindersSection() {
        app.swipeUp()
        XCTAssertTrue(app.staticTexts["Inspection Reminders"].waitForExistence(timeout: 5))
    }

    func test_settings_showsReminderEnabledToggle() {
        app.swipeUp()
        XCTAssertTrue(app.switches["reminderEnabledToggle"].waitForExistence(timeout: 5))
    }

    func test_settings_showsSaveReminderSettingsButton() {
        app.swipeUp()
        app.swipeUp()
        XCTAssertTrue(app.buttons["saveReminderButton"].waitForExistence(timeout: 5))
    }

    func test_settings_showsEmailReminderToggle() {
        // reminderEnabled defaults to true, so the email channel toggle is visible without interaction
        XCTAssertTrue(scrollDownUntilVisible(app.switches["reminderEmailToggle"]))
    }

    // MARK: - Helper

    private func navigateToSettings() {
        XCTAssertTrue(app.tabBars.buttons["Settings"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Settings"].tap()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 5))
    }

    /// A full-velocity `swipeUp()` can scroll past a target that only needs a small nudge into
    /// view — how far varies by simulator screen size. `.slow` velocity produces a shorter,
    /// gentler scroll per call (less inertial coasting). The Settings `Form` is a lazy
    /// collection view: rows scrolled far off-screen are unloaded, so an overshoot makes the
    /// target stop existing. Swipe the form itself (not the app centre, which can land on the
    /// tab bar during transitions), require the target to be on screen (`isHittable`, not just
    /// `exists`), and if the downward pass misses it, walk back up so an overshoot recovers.
    private func scrollDownUntilVisible(_ element: XCUIElement, maxSteps: Int = 6) -> Bool {
        let form = scrollContainer()
        func isOnScreen() -> Bool { element.exists && element.isHittable }

        if element.waitForExistence(timeout: 2), element.isHittable { return true }
        for _ in 0..<maxSteps {
            form.swipeUp(velocity: .slow)
            if isOnScreen() { return true }
        }
        for _ in 0..<maxSteps {
            form.swipeDown(velocity: .slow)
            if isOnScreen() { return true }
        }
        return element.waitForExistence(timeout: 5) && element.isHittable
    }

    private func scrollContainer() -> XCUIElement {
        let collection = app.collectionViews.firstMatch
        if collection.waitForExistence(timeout: 2) { return collection }
        let table = app.tables.firstMatch
        return table.exists ? table : app
    }
}
