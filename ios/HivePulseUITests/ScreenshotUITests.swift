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

    // MARK: - Core functionality, for the store listing

    /// Recording a visit without a signal, and seeing it marked as waiting. The single
    /// strongest argument for the app, and it was missing from the captures.
    func test_capture_offline_pending() {
        let app = launch(["-resetKeychain", "-mockApiaryOffline"])
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 10))
        app.staticTexts["Meadow"].tap()
        XCTAssertTrue(app.staticTexts["Hive Alpha"].waitForExistence(timeout: 10))
        app.staticTexts["Hive Alpha"].tap()

        XCTAssertTrue(app.buttons[label("action.newInspection")].waitForExistence(timeout: 10))
        app.buttons[label("action.newInspection")].tap()
        XCTAssertTrue(app.navigationBars[label("action.newInspection")].waitForExistence(timeout: 10))
        app.navigationBars.buttons[label("action.save")].tap()

        let badge = app.staticTexts[label("offline.pendingUpload")]
        XCTAssertTrue(badge.waitForExistence(timeout: 10), "the pending marker never appeared")
        snap("20-offline-pending", app)
    }

    /// What the logbook is for: the season of one colony as a curve.
    func test_capture_hive_statistics() {
        let app = launch(["-resetKeychain", "-mockApiaryWithHive"])
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 10))
        app.staticTexts["Meadow"].tap()
        XCTAssertTrue(app.staticTexts["Hive Alpha"].waitForExistence(timeout: 10))
        app.staticTexts["Hive Alpha"].tap()

        let stats = app.buttons["hiveStatsButton"]
        XCTAssertTrue(stats.waitForExistence(timeout: 10))
        stats.tap()
        // The sheet needs a moment to draw its chart before it is worth photographing.
        Thread.sleep(forTimeInterval: 1.5)
        snap("21-hive-stats", app)
    }

    /// The hornet tracker, which is the reason many beekeepers hear about this at all.
    func test_capture_hornet_tracker() {
        let app = launch(["-resetKeychain", "-mockAuthenticated"])
        let hornets = app.tabBars.buttons[label("tab.hornets")]
        XCTAssertTrue(hornets.waitForExistence(timeout: 10))
        hornets.tap()
        Thread.sleep(forTimeInterval: 1.5)
        snap("22-hornets", app)
    }

    /// What the apiary list shows first: the day at a glance.
    func test_capture_home_summary() {
        let app = launch(["-resetKeychain", "-mockApiaryWithHive", "-mockHomeSummary"])
        XCTAssertTrue(app.staticTexts[label("home.nextInspection")].waitForExistence(timeout: 10))
        Thread.sleep(forTimeInterval: 1.0)
        snap("23-home-summary", app)
    }

    /// The pages behind the newer tools of a hive: planned treatments, where it has stood, working together.
    func test_capture_treatments_moves_and_sharing() {
        let app = launch(["-resetKeychain", "-mockApiaryWithHive", "-mockNewTools"])
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 10))
        app.staticTexts["Meadow"].tap()
        XCTAssertTrue(app.staticTexts["Hive Alpha"].waitForExistence(timeout: 10))
        app.staticTexts["Hive Alpha"].tap()

        let treatments = app.buttons["hiveTreatmentsLink"]
        XCTAssertTrue(treatments.waitForExistence(timeout: 10))
        treatments.tap()
        Thread.sleep(forTimeInterval: 1.5)
        snap("24-treatments", app)
        app.navigationBars.buttons.element(boundBy: 0).tap()

        let moves = app.buttons["hiveMovesLink"]
        XCTAssertTrue(moves.waitForExistence(timeout: 10))
        moves.tap()
        Thread.sleep(forTimeInterval: 1.5)
        snap("25-moves", app)
        app.navigationBars.buttons.element(boundBy: 0).tap()

        let share = app.buttons["shareHiveButton"]
        XCTAssertTrue(share.waitForExistence(timeout: 10))
        share.tap()
        Thread.sleep(forTimeInterval: 1.5)
        snap("26-sharing", app)
    }

    /// The beekeeper's year: what to do when, moved to the beekeeper's place.
    func test_capture_beekeeping_year() {
        let app = launch(["-resetKeychain", "-mockApiaryWithHive", "-mockNewTools"])
        let button = app.buttons["beekeepingYearButton"]
        XCTAssertTrue(button.waitForExistence(timeout: 10))
        button.tap()
        // The list loads, lays itself out and scrolls itself to today a moment after it opens.
        Thread.sleep(forTimeInterval: 3.0)
        snap("27-beekeeping-year", app)
    }

    // MARK: - The listing's own pictures
    //
    // The store listing shows the tools that came with the home summary, with something in them: the
    // other captures above use the empty pages the help texts describe. These ride on -mockStoreData.

    /// Where the hives went: the map of moves with three journeys.
    func test_capture_store_moves_map() {
        let app = launch(["-resetKeychain", "-mockApiaryWithHive", "-mockNewTools", "-mockStoreData"])
        let button = app.buttons["movesOverviewButton"]
        XCTAssertTrue(button.waitForExistence(timeout: 10))
        button.tap()
        // The map tiles come from Apple's servers and draw after the screen does.
        Thread.sleep(forTimeInterval: 5.0)
        snap("28-moves-map", app)
    }

    /// What is planned for the hives: two treatments to do and one done.
    func test_capture_store_treatments() {
        let app = launch(["-resetKeychain", "-mockApiaryWithHive", "-mockNewTools", "-mockStoreData"])
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 10))
        app.staticTexts["Meadow"].tap()
        XCTAssertTrue(app.staticTexts["Hive Alpha"].waitForExistence(timeout: 10))
        app.staticTexts["Hive Alpha"].tap()

        let treatments = app.buttons["hiveTreatmentsLink"]
        XCTAssertTrue(treatments.waitForExistence(timeout: 10))
        treatments.tap()
        Thread.sleep(forTimeInterval: 2.0)
        snap("29-treatments-planned", app)
    }

    /// How the region is doing: the health map with its soft patches, brought into view.
    func test_capture_store_health_map() {
        let app = launch(["-resetKeychain", "-mockAuthenticatedSupporter"])
        XCTAssertTrue(app.tabBars.buttons[label("tab.members")].waitForExistence(timeout: 10))
        app.tabBars.buttons[label("tab.members")].tap()
        let map = app.descendants(matching: .any)["communityHeatmapMap"]
        XCTAssertTrue(map.waitForExistence(timeout: 10))
        // The map sits under the community figures.
        for _ in 0..<5 where !map.isHittable { app.swipeUp() }
        // Tiles, and the patches drawn over them.
        Thread.sleep(forTimeInterval: 4.0)
        snap("30-health-map", app)
    }

    // MARK: - Helpers

    /// The language this run captures, from SCREENSHOT_LANG; English when unset.
    private var language: String {
        // The workflow passes TEST_RUNNER_SCREENSHOT_LANG; xcodebuild strips that prefix
        // before handing it to this process, and anything without it never arrives at all.
        let value = ProcessInfo.processInfo.environment["SCREENSHOT_LANG"] ?? "en"
        guard ["en", "de", "fr", "es", "pl"].contains(value) else {
            XCTFail("SCREENSHOT_LANG=\(value) is not one of the five store languages")
            return "en"
        }
        return value
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
