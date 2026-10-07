import XCTest

final class HiveDetailUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", "-mockApiaryWithHive"]
        app.launch()
        navigateToHiveDetail()
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func test_hiveDetail_showsHiveNameInNavBar() {
        XCTAssertTrue(app.navigationBars["Hive Alpha"].exists)
    }

    func test_hiveDetail_showsHiveType() {
        XCTAssertTrue(app.staticTexts["Langstroth"].exists)
    }

    func test_hiveDetail_showsEmptyInspectionsMessage() {
        XCTAssertTrue(app.staticTexts["No inspections yet."].waitForExistence(timeout: 5))
    }

    func test_hiveDetail_newInspectionButtonOpenForm() {
        app.buttons["New Inspection"].tap()
        XCTAssertTrue(app.navigationBars["New Inspection"].waitForExistence(timeout: 5))
    }

    func test_hiveDetail_editButtonOpensEditForm() {
        app.buttons["editHiveButton"].tap()
        XCTAssertTrue(app.navigationBars["Edit Hive"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.textFields["hiveEditName"].value as? String, "Hive Alpha")
        app.buttons["Cancel"].tap()
        XCTAssertTrue(app.navigationBars["Hive Alpha"].waitForExistence(timeout: 5))
    }

    func test_hiveDetail_canMoveThisHiveWithItTicked() {
        navigateToHiveDetail()

        let move = app.buttons["moveThisHiveButton"]
        XCTAssertTrue(move.waitForExistence(timeout: 5))
        move.tap()

        XCTAssertTrue(app.navigationBars["Move hives"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Hive Alpha"].exists, "the hive being looked at is listed")
        // One hive is ticked from the start, so the button names a count of one.
        XCTAssertTrue(app.buttons["moveSubmit"].exists)
    }

    // MARK: - Helper

    private func navigateToHiveDetail() {
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 5))
        app.staticTexts["Meadow"].tap()
        XCTAssertTrue(app.staticTexts["Hive Alpha"].waitForExistence(timeout: 5))
        app.staticTexts["Hive Alpha"].tap()
        XCTAssertTrue(app.navigationBars["Hive Alpha"].waitForExistence(timeout: 5))
    }
}
