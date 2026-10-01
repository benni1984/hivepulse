import XCTest

/// The whole point of the offline work: a beekeeper standing at a hive without a signal
/// records the visit and still sees it in the list, marked as waiting.
final class OfflineInspectionUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        // Lists load from the mock; every write fails the way a missing connection does.
        app.launchArguments = ["-resetKeychain", "-mockApiaryOffline"]
        app.launch()
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func test_inspectionRecordedWithoutAConnectionStaysVisibleAsPending() {
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 10))
        app.staticTexts["Meadow"].tap()
        XCTAssertTrue(app.staticTexts["Hive Alpha"].waitForExistence(timeout: 10))
        app.staticTexts["Hive Alpha"].tap()

        XCTAssertTrue(app.buttons["New Inspection"].waitForExistence(timeout: 10))
        app.buttons["New Inspection"].tap()
        XCTAssertTrue(app.navigationBars["New Inspection"].waitForExistence(timeout: 10))

        app.navigationBars.buttons["Save"].tap()

        // Back on the hive, the visit is listed and marked as waiting for upload
        let badge = app.staticTexts["Waiting to upload"]
        XCTAssertTrue(
            badge.waitForExistence(timeout: 10),
            "a visit recorded without a connection must stay visible"
        )
    }

    func test_aPendingVisitCannotBeOpenedYet() {
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 10))
        app.staticTexts["Meadow"].tap()
        XCTAssertTrue(app.staticTexts["Hive Alpha"].waitForExistence(timeout: 10))
        app.staticTexts["Hive Alpha"].tap()
        XCTAssertTrue(app.buttons["New Inspection"].waitForExistence(timeout: 10))
        app.buttons["New Inspection"].tap()
        XCTAssertTrue(app.navigationBars["New Inspection"].waitForExistence(timeout: 10))
        app.navigationBars.buttons["Save"].tap()
        XCTAssertTrue(app.staticTexts["Waiting to upload"].waitForExistence(timeout: 10))

        app.staticTexts["Waiting to upload"].tap()

        // It only exists on the device, so there is no detail screen to open
        XCTAssertTrue(app.navigationBars["Hive Alpha"].exists)
    }
}
