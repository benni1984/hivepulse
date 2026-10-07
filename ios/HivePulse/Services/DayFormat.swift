import Foundation

/// A day as the server sends it ("2026-05-12", no time) shown in the reader's format, and the other way round.
///
/// Parsing it with the phone's own calendar and noon as the time keeps a hive due on the 12th from reading as due
/// on the 11th in a time zone west of the server's.
enum DayFormat {

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

    /// The server's format for a date picked on the phone: the phone's own calendar day.
    static func wireString(from date: Date) -> String {
        let parts = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 1970, parts.month ?? 1, parts.day ?? 1)
    }
}
