import XCTest

final class QRBatchDetailUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", "-mockQrBatch"]
        app.launch()
        openBatch()
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func test_batchDetail_showsDownloadButtonAndTokens() {
        XCTAssertTrue(app.buttons["downloadPdfButton"].isEnabled)
        XCTAssertTrue(app.staticTexts["tok-aaaa"].waitForExistence(timeout: 5))
    }

    func test_batchDetail_downloadPdfDoesNotShowAnError() {
        app.buttons["downloadPdfButton"].tap()
        // The old Link-based button opened the URL without a token (rejected by the backend).
        // Now the PDF is fetched with auth and handed to Quick Look — no error alert.
        XCTAssertFalse(app.alerts["Error"].waitForExistence(timeout: 4))
    }

    // MARK: - Helper

    private func openBatch() {
        XCTAssertTrue(app.tabBars.buttons["Settings"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Settings"].tap()
        XCTAssertTrue(app.staticTexts["QR Batches"].waitForExistence(timeout: 5))
        app.staticTexts["QR Batches"].tap()
        let row = app.collectionViews.cells.firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 5))
        row.tap()
        XCTAssertTrue(app.buttons["downloadPdfButton"].waitForExistence(timeout: 5))
    }
}
