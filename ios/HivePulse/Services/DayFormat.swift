import Foundation

/// A day as the server sends it ("2026-05-12", no time) shown in the reader's format, and the other way round.
///
/// Two traps live here, and both have bitten:
///
/// **Time zone.** Parsing "2026-05-12" gives midnight, which west of Greenwich is still the evening of the
/// 11th: a hive due on the 12th would read as due on the 11th. Noon has no such edge, so that is the hour
/// a parsed day gets.
///
/// **Calendar.** `Calendar.current` and a `DateFormatter` without a locale follow the *reader's* calendar
/// preference. On a phone set to the Thai Buddhist calendar, today is the year 2569, and
/// `String(format: "%04d-…", parts.year)` would send `2569-11-10` to a server that stores it as written.
/// Japanese-imperial and Arabic-Indic digits do the same in their own way. So every conversion that touches
/// the wire pins the Gregorian calendar and `en_US_POSIX` explicitly, and only the *display* side is allowed
/// to follow the reader.
///
/// The server's own "today" is the UTC day (`app/clock.py`, #443), which after about 22:00 in Europe is
/// yesterday. So the phone sends the day it means instead of leaving the field out.
enum DayFormat {

    /// The reader's time zone, but never the reader's calendar: this is what goes on the wire.
    private static var wireCalendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = .current
        calendar.locale = Locale(identifier: "en_US_POSIX")
        return calendar
    }

    private static let wire: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    /// The day for the reader, or the text as it came when it cannot be read; empty for nothing.
    static func string(from day: String?) -> String {
        guard let day, !day.isEmpty else { return "" }
        guard let date = date(from: day) else { return day }
        return date.formatted(date: .abbreviated, time: .omitted)
    }

    /// Noon of the day, in the phone's time zone.
    static func date(from day: String) -> Date? {
        guard let parsed = wire.date(from: String(day.prefix(10))) else { return nil }
        return Calendar.current.date(bySettingHour: 12, minute: 0, second: 0, of: parsed)
    }

    /// The server's format for a date picked on the phone: the phone's own calendar day, in the
    /// Gregorian calendar whatever the phone is set to.
    static func wireString(from date: Date) -> String {
        let parts = wireCalendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 1970, parts.month ?? 1, parts.day ?? 1)
    }

    /// Today, as the phone's own calendar has it — what to send when the server would otherwise
    /// fall back to its UTC day.
    static func today() -> String {
        wireString(from: Date())
    }
}
