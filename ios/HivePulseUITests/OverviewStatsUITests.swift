import XCTest

final class OverviewStatsUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", "-mockApiaryWithHive"]
        app.launch()
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 5))
        app.navigationBars.buttons["My Statistics"].tap()
        XCTAssertTrue(app.navigationBars["My Statistics"].waitForExistence(timeout: 5))
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func test_overview_showsTotalsAndApiaryBreakdown() {
        XCTAssertTrue(app.staticTexts["By Apiary"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["12"].exists)
        XCTAssertTrue(meadowRow.exists)
    }

    func test_overview_apiaryRowNavigatesToApiary() {
        XCTAssertTrue(meadowRow.waitForExistence(timeout: 5))
        meadowRow.tap()
        XCTAssertTrue(app.navigationBars["Meadow"].waitForExistence(timeout: 5))
    }

    /// The row is a NavigationLink, so its texts are merged into one button label.
    private var meadowRow: XCUIElement {
        app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Meadow")).firstMatch
    }
}
