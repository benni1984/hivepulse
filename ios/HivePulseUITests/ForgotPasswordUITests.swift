import XCTest

final class ForgotPasswordUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", "-mockServer"]
        app.launch()
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func test_forgotPassword_prefillsEmailTypedOnLogin() {
        let loginEmail = app.textFields["Email"]
        XCTAssertTrue(loginEmail.waitForExistence(timeout: 5))
        loginEmail.tap()
        loginEmail.typeText("bee@example.com")

        app.buttons["Forgot password?"].tap()

        let field = app.textFields["forgotEmailField"]
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        XCTAssertEqual(field.value as? String, "bee@example.com")
    }

    func test_forgotPassword_sendDisabledWithoutEmail() {
        XCTAssertTrue(app.buttons["Forgot password?"].waitForExistence(timeout: 5))
        app.buttons["Forgot password?"].tap()

        XCTAssertTrue(app.buttons["Send reset link"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["Send reset link"].isEnabled)
    }

    func test_forgotPassword_sendShowsNeutralConfirmation() {
        XCTAssertTrue(app.buttons["Forgot password?"].waitForExistence(timeout: 5))
        app.buttons["Forgot password?"].tap()

        let field = app.textFields["forgotEmailField"]
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        field.tap()
        field.typeText("bee@example.com")
        app.buttons["Send reset link"].tap()

        XCTAssertTrue(app.staticTexts[
            "If that email is registered, you'll receive a reset link shortly. Check your inbox."
        ].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Back to log in"].exists)
    }
}
