import Foundation

/// Remembers on this device whether the guided tour has been shown.
/// UI tests can override the flag for a single launch with `-guidedTourSeen YES` / `-guidedTourSeen NO`
/// (launch arguments land in the UserDefaults argument domain).
final class OnboardingStore {
    static let key = "guidedTourSeen"

    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    var hasSeenGuidedTour: Bool {
        get { defaults.bool(forKey: Self.key) }
        set { defaults.set(newValue, forKey: Self.key) }
    }
}
