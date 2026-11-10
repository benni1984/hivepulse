import XCTest
@testable import HivePulse

/// What day the phone thinks it is, and in whose calendar.
///
/// Two separate faults lived here (#443):
///
/// **The server's day is not the phone's.** Every stored timestamp is UTC and `app/clock.py` makes
/// that deliberate, but from about 22:00 in Europe the UTC day is yesterday. `markDone` sent an
/// empty body and let the server decide, so a treatment finished on Friday evening was filed as
/// Thursday's. The phone knows; it sends the day.
///
/// **The reader's calendar is not the Gregorian one.** A `DateFormatter` with no locale, and
/// `Calendar.current`, follow the phone's calendar preference. On a phone set to the Thai Buddhist
/// calendar today is the year 2569, and the trap-catch screen built its date that way — the server
/// stores the string as written.
final class DayFormatTests: XCTestCase {

    // MARK: - Shape

    func test_today_isTheShapeTheServerWants() {
        let today = DayFormat.today()
        XCTAssertEqual(today.count, 10, today)
        let parts = today.split(separator: "-")
        XCTAssertEqual(parts.count, 3)
        XCTAssertEqual(parts[0].count, 4)
        XCTAssertEqual(parts[1].count, 2, "a single-digit month must be padded")
        XCTAssertEqual(parts[2].count, 2, "a single-digit day must be padded")
    }

    func test_wireString_padsMonthAndDay() {
        var parts = DateComponents()
        parts.year = 2026; parts.month = 3; parts.day = 7
        let date = Calendar(identifier: .gregorian).date(from: parts)!

        XCTAssertEqual(DayFormat.wireString(from: date), "2026-03-07")
    }

    // MARK: - The calendar on the wire is always the Gregorian one

    func test_wireString_ignoresANonGregorianCalendar() {
        var parts = DateComponents()
        parts.year = 2026; parts.month = 11; parts.day = 10
        let date = Calendar(identifier: .gregorian).date(from: parts)!

        XCTAssertEqual(DayFormat.wireString(from: date), "2026-11-10")

        // The same instant in the Buddhist calendar is the year 2569. Whatever the phone is set
        // to, that must never reach the server.
        let buddhistYear = Calendar(identifier: .buddhist).component(.year, from: date)
        XCTAssertEqual(buddhistYear, 2569, "fixture check: the two calendars really do disagree")
        XCTAssertFalse(DayFormat.wireString(from: date).hasPrefix("2569"))
    }

    func test_today_isAPlausibleGregorianYear() {
        let year = Int(DayFormat.today().prefix(4))!
        // A Buddhist-calendar phone would land in the 2500s, a Japanese-imperial one in single digits.
        XCTAssertGreaterThan(year, 2020)
        XCTAssertLessThan(year, 2100)
    }

    // MARK: - Round trip

    func test_aDayParsedAndWrittenBackIsTheSameDay() {
        for day in ["2026-01-01", "2026-03-07", "2026-07-15", "2026-12-31"] {
            guard let parsed = DayFormat.date(from: day) else { return XCTFail("could not read \(day)") }
            XCTAssertEqual(DayFormat.wireString(from: parsed), day)
        }
    }

    func test_aDayIsNotShiftedByTheTimeZone() {
        // Parsed at noon on purpose: midnight west of Greenwich is the evening before, and a hive
        // due on the 12th would read as due on the 11th.
        let parsed = DayFormat.date(from: "2026-05-12")!
        let components = Calendar.current.dateComponents([.hour], from: parsed)
        XCTAssertEqual(components.hour, 12)
        XCTAssertEqual(DayFormat.wireString(from: parsed), "2026-05-12")
    }

    // MARK: - What goes on the wire when a treatment is marked done

    func test_markDoneBodyCarriesTheDayUnderTheServersName() throws {
        let encoded = try JSONEncoder().encode(TreatmentDoneBody(doneOn: "2026-08-21"))
        let json = try XCTUnwrap(String(data: encoded, encoding: .utf8))

        XCTAssertTrue(json.contains("\"done_on\""), "the server reads done_on, not doneOn: \(json)")
        XCTAssertTrue(json.contains("2026-08-21"), json)
        XCTAssertFalse(json.contains("doneOn"), "the coding key is missing: \(json)")
    }

    func test_markDoneBodyIsNeverEmpty() throws {
        // An empty body is what made the server fall back to its UTC day.
        let encoded = try JSONEncoder().encode(TreatmentDoneBody(doneOn: DayFormat.today()))
        XCTAssertGreaterThan(encoded.count, 20)
    }
}
