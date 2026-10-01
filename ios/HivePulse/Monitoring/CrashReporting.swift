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
