import XCTest
@testable import HivePulse

/// The production backend serialises naive UTC datetimes like "2026-09-13T13:18:13.734534" (microseconds,
/// no zone). `.iso8601` cannot read that, which broke login and every list against the real server while
/// the mock-based tests (using "…Z") stayed green.
final class BackendDateTests: XCTestCase {

    private func utc(_ y: Int, _ mo: Int, _ d: Int, _ h: Int = 0, _ mi: Int = 0, _ s: Int = 0, ms: Int = 0) -> Date {
        var comps = DateComponents(year: y, month: mo, day: d, hour: h, minute: mi, second: s,
                                   nanosecond: ms * 1_000_000)
        comps.timeZone = TimeZone(identifier: "UTC")
        return Calendar(identifier: .gregorian).date(from: comps)!
    }

    func test_parse_backendMicrosecondsWithoutZone_isUTC() {
        let date = BackendDate.parse("2026-09-13T13:18:13.734534")
        XCTAssertNotNil(date)
        XCTAssertEqual(date!.timeIntervalSince1970, utc(2026, 9, 13, 13, 18, 13, ms: 734).timeIntervalSince1970, accuracy: 0.001)
    }

    func test_parse_wholeSecondsWithoutZone() {
        XCTAssertEqual(BackendDate.parse("2026-09-15T21:00:00"), utc(2026, 9, 15, 21))
    }

    func test_parse_explicitZones() {
        XCTAssertEqual(BackendDate.parse("2024-01-01T00:00:00Z"), utc(2024, 1, 1))
        XCTAssertEqual(BackendDate.parse("2026-09-13T15:18:13+02:00"), utc(2026, 9, 13, 13, 18, 13))
        XCTAssertEqual(BackendDate.parse("2026-09-13T13:18:13.5Z")?.timeIntervalSince1970 ?? 0,
                       utc(2026, 9, 13, 13, 18, 13, ms: 500).timeIntervalSince1970, accuracy: 0.001)
    }

    func test_parse_dateOnly_isUTCMidnight() {
        XCTAssertEqual(BackendDate.parse("2026-09-13"), utc(2026, 9, 13))
    }

    func test_parse_rejectsGarbage() {
        XCTAssertNil(BackendDate.parse("yesterday"))
        XCTAssertNil(BackendDate.parse(""))
    }

    func test_tokenResponse_withRealBackendTimestamp_decodes() throws {
        let json = #"""
        {"access_token":"a","refresh_token":"r","user":{"id":"u-1","email":"a@b.com","name":"Alice","locale":"de",
         "is_admin":false,"is_supporter":true,"created_at":"2026-09-13T13:18:13.734534"}}
        """#.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .hivePulseBackend

        let resp = try decoder.decode(TokenResponse.self, from: json)

        XCTAssertEqual(resp.user.email, "a@b.com")
        XCTAssertTrue(resp.user.isSupporter)
    }

    func test_iso8601Strategy_cannotReadBackendTimestamps() {
        // Documents why the custom strategy exists — keep APIClient off `.iso8601`.
        let json = #"{"id":"u-1","email":"a@b.com","name":"A","locale":"en","is_admin":false,"is_supporter":false,"created_at":"2026-09-13T13:18:13.734534"}"#
            .data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        XCTAssertThrowsError(try decoder.decode(UserOut.self, from: json))
    }

    func test_invalidDate_surfacesDecodingError() {
        let json = #"{"id":"u-1","email":"a@b.com","name":"A","locale":"en","is_admin":false,"is_supporter":false,"created_at":"soon"}"#
            .data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .hivePulseBackend
        XCTAssertThrowsError(try decoder.decode(UserOut.self, from: json)) { error in
            guard case DecodingError.dataCorrupted = error else { return XCTFail("expected dataCorrupted, got \(error)") }
        }
    }
}
