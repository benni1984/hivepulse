import XCTest

final class FieldDefinitionsUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func test_settings_customFields_showsEmptyStateAndCreateForm() {
        launch(["-resetKeychain", "-mockAuthenticated", "-guidedTourSeen", "YES"])
        XCTAssertTrue(app.tabBars.buttons["Settings"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Settings"].tap()

        let row = app.buttons["Custom Fields"]
        XCTAssertTrue(row.waitForExistence(timeout: 5))
        row.tap()

        XCTAssertTrue(app.navigationBars["Custom Fields"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["No custom fields yet."].waitForExistence(timeout: 5))

        app.buttons["newFieldButton"].tap()
        XCTAssertTrue(app.navigationBars["New Custom Field"].waitForExistence(timeout: 5))

        let create = app.buttons["Create Field"]
        XCTAssertTrue(create.exists)
        XCTAssertFalse(create.isEnabled)

        let name = app.textFields["fieldNameField"]
        name.tap()
        name.typeText("Temperament")
        XCTAssertTrue(create.isEnabled)

        app.buttons["Cancel"].tap()
        XCTAssertTrue(app.navigationBars["Custom Fields"].waitForExistence(timeout: 5))
    }

    func test_apiaryDetail_opensApiaryScopedFields() {
        launch(["-resetKeychain", "-mockApiaryWithHive", "-guidedTourSeen", "YES"])
        let apiary = app.staticTexts["Meadow"]
        XCTAssertTrue(apiary.waitForExistence(timeout: 5))
        apiary.tap()

        let fieldsButton = app.buttons["apiaryFieldsButton"]
        XCTAssertTrue(fieldsButton.waitForExistence(timeout: 5))
        fieldsButton.tap()

        XCTAssertTrue(app.navigationBars["Apiary-Scoped Fields"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["These fields only apply to hives and inspections in this apiary."].exists)
    }

    private func launch(_ arguments: [String]) {
        app = XCUIApplication()
        app.launchArguments = arguments
        app.launch()
    }
}
