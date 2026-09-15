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
        app.buttons["Skip"].tap()

        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 5))
    }

    func test_tour_nextThroughAllPages_thenGetStarted() {
        launch(["-resetKeychain", "-mockServer", "-guidedTourSeen", "NO"])
        logIn()
        XCTAssertTrue(app.staticTexts[pageTitles[0]].waitForExistence(timeout: 5))

        let primary = app.buttons["tourPrimaryButton"]
        XCTAssertTrue(waitForValue(primary, "1/\(pageTitles.count)"))
        // The tour dismisses the sign-in keyboard itself; it must not cover the Next button.
        XCTAssertTrue(waitForKeyboardToDisappear(), "sign-in keyboard still covers the tour")
        // After a password form disappears iOS may offer to save the password in a sheet over the bottom half.
        dismissSavePasswordPromptIfPresent()
        // Right after the cover is presented the button is briefly not hittable while the transition finishes.
        let hittable = XCTWaiter.wait(
            for: [expectation(for: NSPredicate(format: "hittable == true"), evaluatedWith: primary)], timeout: 5
        ) == .completed
        if !hittable {
            captureDiagnostics("guided-tour-next-not-hittable")
        }
        XCTAssertTrue(hittable, "tour Next button is covered")
        for (index, title) in pageTitles.enumerated().dropFirst() {
            primary.tap()
            // The page-style TabView keeps neighbouring pages in the hierarchy, so a title "exists" before its
            // page is selected — the button's value tracks the selected page.
            XCTAssertTrue(waitForValue(primary, "\(index + 1)/\(pageTitles.count)"), "never reached page \"\(title)\"")
            XCTAssertTrue(app.staticTexts[title].exists)
        }
        XCTAssertEqual(primary.label, "Get started")
        primary.tap()

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

    private func dismissSavePasswordPromptIfPresent() {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        for owner in [app!, springboard] {
            let notNow = owner.buttons["Not Now"]
            if notNow.waitForExistence(timeout: 2) {
                notNow.tap()
                return
            }
        }
    }

    /// Attaches a screenshot and the element tree, and writes the PNG to `SCREENSHOT_DIR` so it lands in the
    /// `ios-screenshots` CI artifact.
    private func captureDiagnostics(_ name: String) {
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        print("=== \(name) element tree ===\n\(app.debugDescription)")
        if let dir = ProcessInfo.processInfo.environment["SCREENSHOT_DIR"], !dir.isEmpty {
            let url = URL(fileURLWithPath: dir).appendingPathComponent("zz-\(name).png")
            try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            try? screenshot.pngRepresentation.write(to: url)
        }
    }

    private func waitForKeyboardToDisappear(timeout: TimeInterval = 5) -> Bool {
        let gone = NSPredicate(format: "count == 0")
        return XCTWaiter.wait(for: [expectation(for: gone, evaluatedWith: app.keyboards)], timeout: timeout) == .completed
    }

    private func waitForValue(_ element: XCUIElement, _ value: String, timeout: TimeInterval = 5) -> Bool {
        let predicate = NSPredicate(format: "value == %@", value)
        return XCTWaiter.wait(for: [expectation(for: predicate, evaluatedWith: element)], timeout: timeout) == .completed
    }
}
