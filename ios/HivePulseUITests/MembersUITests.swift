import XCTest

final class MembersUITests: XCTestCase {

    private var app: XCUIApplication!

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    // MARK: - Helpers

    private func launchAuthenticated() {
        app = XCUIApplication()
        app.launchArguments = ["-mockAuthenticated"]
        app.launch()
        navigateToMembers()
    }

    private func launchAsSupporter() {
        app = XCUIApplication()
        app.launchArguments = ["-mockAuthenticatedSupporter"]
        app.launch()
        navigateToMembers()
    }

    private func navigateToMembers() {
        let membersTab = app.tabBars.buttons["Members"]
        XCTAssertTrue(membersTab.waitForExistence(timeout: 5))
        membersTab.tap()
    }

    // MARK: - Tests

    func test_members_tabExists() {
        app = XCUIApplication()
        app.launchArguments = ["-mockAuthenticated"]
        app.launch()
        XCTAssertTrue(app.tabBars.buttons["Members"].waitForExistence(timeout: 5))
    }

    func test_members_nonSupporterSeesGate() {
        launchAuthenticated()
        XCTAssertTrue(app.staticTexts["Supporter Feature"].waitForExistence(timeout: 5))
    }

    func test_members_supporterSeesRegionalHealthMap() {
        launchAsSupporter()
        XCTAssertTrue(app.staticTexts["Regional Health Map"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Varroa Risk"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["None / low (< 1)"].exists)
    }

    func test_members_switchingOverlay_updatesLegend() {
        launchAsSupporter()
        let mood = app.buttons["Colony Mood"]
        XCTAssertTrue(mood.waitForExistence(timeout: 5))
        mood.tap()
        XCTAssertTrue(app.staticTexts["Good (\u{2265} 70% calm)"].waitForExistence(timeout: 5))
    }

    func test_members_gateCardHasCTAButton() {
        launchAuthenticated()
        XCTAssertTrue(app.staticTexts["Supporter Feature"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Learn more & become a supporter"].exists)
    }
}
