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

    // MARK: - URL building
    //
    // Regression: paths carry query strings ("apiaries?page=1&per_page=50"). `appendingPathComponent`
    // percent-encoded "?" and "&" into the path, so production answered 404 ({"detail":"Not Found"}) and
    // every list screen showed "Unknown error". MockURLProtocol matches substrings, so tests stayed green.

    private let base = URL(string: "https://hivepulse.multihead.de/api/v1")!

    func test_makeURL_keepsQueryStringIntact() {
        let url = APIClient.makeURL(base: base, path: "apiaries?page=1&per_page=50")

        XCTAssertEqual(url?.absoluteString, "https://hivepulse.multihead.de/api/v1/apiaries?page=1&per_page=50")
        XCTAssertEqual(url?.path, "/api/v1/apiaries")
        XCTAssertEqual(url?.query, "page=1&per_page=50")
        XCTAssertFalse(url?.absoluteString.contains("%3F") ?? true)
        XCTAssertFalse(url?.absoluteString.contains("%26") ?? true)
    }

    func test_makeURL_plainPathAndTrailingSlashBase() {
        XCTAssertEqual(APIClient.makeURL(base: base, path: "auth/login")?.absoluteString,
                       "https://hivepulse.multihead.de/api/v1/auth/login")
        let slashed = URL(string: "https://hivepulse.multihead.de/api/v1/")!
        XCTAssertEqual(APIClient.makeURL(base: slashed, path: "users/me")?.absoluteString,
                       "https://hivepulse.multihead.de/api/v1/users/me")
    }

    func test_makeURL_nestedPathWithQuery() {
        let url = APIClient.makeURL(base: base, path: "hives/h-1/inspections?page=2&per_page=20")

        XCTAssertEqual(url?.path, "/api/v1/hives/h-1/inspections")
        XCTAssertEqual(url?.query, "page=2&per_page=20")
    }
}
