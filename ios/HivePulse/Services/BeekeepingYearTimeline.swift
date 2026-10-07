import Foundation

/// One row of the endless timeline: a month header, the divider where today falls, or an entry.
struct TimelineItem: Identifiable, Equatable {
    enum Kind: Equatable {
        /// "2026-05"
        case month(String)
        case today
        case entry(CalendarEntryOut)
    }

    let id: String
    let kind: Kind
}

/// The arithmetic behind the timeline, the same rules as the website's `lib/calendar.ts`.
enum BeekeepingYear {

    /// The windows the timeline asks for: about a third of a year each.
    static let windowDays = 120

    /// The countries offered for the region, as ISO 3166-1 alpha-2 codes.
    static let countryCodes = [
        "AL", "AD", "AT", "BE", "BA", "BG", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GR", "HR",
        "HU", "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NL", "NO", "PL", "PT", "RO",
        "RS", "SE", "SI", "SK", "SM", "TR", "UA",
    ]

    /// The language of the app as the server knows it: "de", "fr", "es" or "en".
    static var appLanguage: String {
        let tag = Bundle.main.preferredLocalizations.first?.prefix(2).lowercased() ?? "en"
        return ["en", "de", "fr", "es"].contains(tag) ? tag : "en"
    }

    /// What the dates are moved by, in words.
    static func regionLine(_ region: RegionOut) -> String {
        if region.source == "default" { return NSLocalizedString("calendar.regionNone", comment: "") }
        let place: String
        if region.source == "postal_code" {
            let name = region.country.map { countryName($0, language: appLanguage) } ?? ""
            place = [name, region.postalCode ?? ""].filter { !$0.isEmpty }.joined(separator: " ")
        } else {
            place = NSLocalizedString("calendar.regionFromApiary", comment: "")
        }
        if region.shiftDays == 0 {
            return String(format: NSLocalizedString("calendar.regionNoShift", comment: ""), place)
        }
        let key = region.shiftDays > 0 ? "calendar.regionLater" : "calendar.regionEarlier"
        return String(format: NSLocalizedString(key, comment: ""), place, abs(region.shiftDays))
    }

    /// "2026-05" as the month and year the reader knows.
    static func monthName(_ month: String) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: appLanguage)
        formatter.dateFormat = "LLLL yyyy"
        guard let date = DayFormat.date(from: month + "-01") else { return month }
        return formatter.string(from: date).capitalized(with: formatter.locale)
    }

    /// "2026-05-12" as day and abbreviated month.
    static func shortDay(_ day: String) -> String {
        guard let date = DayFormat.date(from: day) else { return day }
        return date.formatted(.dateTime.day().month(.abbreviated))
    }

    /// The name of a country in the language of the app; the code itself when it cannot be named.
    static func countryName(_ code: String, language: String) -> String {
        Locale(identifier: language).localizedString(forRegionCode: code) ?? code
    }

    private static func calendar() -> Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        return calendar
    }

    /// `day` plus `days`, on the calendar.
    static func addDays(_ day: String, _ days: Int) -> String {
        let parts = day.prefix(10).split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return day }
        // Noon in UTC on both sides, so neither the phone's time zone nor a clock change can move the day.
        var components = DateComponents(year: parts[0], month: parts[1], day: parts[2] + days, hour: 12)
        components.timeZone = TimeZone(identifier: "UTC")
        guard let date = calendar().date(from: components) else { return day }
        return dayString(date)
    }

    /// The first of the month `monthsAgo` months before the one `day` is in.
    static func firstOfMonth(_ day: String, monthsAgo: Int = 0) -> String {
        let parts = day.prefix(10).split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return day }
        var components = DateComponents(year: parts[0], month: parts[1] - monthsAgo, day: 1, hour: 12)
        components.timeZone = TimeZone(identifier: "UTC")
        guard let date = calendar().date(from: components) else { return day }
        return dayString(date)
    }

    private static func dayString(_ date: Date) -> String {
        let parts = calendar().dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 1970, parts.month ?? 1, parts.day ?? 1)
    }

    /// Entries of several windows in one list, once each, oldest first.
    static func merge(_ current: [CalendarEntryOut], _ incoming: [CalendarEntryOut]) -> [CalendarEntryOut] {
        var byId: [String: CalendarEntryOut] = [:]
        for entry in current + incoming { byId[entry.id] = entry }
        return byId.values.sorted { lhs, rhs in
            lhs.start == rhs.start ? lhs.key < rhs.key : lhs.start < rhs.start
        }
    }

    /// A header for every month an entry starts in, the entries of that month, and a divider where today falls:
    /// after the entries that started before it and before the ones that start later.
    static func timeline(_ entries: [CalendarEntryOut], today: String) -> [TimelineItem] {
        var items: [TimelineItem] = []
        var month = ""
        var todayShown = false
        let todayMonth = String(today.prefix(7))

        func header(_ value: String) {
            items.append(TimelineItem(id: "month-" + value, kind: .month(value)))
            month = value
        }
        func showToday() {
            if !todayShown {
                items.append(TimelineItem(id: "today", kind: .today))
                todayShown = true
            }
        }

        for entry in entries {
            if !todayShown && entry.start > today {
                if month != todayMonth { header(todayMonth) }
                showToday()
            }
            let entryMonth = String(entry.start.prefix(7))
            if entryMonth != month { header(entryMonth) }
            items.append(TimelineItem(id: entry.id, kind: .entry(entry)))
        }
        if let last = entries.last, !todayShown, last.start <= today {
            if month != todayMonth { header(todayMonth) }
            showToday()
        }
        return items
    }
}
