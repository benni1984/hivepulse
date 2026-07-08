import XCTest
@testable import HivePulse

final class APIClientTests: XCTestCase {

    // The test target's Info.plist is auto-generated (GENERATE_INFOPLIST_FILE) and
    // has no APIBaseURL key, so this exercises the fallback branch of the
    // Info.plist-driven baseURL resolution added for #190 — a missing/malformed
    // key must never leave baseURL nil or empty, it must fall back to localhost.
    func test_baseURL_fallsBackToLocalhost_whenInfoPlistKeyMissing() {
        let url = APIClient.shared.baseURL
        XCTAssertEqual(url.absoluteString, "http://localhost:8000/api/v1")
    }

    func test_baseURL_isAlwaysHTTPOrHTTPS() {
        let scheme = APIClient.shared.baseURL.scheme
        XCTAssertTrue(scheme == "http" || scheme == "https")
    }
}
