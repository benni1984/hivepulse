import XCTest

/// A session that ends while the app is open (#467).
///
/// Reported from a TestFlight build: the apiary list opened, stayed empty, and an alert said
/// "Anmeldeinformationen konnten nicht überprüft werden" — the backend's `TOKEN_INVALID`, shown
/// to somebody who has no token to do anything about. Tapping OK left them on an empty list,
/// apparently still signed in, with no way forward but finding the sign-out button in Settings.
///
/// The cause was a classification: `/auth/refresh` carries no Authorization header, so its 401
/// was read as a refused sign-in rather than as the end of a session. The app launched here has
/// tokens the server has forgotten, which is a refresh token past its thirty days.
final class SessionExpiryUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-mockSessionExpired", "-guidedTourSeen", "YES"]
        app.launch()
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func test_anExpiredSessionLandsOnTheSignInScreen() {
        // The same marker LoginUITests uses for "this is the sign-in screen".
        XCTAssertTrue(
            app.textFields["Email"].waitForExistence(timeout: 20),
            "An expired session left the app somewhere other than sign-in"
        )
        XCTAssertTrue(app.secureTextFields["Password"].exists)
    }

    func test_itDoesNotLeaveTheBackendsSentenceAboutTokensOnScreen() {
        XCTAssertTrue(app.textFields["Email"].waitForExistence(timeout: 20))

        // What the user saw before: a message about credentials they never typed.
        XCTAssertFalse(app.staticTexts["Could not validate credentials."].exists)
    }
}
