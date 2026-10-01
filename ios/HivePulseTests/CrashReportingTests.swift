import XCTest
@testable import HivePulse

/// A build without a DSN must not start reporting — that is what keeps debug builds, builds
/// made from source and the test suite from sending anything anywhere.
final class CrashReportingTests: XCTestCase {

    func test_aRealDsnEnablesReporting() {
        XCTAssertTrue(CrashReporting.isConfigured("https://key@o1.ingest.sentry.io/42"))
    }

    func test_anEmptyOrMissingDsnKeepsReportingOff() {
        XCTAssertFalse(CrashReporting.isConfigured(""))
        XCTAssertFalse(CrashReporting.isConfigured("   "))
        XCTAssertFalse(CrashReporting.isConfigured(nil))
    }

    func test_theUnexpandedBuildSettingKeepsReportingOff() {
        // What Info.plist contains when SENTRY_DSN was never set.
        XCTAssertFalse(CrashReporting.isConfigured("$(SENTRY_DSN)"))
    }

    func test_somethingThatIsNotADsnKeepsReportingOff() {
        XCTAssertFalse(CrashReporting.isConfigured("your-dsn-here"))
        XCTAssertFalse(CrashReporting.isConfigured("sentry.io/42"))
    }

    func test_startDoesNothingWithoutADsn() {
        XCTAssertFalse(CrashReporting.start(dsn: nil))
        XCTAssertFalse(CrashReporting.start(dsn: ""))
    }

    func test_theReleaseNameIdentifiesTheBuild() {
        let release = CrashReporting.releaseName
        XCTAssertNotNil(release)
        XCTAssertTrue(release?.contains("@") == true, "release is bundle@version+build")
        XCTAssertTrue(release?.contains("+") == true)
    }
}
