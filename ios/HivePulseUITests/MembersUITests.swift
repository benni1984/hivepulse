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

    func test_members_supporterSeesComingSoon() {
        launchAsSupporter()
        XCTAssertTrue(app.staticTexts["More community stats coming soon."].waitForExistence(timeout: 5))
    }
}
