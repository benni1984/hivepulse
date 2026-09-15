import XCTest

/// Captures the main screens with mock data so the design can be reviewed from CI without a Mac.
/// Each screenshot is attached to the result bundle and, when `SCREENSHOT_DIR` is set (CI passes
/// `TEST_RUNNER_SCREENSHOT_DIR`), also written there as a PNG and uploaded as the `ios-screenshots` artifact.
final class ScreenshotUITests: XCTestCase {

    override func setUp() {
        super.setUp()
        continueAfterFailure = true
    }

    func test_capture_login_and_register() {
        let app = launch(["-resetKeychain"])
        XCTAssertTrue(app.buttons["Log In"].waitForExistence(timeout: 10))
        snap("01-login", app)

        app.buttons["Create an account"].tap()
        XCTAssertTrue(app.textFields["Name"].waitForExistence(timeout: 10))
        snap("02-register", app)
    }

    func test_capture_apiary_list_detail_and_hive() {
        let app = launch(["-resetKeychain", "-mockApiaryWithHive"])
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 10))
        snap("03-apiaries", app)

        app.staticTexts["Meadow"].tap()
        XCTAssertTrue(app.staticTexts["Hive Alpha"].waitForExistence(timeout: 10))
        snap("04-apiary-detail", app)

        app.staticTexts["Hive Alpha"].tap()
        XCTAssertTrue(app.navigationBars["Hive Alpha"].waitForExistence(timeout: 10))
        snap("05-hive-detail", app)
    }

    func test_capture_empty_apiaries_settings_and_members_gate() {
        let app = launch(["-resetKeychain", "-mockAuthenticated"])
        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 10))
        snap("06-apiaries-empty", app)

        app.tabBars.buttons["Settings"].tap()
        XCTAssertTrue(app.staticTexts["QR Batches"].waitForExistence(timeout: 10))
        snap("07-settings", app)

        app.staticTexts["QR Batches"].tap()
        XCTAssertTrue(app.navigationBars["QR Batches"].waitForExistence(timeout: 10))
        snap("08-qr-batches", app)

        app.tabBars.buttons["Members"].tap()
        XCTAssertTrue(app.staticTexts["Supporter Feature"].waitForExistence(timeout: 10))
        snap("09-members-gate", app)
    }

    func test_capture_members_supporter() {
        let app = launch(["-resetKeychain", "-mockAuthenticatedSupporter"])
        XCTAssertTrue(app.tabBars.buttons["Members"].waitForExistence(timeout: 10))
        app.tabBars.buttons["Members"].tap()
        sleep(2)
        snap("10-members-supporter", app)
    }

    func test_capture_qr_batch_pdf() {
        let app = launch(["-resetKeychain", "-mockQrBatch"])
        XCTAssertTrue(app.tabBars.buttons["Settings"].waitForExistence(timeout: 10))
        app.tabBars.buttons["Settings"].tap()
        XCTAssertTrue(app.staticTexts["QR Batches"].waitForExistence(timeout: 10))
        app.staticTexts["QR Batches"].tap()
        let row = app.collectionViews.cells.firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 10))
        row.tap()
        XCTAssertTrue(app.buttons["downloadPdfButton"].waitForExistence(timeout: 10))
        snap("11-qr-batch-detail", app)

        app.buttons["downloadPdfButton"].tap()
        sleep(3)
        snap("12-qr-batch-pdf-preview", app)
    }

    func test_capture_guided_tour() {
        let app = launch(["-resetKeychain", "-mockAuthenticated", "-guidedTourSeen", "YES"])
        XCTAssertTrue(app.tabBars.buttons["Settings"].waitForExistence(timeout: 10))
        app.tabBars.buttons["Settings"].tap()
        let showAgain = app.buttons["showGuidedTourButton"]
        for _ in 0..<8 where !showAgain.exists { app.swipeUp(velocity: .slow) }
        XCTAssertTrue(showAgain.waitForExistence(timeout: 10))
        showAgain.tap()

        XCTAssertTrue(app.staticTexts["Welcome to HivePulse"].waitForExistence(timeout: 10))
        snap("13-guided-tour-welcome", app)

        app.buttons["Next"].tap()
        XCTAssertTrue(app.staticTexts["Every hive at a scan"].waitForExistence(timeout: 10))
        sleep(1)
        snap("14-guided-tour-qr", app)
    }

    // MARK: - Helpers

    private func launch(_ arguments: [String]) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = arguments
        app.launch()
        return app
    }

    private func snap(_ name: String, _ app: XCUIApplication) {
        let screenshot = XCUIScreen.main.screenshot()

        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)

        guard let dir = ProcessInfo.processInfo.environment["SCREENSHOT_DIR"], !dir.isEmpty else { return }
        let url = URL(fileURLWithPath: dir).appendingPathComponent("\(name).png")
        try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try? screenshot.pngRepresentation.write(to: url)
    }
}
