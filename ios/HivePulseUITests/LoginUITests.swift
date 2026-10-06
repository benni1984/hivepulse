import XCTest

final class LoginUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain"]
        app.launch()
        // The form appears once the app has heard from the server which sign-ins it offers,
        // so it is no longer there at launch. Waiting here, once, instead of in every test.
        XCTAssertTrue(app.textFields["Email"].waitForExistence(timeout: 10))
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func test_loginScreen_showsEmailAndPasswordFields() {
        XCTAssertTrue(app.textFields["Email"].exists)
        XCTAssertTrue(app.secureTextFields["Password"].exists)
    }

    func test_loginScreen_loginButtonDisabledWhenFieldsEmpty() {
        let btn = app.buttons["Log In"]
        XCTAssertTrue(btn.exists)
        XCTAssertFalse(btn.isEnabled)
    }

    func test_loginScreen_loginButtonEnabledWhenBothFieldsFilled() {
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("test@example.com")
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("password123")
        XCTAssertTrue(app.buttons["Log In"].isEnabled)
    }

    func test_loginScreen_loginButtonDisabledWithOnlyEmail() {
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("test@example.com")
        XCTAssertFalse(app.buttons["Log In"].isEnabled)
    }

    func test_loginScreen_showsCreateAccountLink() {
        XCTAssertTrue(app.buttons["Create an account"].exists)
    }

    func test_loginScreen_createAccountNavigatesToRegisterScreen() {
        app.buttons["Create an account"].tap()
        XCTAssertTrue(app.textFields["Name"].waitForExistence(timeout: 5))
    }

    func test_loginScreen_showsForgotPasswordButton() {
        XCTAssertTrue(app.buttons["Forgot password?"].waitForExistence(timeout: 5))
    }
}
