import Foundation
import Sentry

/// Crash reporting.
///
/// Without a DSN nothing is started: debug builds and the test suite then send nothing at
/// all. With one, a crash reaches us instead of only the beekeeper who lost their work.
///
/// Beekeeper data must not travel with a report, so personal data is off and the
/// breadcrumbs that record typed text are dropped.
enum CrashReporting {

    /// The DSN is injected at build time (`SENTRY_DSN` in Info.plist, fed from the build
    /// setting of the same name) so no key has to live in the repository.
    static func start(
        dsn: String? = Bundle.main.object(forInfoDictionaryKey: "SENTRY_DSN") as? String,
        environment: String = isDebugBuild ? "development" : "production",
        release: String? = releaseName
    ) -> Bool {
        guard let dsn, isConfigured(dsn) else { return false }

        SentrySDK.start { options in
            options.dsn = dsn
            options.environment = environment
            if let release { options.releaseName = release }
            options.sendDefaultPii = false
            options.attachScreenshot = false
            options.attachViewHierarchy = false
            options.tracesSampleRate = 0
            options.enableUserInteractionTracing = false
            options.beforeBreadcrumb = { breadcrumb in
                // "user typed …" breadcrumbs would carry hive notes.
                breadcrumb.category == "ui.input" ? nil : breadcrumb
            }
        }
        return true
    }

    /// A blank DSN, or the placeholder left in a build configuration, keeps reporting off.
    static func isConfigured(_ dsn: String?) -> Bool {
        guard let dsn = dsn?.trimmingCharacters(in: .whitespacesAndNewlines), !dsn.isEmpty else {
            return false
        }
        return dsn.hasPrefix("http") && dsn != "$(SENTRY_DSN)"
    }

    /// Sends one deliberate report and waits for it to leave the device.
    ///
    /// An empty crash reporting channel looks exactly like a healthy one — in both cases
    /// nothing arrives. This is the only way to tell the difference from a real iPhone, and
    /// the only reason it is reachable from the settings screen at all.
    ///
    /// Returns the Sentry event id, or nil when reporting is off, so the screen can say which
    /// of the two happened instead of claiming a success it cannot back up.
    static func sendTestReport() async -> String? {
        guard SentrySDK.isEnabled else { return nil }

        let error = NSError(
            domain: "CrashReportingSelfTest",
            code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Crash reporting self-test from the iPhone app — safe to resolve"]
        )
        let id = SentrySDK.capture(error: error)
        // The id comes back before the report is on the wire; without the flush, leaving the
        // app right after tapping could discard it and we would report a false success.
        await withCheckedContinuation { continuation in
            DispatchQueue.global().async {
                SentrySDK.flush(timeout: flushTimeout)
                continuation.resume()
            }
        }
        return id == SentryId.empty ? nil : id.sentryIdString
    }

    private static let flushTimeout: TimeInterval = 5

    static var releaseName: String? {
        guard
            let bundleId = Bundle.main.bundleIdentifier,
            let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
        else { return nil }
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "0"
        return "\(bundleId)@\(version)+\(build)"
    }

    static var isDebugBuild: Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }
}
