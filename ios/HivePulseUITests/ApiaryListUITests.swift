import XCTest

final class ApiaryListUITests: XCTestCase {

    private var app: XCUIApplication!

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    // MARK: - Empty state

    func test_apiaryList_showsNavigationTitle() {
        launch(with: "-mockAuthenticated")
        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 5))
    }

    func test_apiaryList_showsEmptyStateWhenNoApiaries() {
        launch(with: "-mockAuthenticated")
        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["No Apiaries"].waitForExistence(timeout: 5))
    }

    func test_apiaryList_hasPlusButtonInToolbar() {
        launch(with: "-mockAuthenticated")
        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.navigationBars.buttons["Add"].exists)
    }

    // MARK: - With data

    func test_apiaryList_showsApiaryNameWhenDataLoaded() {
        launch(with: "-mockApiaryWithHive")
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 5))
    }

    func test_apiaryList_canNavigateToApiary() {
        launch(with: "-mockApiaryWithHive")
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 5))
        app.staticTexts["Meadow"].tap()
        XCTAssertTrue(app.navigationBars["Meadow"].waitForExistence(timeout: 5))
    }

    func test_apiaryList_swipeDeleteWithHivesShowsError() {
        // "-mockApiaryWithHive" returns an apiary with hiveCount = 1
        launch(with: "-mockApiaryWithHive")
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 5))
        app.staticTexts["Meadow"].swipeLeft()
        let deleteButton = app.buttons["Delete"]
        XCTAssertTrue(deleteButton.waitForExistence(timeout: 3))
        deleteButton.tap()
        // Should show error alert instead of deleting
        XCTAssertTrue(app.alerts["Error"].waitForExistence(timeout: 5))
    }

    // MARK: - Helper

    private func launch(with arg: String) {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", arg]
        app.launch()
    }
}
