import Foundation

/// Where a report goes on the iPhone, built in one place (#546).
///
/// Settings has offered this since the app had testers; the card on the apiary list offers the
/// same thing to somebody who never went looking. Two copies of the address and the subject
/// would drift, and only one of them would ever be tried by hand.
///
/// Android deliberately does **not** send mail: its button opens the Play Store page, because an
/// answer written there is what reaches the Play Console's testing-feedback page.
enum FeedbackMail {
    static let address = "hivepulse@multihead.de"

    /// The build is in the subject so a report does not start by asking which one it came from.
    ///
    /// `addingPercentEncoding` cannot fail for this character set, but a force-unwrapped URL
    /// here would crash the screen it sits on, so it falls back to a bare `mailto:`.
    static var url: URL {
        let subject = String(format: "%@ %@ (%@)",
                             NSLocalizedString("action.feedbackSubject", comment: ""),
                             appVersion, appBuild)
        let encoded = subject.addingPercentEncoding(
            withAllowedCharacters: .urlQueryAllowed) ?? ""
        return URL(string: "mailto:\(address)?subject=\(encoded)")
            ?? URL(string: "mailto:\(address)")!
    }

    static var appVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "?"
    }

    static var appBuild: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "?"
    }
}
