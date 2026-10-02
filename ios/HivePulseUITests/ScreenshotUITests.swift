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
        XCTAssertTrue(app.buttons[label("action.login")].waitForExistence(timeout: 10))
        snap("01-login", app)

        app.buttons[label("action.register")].tap()
        XCTAssertTrue(app.textFields[label("field.name")].waitForExistence(timeout: 10))
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
        XCTAssertTrue(app.navigationBars[label("tab.apiaries")].waitForExistence(timeout: 10))
        snap("06-apiaries-empty", app)

        // QR batches now live in the apiary list toolbar
        app.buttons["qrBatchesButton"].tap()
        XCTAssertTrue(app.navigationBars[label("screen.qrBatches")].waitForExistence(timeout: 10))
        snap("08-qr-batches", app)
        app.navigationBars[label("screen.qrBatches")].buttons.firstMatch.tap()

        app.tabBars.buttons[label("tab.settings")].tap()
        XCTAssertTrue(app.buttons[label("action.saveProfile")].waitForExistence(timeout: 10))
        snap("07-settings", app)

        app.tabBars.buttons[label("tab.members")].tap()
        XCTAssertTrue(app.staticTexts[label("members.gate.title")].waitForExistence(timeout: 10))
        snap("09-members-gate", app)
    }

    func test_capture_members_supporter() {
        let app = launch(["-resetKeychain", "-mockAuthenticatedSupporter"])
        XCTAssertTrue(app.tabBars.buttons[label("tab.members")].waitForExistence(timeout: 10))
        app.tabBars.buttons[label("tab.members")].tap()
        sleep(2)
        snap("10-members-supporter", app)
    }

    func test_capture_qr_batch_pdf() {
        let app = launch(["-resetKeychain", "-mockQrBatch"])
        XCTAssertTrue(app.navigationBars[label("tab.apiaries")].waitForExistence(timeout: 10))
        app.buttons["qrBatchesButton"].tap()
        XCTAssertTrue(app.navigationBars[label("screen.qrBatches")].waitForExistence(timeout: 10))
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
        XCTAssertTrue(app.tabBars.buttons[label("tab.settings")].waitForExistence(timeout: 10))
        app.tabBars.buttons[label("tab.settings")].tap()
        let showAgain = app.buttons["showGuidedTourButton"]
        for _ in 0..<8 where !showAgain.exists { app.swipeUp(velocity: .slow) }
        XCTAssertTrue(showAgain.waitForExistence(timeout: 10))
        showAgain.tap()

        XCTAssertTrue(app.staticTexts[label("tour.welcome.title")].waitForExistence(timeout: 10))
        snap("13-guided-tour-welcome", app)

        app.buttons[label("action.next")].tap()
        XCTAssertTrue(app.staticTexts[label("tour.qr.title")].waitForExistence(timeout: 10))
        sleep(1)
        snap("14-guided-tour-qr", app)
    }

    func test_capture_home_screen_icon() {
        let app = launch(["-resetKeychain"])
        XCTAssertTrue(app.buttons[label("action.login")].waitForExistence(timeout: 10))
        XCUIDevice.shared.press(.home)
        sleep(2)
        snap("15-home-screen-icon", app)
    }

    /// The inspection form, the hive edit sheet and the apiary edit sheet were never captured,
    /// so the help pages had no picture of how an inspection is logged or how an apiary is
    /// put on the public map.
    func test_capture_inspection_form_and_edit_sheets() {
        let app = launch(["-resetKeychain", "-mockApiaryWithHive"])
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 10))

        app.staticTexts["Meadow"].tap()
        XCTAssertTrue(app.staticTexts["Hive Alpha"].waitForExistence(timeout: 10))

        // Apiary edit sheet — holds the public-map toggle
        app.buttons["editApiaryButton"].tap()
        XCTAssertTrue(app.switches["apiaryPublicToggle"].waitForExistence(timeout: 10))
        snap("16-apiary-edit", app)
        app.buttons[label("action.cancel")].tap()

        app.staticTexts["Hive Alpha"].tap()
        XCTAssertTrue(app.navigationBars["Hive Alpha"].waitForExistence(timeout: 10))

        // Hive edit sheet
        app.buttons["editHiveButton"].tap()
        XCTAssertTrue(app.textFields["hiveEditName"].waitForExistence(timeout: 10))
        snap("17-hive-edit", app)
        app.buttons[label("action.cancel")].tap()

        // Inspection form: top, then the frame buttons further down
        XCTAssertTrue(app.buttons[label("action.newInspection")].waitForExistence(timeout: 10))
        app.buttons[label("action.newInspection")].tap()
        XCTAssertTrue(app.navigationBars[label("action.newInspection")].waitForExistence(timeout: 10))
        snap("18-inspection-form", app)

        let eight = app.buttons["broodFrames8"]
        for _ in 0..<6 where !(eight.exists && eight.isHittable) {
            app.swipeUp(velocity: .slow)
        }
        XCTAssertTrue(eight.exists, "frame buttons never came into view")
        snap("19-inspection-frames", app)
    }

    // MARK: - Helpers

    /// The language this run captures, from SCREENSHOT_LANG; English when unset.
    private var language: String {
        let value = ProcessInfo.processInfo.environment["SCREENSHOT_LANG"] ?? "en"
        return ["en", "de", "fr", "es"].contains(value) ? value : "en"
    }

    /// The app's own translation for `key`, in the language being captured.
    ///
    /// Looking elements up by their English label only works while the app is in English, so
    /// a German run found nothing. A UI test runs in its own process and cannot read the app
    /// bundle, so the same .lproj folders are built into the test bundle (see project.yml).
    private func label(_ key: String) -> String {
        guard let path = Bundle(for: Self.self).path(forResource: language, ofType: "lproj"),
              let bundle = Bundle(path: path) else {
            XCTFail("\(language).lproj is missing from the test bundle")
            return key
        }
        let value = bundle.localizedString(forKey: key, value: "@@missing@@", table: nil)
        XCTAssertNotEqual(value, "@@missing@@", "\(key) is not translated in \(language)")
        return value
    }

    private func launch(_ arguments: [String]) -> XCUIApplication {
        let app = XCUIApplication()
        // -AppleLanguages makes the app itself render in the captured language; xcodebuild's
        // -testLanguage covers the runner, not the app under test.
        app.launchArguments = arguments + ["-AppleLanguages", "(\(language))", "-AppleLocale", language]
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
        let url = URL(fileURLWithPath: dir)
            .appendingPathComponent(language)
            .appendingPathComponent("\(name).png")
        try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try? screenshot.pngRepresentation.write(to: url)
    }
}
