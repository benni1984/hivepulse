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

    func test_qrBatchList_hasNewBatchButtonAtTheBottomRight() {
        XCTAssertTrue(app.buttons["newBatchButton"].exists)
        XCTAssertFalse(app.navigationBars.buttons["Add"].exists, "no plus in the toolbar any more")
    }

    // MARK: - Helper

    private func navigateToQRBatchList() {
        // Reached from the apiary list toolbar (same spot as Android), not from Settings
        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 5))
        app.buttons["qrBatchesButton"].tap()
        XCTAssertTrue(app.navigationBars["QR Batches"].waitForExistence(timeout: 5))
    }
}
