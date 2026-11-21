import XCTest
@testable import HivePulse

/// When to ask a beekeeper what they think (#546).
///
/// Android (`FeedbackPromptRuleTest`) and the website (`__tests__/FeedbackPrompt.test.tsx`) hold
/// the same three rules. This is the copy that needs no simulator.
final class FeedbackPromptTests: XCTestCase {

    private let day: TimeInterval = 24 * 60 * 60
    private let now = Date(timeIntervalSince1970: 1_700_000_000)

    private func store() -> OnboardingStore {
        // Its own suite, so a test never reads or writes the simulator's real preferences and
        // two tests in the same run cannot see each other's answers.
        let name = "feedback-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: name)!
        defaults.removePersistentDomain(forName: name)
        return OnboardingStore(defaults: defaults)
    }

    // MARK: - The rule

    func test_aDeviceThatWasNeverCountedIsNotAsked() {
        // 0 is what an unwritten preference reads as, and it is also 1970. Treating it as
        // "fifty years ago, so ask now" would put the card on somebody's very first screen.
        XCTAssertFalse(OnboardingStore.shouldAskForFeedback(
            firstLaunchAt: 0, now: now, alreadyAsked: false))
    }

    func test_nobodyIsAskedBeforeTheThirdDay() {
        XCTAssertFalse(OnboardingStore.shouldAskForFeedback(
            firstLaunchAt: now.timeIntervalSince1970 - 2 * day, now: now, alreadyAsked: false))
    }

    func test_theThirdDayIsWhenTheQuestionAppears() {
        XCTAssertTrue(OnboardingStore.shouldAskForFeedback(
            firstLaunchAt: now.timeIntervalSince1970 - 3 * day, now: now, alreadyAsked: false))
    }

    func test_somebodyWhoAnsweredIsNeverAskedAgain() {
        XCTAssertFalse(OnboardingStore.shouldAskForFeedback(
            firstLaunchAt: now.timeIntervalSince1970 - 365 * day, now: now, alreadyAsked: true))
    }

    func test_aClockThatWentBackwardsDoesNotAsk() {
        // A device whose time was corrected can report a first launch in the future. That must
        // read as "not yet", never as a very large number of days.
        XCTAssertFalse(OnboardingStore.shouldAskForFeedback(
            firstLaunchAt: now.timeIntervalSince1970 + 10 * day, now: now, alreadyAsked: false))
    }

    // MARK: - What the store remembers

    func test_theFirstLaunchIsRecordedOnceAndThenLeftAlone() {
        let s = store()

        s.noteLaunch(now: Date(timeIntervalSince1970: 1_000))
        s.noteLaunch(now: Date(timeIntervalSince1970: 99_000))

        XCTAssertEqual(s.firstLaunchAt, 1_000)
    }

    func test_theFirstVisitDoesNotAskButStartsTheClock() {
        let s = store()

        XCTAssertFalse(s.shouldAskForFeedback(now: now))
        XCTAssertEqual(s.firstLaunchAt, now.timeIntervalSince1970,
                       "the visit that does not ask is still the visit that starts counting")
    }

    func test_threeDaysAfterThatFirstVisitItAsks() {
        let s = store()
        _ = s.shouldAskForFeedback(now: now)

        XCTAssertTrue(s.shouldAskForFeedback(now: now.addingTimeInterval(3 * day)))
    }

    func test_answeringEndsItForGood() {
        let s = store()
        _ = s.shouldAskForFeedback(now: now)

        s.hasAskedForFeedback = true

        XCTAssertFalse(s.shouldAskForFeedback(now: now.addingTimeInterval(365 * day)))
    }

    func test_theGuidedTourFlagIsUntouchedByAnyOfThis() {
        // Three values share one store; a copy-and-paste in the keys would silently re-run the
        // tour, or silently skip it, for everybody who ever answered the card.
        let s = store()
        s.hasSeenGuidedTour = true

        s.hasAskedForFeedback = true
        s.noteLaunch(now: now)

        XCTAssertTrue(s.hasSeenGuidedTour)
    }
}
