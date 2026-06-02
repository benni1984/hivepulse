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

    func test_settings_showsChangePasswordSection() {
        XCTAssertTrue(app.staticTexts["Change Password"].waitForExistence(timeout: 5))
    }

    // MARK: - Lower-form elements (scroll required)

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

    // MARK: - Helper

    private func navigateToSettings() {
        XCTAssertTrue(app.tabBars.buttons["Settings"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Settings"].tap()
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 5))
    }
}
