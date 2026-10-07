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

    func test_apiaryList_hasNewApiaryButtonAtTheBottomRight() {
        launch(with: "-mockAuthenticated")
        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["newApiaryButton"].exists)
        XCTAssertFalse(app.navigationBars.buttons["Add"].exists, "no plus in the toolbar any more")
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

    // MARK: - New hive

    func test_apiaryDetail_hasANewHiveButtonThatOpensTheForm() {
        launch(with: "-mockApiaryWithHive")
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 5))
        app.staticTexts["Meadow"].tap()

        let newHive = app.buttons["newHiveButton"]
        XCTAssertTrue(newHive.waitForExistence(timeout: 5))
        newHive.tap()

        XCTAssertTrue(app.textFields["hiveEditName"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.navigationBars["New Hive"].exists)
    }

    // MARK: - The beekeeper's year

    func test_apiaryList_opensTheBeekeepingYearWithTheRegionAndTheEntries() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", "-mockApiaryWithHive", "-mockNewTools"]
        app.launch()

        let button = app.buttons["beekeepingYearButton"]
        XCTAssertTrue(button.waitForExistence(timeout: 5))
        button.tap()

        XCTAssertTrue(app.navigationBars["Beekeeping year"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Make the hives winter-proof"].waitForExistence(timeout: 5)
                      || app.staticTexts["Swarm control: look for queen cells"].exists)
        XCTAssertTrue(app.buttons["changeRegionButton"].waitForExistence(timeout: 5))
    }

    // MARK: - Editing

    func test_apiaryDetail_editFormHasPublicMapToggleAndSaves() {
        launch(with: "-mockApiaryWithHive")
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 5))
        app.staticTexts["Meadow"].tap()
        let edit = app.buttons["editApiaryButton"]
        XCTAssertTrue(edit.waitForExistence(timeout: 5))
        edit.tap()

        let toggle = app.switches["apiaryPublicToggle"]
        XCTAssertTrue(toggle.waitForExistence(timeout: 5))
        XCTAssertEqual(toggle.value as? String, "0")

        app.navigationBars.buttons["Save"].tap()
        // The sheet closes once the update request succeeded.
        let gone = expectation(for: NSPredicate(format: "exists == false"), evaluatedWith: toggle)
        wait(for: [gone], timeout: 5)
        XCTAssertTrue(app.navigationBars["Meadow"].waitForExistence(timeout: 5))
    }

    // MARK: - Helper

    private func launch(with arg: String) {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", arg]
        app.launch()
    }
}
