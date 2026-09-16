import XCTest

final class QRBatchListUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", "-mockAuthenticated"]
        app.launch()
        navigateToQRBatchList()
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func test_qrBatchList_showsNavigationTitle() {
        XCTAssertTrue(app.navigationBars["QR Batches"].exists)
    }

    func test_qrBatchList_showsEmptyStateWhenNoBatches() {
        XCTAssertTrue(app.staticTexts["No QR Batches"].waitForExistence(timeout: 5))
    }

    func test_qrBatchList_hasPlusButtonInToolbar() {
        XCTAssertTrue(app.navigationBars.buttons["Add"].exists)
    }

    // MARK: - Helper

    private func navigateToQRBatchList() {
        // Reached from the apiary list toolbar (same spot as Android), not from Settings
        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 5))
        app.buttons["qrBatchesButton"].tap()
        XCTAssertTrue(app.navigationBars["QR Batches"].waitForExistence(timeout: 5))
    }
}
