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

// MARK: - The body of a refusal (issue 422)
//
// The backend answers a refusal with `{"detail": {"code": ..., "message": ...}}` -- FastAPI wraps
// whatever `HTTPException(detail=...)` was given. `APIErrorEnvelope` decoded `error` instead,
// which the API contract described and the backend never sent, so `message` was always nil and
// every refusal on this client read "Unknown error". The contract was the thing that was wrong.
//
// No test caught it for the life of the file, because none of them asserted on a message and the
// mock sends the real shape. These do.
extension APIClientTests {

    private func envelope(_ json: String) -> APIErrorEnvelope? {
        try? JSONDecoder().decode(APIErrorEnvelope.self, from: Data(json.utf8))
    }

    func test_errorBody_readsTheMessageTheBackendActuallySends() {
        let body = #"{"detail":{"code":"INVALID_CREDENTIALS","message":"Invalid email or password."}}"#
        XCTAssertEqual(envelope(body)?.message, "Invalid email or password.")
        XCTAssertEqual(envelope(body)?.code, "INVALID_CREDENTIALS")
    }

    func test_errorBody_readsAPlainStringDetail() {
        // The errors FastAPI raises itself carry a string, not an object.
        XCTAssertEqual(envelope(#"{"detail":"Not Found"}"#)?.message, "Not Found")
    }

    func test_errorBody_survivesSomethingItCannotRead() {
        // A proxy answering with HTML must not crash the decode; the caller falls back.
        XCTAssertNil(envelope(#"{"something":"else"}"#)?.message)
    }

    // MARK: - A 401 means two different things

    func test_aRefusedSignInSaysWhatWasWrong_notThatTheSessionExpired() {
        // Nothing expired: the password was wrong. "Session expired. Please log in again." asks
        // somebody who just typed their password to type it again, which is worse than opaque.
        let error = APIError.invalidCredentials("Invalid email or password.")
        XCTAssertEqual(error.errorDescription, "Invalid email or password.")
    }

    func test_anExpiredSessionStillSaysTheSessionExpired() {
        // The other half: on a call that carried a token, a 401 does mean the session is over,
        // and that sentence is the right one. Fixing the first case must not lose this.
        XCTAssertEqual(APIError.unauthorized.errorDescription,
                       NSLocalizedString("error.unauthorized", comment: ""))
        XCTAssertNotEqual(APIError.unauthorized.errorDescription, "Invalid email or password.")
    }
}
