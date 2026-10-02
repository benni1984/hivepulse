import XCTest
@testable import HivePulse

/// Without a privacy manifest, App Store Connect answers an upload with ITMS-91053 for every
/// required-reason API the app touches. The app uses one — UserDefaults — and a manifest that
/// stops being shipped, or stops declaring it, fails the upload rather than the build.
final class PrivacyManifestTests: XCTestCase {

    private func manifest() throws -> [String: Any] {
        let bundle = Bundle(for: AuthViewModel.self)
        let url = try XCTUnwrap(
            bundle.url(forResource: "PrivacyInfo", withExtension: "xcprivacy"),
            "PrivacyInfo.xcprivacy is not in the app bundle"
        )
        let data = try Data(contentsOf: url)
        let plist = try PropertyListSerialization.propertyList(from: data, format: nil)
        return try XCTUnwrap(plist as? [String: Any], "the manifest is not a dictionary")
    }

    func test_theManifestIsShipped() throws {
        let contents = try manifest()
        XCTAssertFalse(contents.isEmpty)
    }

    func test_userDefaultsIsDeclaredWithItsReason() throws {
        let contents = try manifest()
        let apis = try XCTUnwrap(contents["NSPrivacyAccessedAPITypes"] as? [[String: Any]])

        let userDefaults = apis.first {
            $0["NSPrivacyAccessedAPIType"] as? String == "NSPrivacyAccessedAPICategoryUserDefaults"
        }
        let entry = try XCTUnwrap(userDefaults, "UserDefaults is used by the app but not declared")
        let reasons = try XCTUnwrap(entry["NSPrivacyAccessedAPITypeReasons"] as? [String])
        XCTAssertTrue(reasons.contains("CA92.1"), "CA92.1 is the reason for this app's own values")
    }

    func test_nothingClaimsToTrack() throws {
        let contents = try manifest()
        XCTAssertEqual(contents["NSPrivacyTracking"] as? Bool, false)
        XCTAssertEqual((contents["NSPrivacyTrackingDomains"] as? [String])?.isEmpty, true)

        let types = try XCTUnwrap(contents["NSPrivacyCollectedDataTypes"] as? [[String: Any]])
        for type in types {
            let name = type["NSPrivacyCollectedDataType"] as? String ?? "?"
            XCTAssertEqual(
                type["NSPrivacyCollectedDataTypeTracking"] as? Bool, false,
                "\(name) must not be marked as used for tracking"
            )
        }
    }

    func test_crashDataIsDeclared() throws {
        // Sentry is live in release builds, and an undeclared category is the usual reason an
        // otherwise finished app comes back from review.
        let contents = try manifest()
        let types = try XCTUnwrap(contents["NSPrivacyCollectedDataTypes"] as? [[String: Any]])
        let names = types.compactMap { $0["NSPrivacyCollectedDataType"] as? String }

        XCTAssertTrue(names.contains("NSPrivacyCollectedDataTypeCrashData"))
        XCTAssertTrue(names.contains("NSPrivacyCollectedDataTypeEmailAddress"))
        XCTAssertTrue(names.contains("NSPrivacyCollectedDataTypeUserID"))
    }
}
