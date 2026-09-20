import XCTest

final class InspectionFormUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", "-mockApiaryWithHive"]
        app.launch()
        navigateToInspectionForm()
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func test_inspectionForm_showsNavigationTitle() {
        XCTAssertTrue(app.navigationBars["New Inspection"].exists)
    }

    func test_inspectionForm_showsDateSection() {
        XCTAssertTrue(app.staticTexts["Date"].exists)
    }

    func test_inspectionForm_showsQueenSection() {
        XCTAssertTrue(app.staticTexts["Queen"].exists)
    }

    func test_inspectionForm_showsFramesSection() {
        XCTAssertTrue(app.staticTexts["Frames"].exists)
    }

    func test_inspectionForm_hasSaveButton() {
        XCTAssertTrue(app.buttons["Save"].exists)
    }

    func test_inspectionForm_hasCancelButton() {
        XCTAssertTrue(app.buttons["Cancel"].exists)
    }

    func test_inspectionForm_cancelDismissesSheet() {
        app.buttons["Cancel"].tap()
        XCTAssertTrue(app.navigationBars["Hive Alpha"].waitForExistence(timeout: 5))
    }

    func test_inspectionForm_colonyStrengthIsAWordScale() {
        let picker = app.segmentedControls["populationStrengthPicker"]
        XCTAssertTrue(scrollUntilVisible(picker))
        for word in ["Weak", "Medium", "Strong"] {
            XCTAssertTrue(picker.buttons[word].exists, "missing strength option \(word)")
        }
    }

    func test_inspectionForm_varroaIsAWordScale() {
        let picker = app.segmentedControls["varroaLevelPicker"]
        XCTAssertTrue(scrollUntilVisible(picker))
        for word in ["None", "Low", "Medium", "High"] {
            XCTAssertTrue(picker.buttons[word].exists, "missing varroa option \(word)")
        }
    }

    func test_inspectionForm_broodFramesArePickedWithOneTap() {
        let eight = app.buttons["broodFrames8"]
        XCTAssertTrue(scrollUntilVisible(eight))
        eight.tap()
        XCTAssertTrue(eight.isSelected, "tapping a number should select it")

        // Tapping it again clears the field
        eight.tap()
        XCTAssertFalse(eight.isSelected)
    }

    func test_inspectionForm_frameButtonsAreLargeEnoughForGloves() {
        let zero = app.buttons["honeyFrames0"]
        XCTAssertTrue(scrollUntilVisible(zero))
        // Apple's minimum is 44pt; gloves need more, so the buttons are 60pt tall
        XCTAssertGreaterThanOrEqual(zero.frame.height, 56)
        XCTAssertGreaterThanOrEqual(zero.frame.width, 56)
    }

    private func scrollUntilVisible(_ element: XCUIElement, maxSteps: Int = 6) -> Bool {
        for _ in 0..<maxSteps {
            if element.exists && element.isHittable { return true }
            app.swipeUp(velocity: .slow)
        }
        return element.waitForExistence(timeout: 3)
    }

    // MARK: - Helper

    private func navigateToInspectionForm() {
        XCTAssertTrue(app.staticTexts["Meadow"].waitForExistence(timeout: 5))
        app.staticTexts["Meadow"].tap()
        XCTAssertTrue(app.staticTexts["Hive Alpha"].waitForExistence(timeout: 5))
        app.staticTexts["Hive Alpha"].tap()
        XCTAssertTrue(app.buttons["New Inspection"].waitForExistence(timeout: 5))
        app.buttons["New Inspection"].tap()
        // On a busy CI simulator the sheet occasionally misses the first tap (it arrives while the hive detail
        // push is still settling) — retry once before failing.
        if !app.navigationBars["New Inspection"].waitForExistence(timeout: 5) {
            app.buttons["New Inspection"].tap()
        }
        XCTAssertTrue(app.navigationBars["New Inspection"].waitForExistence(timeout: 10))
    }
}
