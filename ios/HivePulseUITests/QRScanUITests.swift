import XCTest

/// The Scan tab, which used to be a different screen from Android's (#425).
///
/// `DataScannerViewController` does not exist in the simulator, so without `-mockCameraPreview`
/// this tab is permanently the "no camera" page here and none of what sits over the preview could
/// be reached. That argument replaces the live preview with a flat colour and nothing else — the
/// viewfinder and the instruction are the real views, which is the point of the test.
final class QRScanUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", "-mockApiaryWithHive",
                               "-guidedTourSeen", "YES", "-mockCameraPreview"]
        app.launch()
        openScanTab()
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func test_openingTheTabOpensTheCamera_withNoButtonInBetween() {
        // The entry page's amber button is what #425 removed. Android never had one, and at the
        // hive in gloves the tab is itself the request to scan.
        XCTAssertFalse(app.buttons["Scan QR Code"].exists,
                       "the entry page is back and the two platforms have diverged again")
    }

    func test_theViewfinderIsOnScreen() {
        // By descendants rather than a guessed class: a SwiftUI shape's element type is not
        // something to assume, and a wrong guess here has cost whole CI rounds before.
        let frames = app.descendants(matching: .any).matching(identifier: "scanViewfinder")
        XCTAssertTrue(frames.element(boundBy: 0).waitForExistence(timeout: 5),
                      "no viewfinder — the frame is what a person aims with")
    }

    func test_theInstructionSaysWhatToAimAt() {
        let instruction = app.staticTexts["scanInstruction"]
        XCTAssertTrue(instruction.waitForExistence(timeout: 5))
        XCTAssertEqual(instruction.label,
                       "Scan the QR code on your hive to open its record or set it up for the first time.")
    }

    func test_theScreenIsCalledTheSameThingAsOnAndroid() {
        // Android's screen_scan_qr. test_scan_screen_parity.py pins the two strings together;
        // this is what checks the iPhone actually puts it on the screen.
        XCTAssertTrue(app.navigationBars["Scan QR Code"].waitForExistence(timeout: 5))
    }

    // MARK: - Helper

    private func openScanTab() {
        XCTAssertTrue(app.navigationBars["Apiaries"].waitForExistence(timeout: 10))
        app.tabBars.buttons["Scan"].tap()
    }
}
