import Foundation

/// What this device already knows about its owner: the guided tour, and whether we have asked
/// what they think (#546).
///
/// UI tests can override the tour flag for a single launch with `-guidedTourSeen YES` / `NO`,
/// and the two feedback values the same way (`-feedbackAsked`, `-firstLaunchAt`) — launch
/// arguments land in the UserDefaults argument domain.
final class OnboardingStore {
    static let key = "guidedTourSeen"
    static let firstLaunchKey = "firstLaunchAt"
    static let feedbackAskedKey = "feedbackAsked"

    /// Long enough to have something to say. Somebody who has recorded nothing has no opinion
    /// yet, and a question on the first screen is the application talking about itself before it
    /// has been useful once.
    static let askAfterDays: TimeInterval = 3

    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    var hasSeenGuidedTour: Bool {
        get { defaults.bool(forKey: Self.key) }
        set { defaults.set(newValue, forKey: Self.key) }
    }

    /// Seconds since 1970, or 0 when this device has not been counted yet.
    var firstLaunchAt: TimeInterval {
        get { defaults.double(forKey: Self.firstLaunchKey) }
        set { defaults.set(newValue, forKey: Self.firstLaunchKey) }
    }

    /// Asked, and never again — whichever button was pressed. A "not now" that silently returns
    /// next week is worse than no button at all, which is why the second one says "No thanks".
    var hasAskedForFeedback: Bool {
        get { defaults.bool(forKey: Self.feedbackAskedKey) }
        set { defaults.set(newValue, forKey: Self.feedbackAskedKey) }
    }

    /// Records the first launch once; later calls leave the original date alone.
    func noteLaunch(now: Date = Date()) {
        if firstLaunchAt <= 0 { firstLaunchAt = now.timeIntervalSince1970 }
    }

    /// The whole rule, as a function of its inputs so a test needs no simulator.
    ///
    /// Android (`OnboardingStore.kt`) and the website (`lib/feedbackPrompt.ts`) hold the same
    /// one: three days, once, never again.
    static func shouldAskForFeedback(
        firstLaunchAt: TimeInterval, now: Date, alreadyAsked: Bool
    ) -> Bool {
        guard !alreadyAsked, firstLaunchAt > 0 else { return false }
        return now.timeIntervalSince1970 - firstLaunchAt >= askAfterDays * 24 * 60 * 60
    }

    /// Both of the above at once, for the one screen that needs it.
    ///
    /// `-mockFeedbackDue` brings the question forward for a UI test, the way `-mockStoreOffers`
    /// and `-mockCameraPreview` stand in for a store and a camera. Three days of waiting cannot
    /// be arranged in a simulator, and the alternative — writing a date into the UserDefaults
    /// argument domain — was tried first and did not reach this method at all. *When* the
    /// question is due is `FeedbackPromptTests`' business; the UI test's business is the card.
    ///
    /// It still respects an answer, so the test that presses "No thanks" tests something.
    func shouldAskForFeedback(now: Date = Date()) -> Bool {
        noteLaunch(now: now)
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-mockFeedbackDue") {
            return !hasAskedForFeedback
        }
        #endif
        return Self.shouldAskForFeedback(
            firstLaunchAt: firstLaunchAt, now: now, alreadyAsked: hasAskedForFeedback)
    }
}
