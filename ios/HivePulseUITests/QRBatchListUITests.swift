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
        XCTAssertTrue(app.tabBars.buttons["Settings"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Settings"].tap()
        XCTAssertTrue(app.staticTexts["QR Batches"].waitForExistence(timeout: 5))
        app.staticTexts["QR Batches"].tap()
        XCTAssertTrue(app.navigationBars["QR Batches"].waitForExistence(timeout: 5))
    }
}
