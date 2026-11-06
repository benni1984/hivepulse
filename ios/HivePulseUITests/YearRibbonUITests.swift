import XCTest

/// The year as a ribbon: the switch, a bar, and the entry the bar stands for.
///
/// The arithmetic has its own tests (`YearRibbonTests`), which is where the leap years and the
/// New Year edges live. This is about the parts only a running app has: that the switch is
/// reachable at all, that bars are drawn and can be tapped, and that tapping one opens the entry
/// with its photograph.
final class YearRibbonUITests: XCTestCase {

    private var app: XCUIApplication!

    /// An element by its identifier, whatever class XCUITest decided to file it under.
    ///
    /// Containers are the problem: a `List` is a table on one OS version and a collection view on
    /// the next, and an identified `VStack` is neither, so `app.otherElements[...]` quietly matches
    /// nothing and every assertion about it fails for a reason that has nothing to do with the app.
    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any)[identifier]
    }

    private func openTheYear() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-resetKeychain", "-mockApiaryWithHive", "-mockNewTools"]
        app.launch()

        let button = app.buttons["beekeepingYearButton"]
        XCTAssertTrue(button.waitForExistence(timeout: 10))
        button.tap()
        XCTAssertTrue(app.navigationBars["Beekeeping year"].waitForExistence(timeout: 10))
    }

    func test_theSwitchIsReachableWithoutScrolling() {
        // The list opens scrolled to today. A List is lazy, so a switch placed inside it as the
        // first row would be gone, and the other view unreachable without scrolling back through
        // the whole year. It sits above the list for that reason, and this is the guard.
        openTheYear()
        XCTAssertTrue(app.buttons["yearViewRibbon"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["yearViewRibbon"].isHittable)
    }

    func test_theRibbonDrawsTheYearAndABarOpensItsEntry() {
        openTheYear()
        app.buttons["yearViewRibbon"].tap()

        let ribbon = element("yearRibbon")
        XCTAssertTrue(ribbon.waitForExistence(timeout: 10))

        // The year is drawn wider than the screen, so the months after about June are off to the
        // right. Dragged into view rather than tapped where they are not: a tap at coordinates
        // outside the viewport lands nowhere.
        var bar = firstHittableBar()
        var swipes = 0
        while bar == nil && swipes < 8 {
            ribbon.swipeLeft()
            swipes += 1
            bar = firstHittableBar()
        }
        guard let bar else {
            XCTFail("no bar of the year could be brought into view in \(swipes) swipes")
            return
        }

        bar.tap()
        XCTAssertTrue(element("ribbonDetail").waitForExistence(timeout: 5),
                      "tapping a bar must open the entry it stands for")

        // And the way out is still there. The switch used to be the first thing inside the
        // ScrollView, so scrolling to the detail carried it off the top edge: on a short screen
        // the only way back to the list was to scroll up first. Android's CI emulator is where
        // that showed up, and both clients were built the same way.
        XCTAssertTrue(app.buttons["yearViewList"].isHittable,
                      "the switch must stay reachable after a bar has been tapped")
        app.buttons["yearViewList"].tap()
        XCTAssertTrue(element("beekeepingYearList").waitForExistence(timeout: 10))
    }

    func test_theListIsWhereTheScreenOpensAndTheSwitchGoesBack() {
        openTheYear()
        XCTAssertTrue(element("beekeepingYearList").waitForExistence(timeout: 10))

        app.buttons["yearViewRibbon"].tap()
        XCTAssertTrue(element("yearRibbon").waitForExistence(timeout: 10))

        app.buttons["yearViewList"].tap()
        XCTAssertTrue(element("beekeepingYearList").waitForExistence(timeout: 10))
    }

    func test_theQuestionnaireIsOfferedUnderTheYear() {
        // The dates can be wrong where somebody keeps bees, and the app says so where they are
        // looking at them. The form itself is a web page; this is the invitation to it.
        openTheYear()
        XCTAssertTrue(element("yearFeedbackLink").waitForExistence(timeout: 10),
                      "the beekeeping year must offer the questionnaire")
    }

    /// The first bar that is actually on screen, or nil while the year is scrolled past them all.
    private func firstHittableBar() -> XCUIElement? {
        let bars = app.descendants(matching: .any).matching(identifier: "ribbonBar")
        for index in 0..<bars.count where bars.element(boundBy: index).isHittable {
            return bars.element(boundBy: index)
        }
        return nil
    }
}
