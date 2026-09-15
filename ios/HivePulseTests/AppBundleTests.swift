import XCTest
import UIKit
@testable import HivePulse

/// Checks the bundle metadata App Store Connect / TestFlight require, so a missing icon or export
/// compliance key fails in CI instead of at upload time.
final class AppBundleTests: XCTestCase {

    private var info: [String: Any] { Bundle(for: AuthViewModel.self).infoDictionary ?? [:] }

    func test_appIcon_isCompiledIntoTheBundle() {
        let icons = info["CFBundleIcons"] as? [String: Any]
        let primary = icons?["CFBundlePrimaryIcon"] as? [String: Any]
        let name = primary?["CFBundleIconName"] as? String

        XCTAssertEqual(name, "AppIcon", "ASSETCATALOG_COMPILER_APPICON_NAME must point at the AppIcon set")
    }

    func test_exportCompliance_declaresNoNonExemptEncryption() {
        XCTAssertEqual(info["ITSAppUsesNonExemptEncryption"] as? Bool, false)
    }

    func test_privacyUsageDescriptions_arePresent() {
        for key in ["NSCameraUsageDescription", "NSLocationWhenInUseUsageDescription"] {
            let text = info[key] as? String ?? ""
            XCTAssertFalse(text.isEmpty, "\(key) is required for camera/location access")
        }
    }

    func test_buildNumber_resolvesToAPositiveInteger() {
        // CFBundleVersion comes from CURRENT_PROJECT_VERSION so TestFlight uploads can bump it per build.
        let build = info["CFBundleVersion"] as? String ?? ""
        XCTAssertNotNil(Int(build), "CFBundleVersion \"\(build)\" must be a plain integer")
        XCTAssertGreaterThan(Int(build) ?? 0, 0)
    }

    func test_supportedInterfaceOrientations_areDeclared() {
        // App Store Connect rejects uploads without this key ("No orientations were specified").
        let orientations = info["UISupportedInterfaceOrientations"] as? [String] ?? []
        XCTAssertTrue(orientations.contains("UIInterfaceOrientationPortrait"))
        XCTAssertEqual(Set(orientations).count, 4)
    }

    func test_displayName_isHivePulse() {
        XCTAssertEqual(info["CFBundleDisplayName"] as? String, "HivePulse")
    }
}
