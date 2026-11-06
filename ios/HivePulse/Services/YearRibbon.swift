import Foundation

/// Laying the beekeeper's year out as a ribbon: twelve months across, one row per subject.
///
/// A port of the website's `lib/yearRibbon.ts` and of Android's `YearRibbon.kt`, function for
/// function and edge for edge. The arithmetic lives apart from the view so it can be tested
/// without a simulator, and because every one of these functions has an edge a drawn bar would
/// only show as "slightly wrong": a leap year, an entry that runs over New Year, an entry that
/// starts in December and ends in the window of the year after.
///
/// Everything is returned as a percentage of the ribbon's width, so the same numbers work at
/// phone width and on an iPad without re-measuring anything.
enum YearRibbon {

    enum Season: String, CaseIterable {
        case winter, spring, summer, autumn
    }

    /// Which season a month belongs to, as a beekeeper would divide the year.
    static func season(ofMonth month: Int) -> Season {
        if month <= 2 || month == 12 { return .winter }
        if month <= 5 { return .spring }
        if month <= 8 { return .summer }
        return .autumn
    }

    /// A row of the ribbon. Six are a category of their own; `forage` is three of them at once.
    ///
    /// Bloom, migration and harvest are one story told in three steps -- something comes into
    /// flower, you drive the colonies to it, you take the honey off -- and on three separate rows
    /// that story is read across a gap rather than along a line. Rape blooms on 15 April and is
    /// spun on 15 May; on one row those two bars nearly touch and the sequence is obvious.
    enum Row: String, CaseIterable {
        case inspection, swarm, forage, varroa, feeding, care, winter
    }

    /// Which row a category is drawn in. An unknown category gets no row and is left out.
    static func row(ofCategory category: String) -> Row? {
        switch category {
        case "inspection": return .inspection
        case "swarm": return .swarm
        case "bloom", "migration", "harvest": return .forage
        case "varroa": return .varroa
        case "feeding": return .feeding
        case "care": return .care
        case "winter": return .winter
        default: return nil
        }
    }

    /// The order the rows appear in: roughly the order a beekeeper meets them through the year.
    static let rowOrder: [Row] = [.inspection, .swarm, .forage, .varroa, .feeding, .care, .winter]

    /// One bar of the ribbon.
    struct Bar: Identifiable, Equatable {
        /// The entry this bar draws, so a tap can show it. For a forage, the move.
        let entry: CalendarEntryOut
        /// Distance from the left edge of the ribbon, in percent.
        let left: Double
        /// Width in percent. Never zero: a one-day entry still has to be tappable.
        let width: Double
        /// True when the entry reaches past the edge of the year, so the bar can be open-ended.
        let clippedStart: Bool
        let clippedEnd: Bool
        /// The harvest of this forage, drawn as the tail of the same bar.
        ///
        /// A move and its harvest are one plant: you drive to the rape, and three weeks later you
        /// spin it. As two bars they landed on different lanes and the sequence was something you
        /// had to reconstruct; as one bar it is the shape of the thing.
        let harvest: CalendarEntryOut?
        /// Where the harvest begins, in percent of this bar's own width.
        let split: Double?

        var id: String { entry.id }
    }

    /// A row with its bars in date order, and those bars stacked into lanes so none overlaps.
    struct RibbonRow: Identifiable {
        let row: Row
        let bars: [Bar]
        let lanes: [[Bar]]

        var id: String { row.rawValue }
    }

    /// The gap a bar keeps from the next one in its lane, in percent of the year.
    ///
    /// Two bars that merely touch read as one long bar. A fifth of a percent is about three
    /// quarters of a day -- invisible as a date, plain as a seam.
    static let laneGap = 0.2

    struct SeasonSegment: Identifiable {
        let season: Season
        /// First and last month of the run, 1-based and inclusive.
        let fromMonth: Int
        let toMonth: Int
        let left: Double
        let width: Double

        var id: Int { fromMonth }
    }

    struct MonthColumn: Identifiable {
        let month: Int
        let left: Double
        let width: Double

        var id: Int { month }
    }

    // MARK: - Dates

    /// A fixed calendar: the dates the backend sends are plain days with no zone, and the ribbon
    /// must not shift by one because the phone is in Auckland.
    private static var calendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC") ?? .current
        return calendar
    }

    private static func date(_ year: Int, _ month: Int, _ day: Int) -> Date {
        calendar.date(from: DateComponents(year: year, month: month, day: day)) ?? Date(timeIntervalSince1970: 0)
    }

    /// Parses the `YYYY-MM-DD` the API sends. Nil when it is not a day at all.
    static func parse(_ iso: String) -> Date? {
        let parts = iso.prefix(10).split(separator: "-")
        guard parts.count == 3,
              let year = Int(parts[0]), let month = Int(parts[1]), let day = Int(parts[2]) else { return nil }
        return calendar.date(from: DateComponents(year: year, month: month, day: day))
    }

    /// Days in the year, so a bar in a leap year is not a day and a half out by December.
    static func daysInYear(_ year: Int) -> Int {
        let days = calendar.dateComponents([.day], from: date(year, 1, 1), to: date(year + 1, 1, 1)).day
        return days ?? 365
    }

    /// 0 for 1 January, 1 for 2 January. Negative for a day in the year before.
    static func dayOffset(_ iso: String, year: Int) -> Int {
        guard let day = parse(iso) else { return 0 }
        return calendar.dateComponents([.day], from: date(year, 1, 1), to: day).day ?? 0
    }

    // MARK: - Bars

    /// Where an entry sits on the ribbon, or nil when it does not touch this year at all.
    ///
    /// An entry that reaches past either edge is cut at the edge and says so, rather than being
    /// dropped or drawn overflowing: "winter rest" genuinely does start before January.
    static func bar(for entry: CalendarEntryOut, year: Int, harvest: CalendarEntryOut? = nil) -> Bar? {
        let total = Double(daysInYear(year))
        let rawStart = Double(dayOffset(entry.start, year: year))
        // Inclusive end: an entry that ends on the day it starts is one day long, not zero.
        // A forage runs to the end of its harvest, which is always the later of the two.
        let rawEnd = Double(dayOffset(harvest?.end ?? entry.end, year: year)) + 1
        if rawEnd <= 0 || rawStart >= total { return nil }

        let start = max(0, rawStart)
        let end = min(total, rawEnd)
        // A single day is about 0.27% of a year, too thin to hit with a finger; the floor is what
        // makes every bar reachable.
        let width = max(1.1, ((end - start) / total) * 100)
        let left = (start / total) * 100

        var split: Double?
        if let harvest, end > start {
            let at = min(max(Double(dayOffset(harvest.start, year: year)), 0), total)
            // Relative to what is actually drawn, so a bar cut off at New Year still splits in
            // the right place rather than off its own end.
            split = min(max(((at - start) / (end - start)) * 100, 0), 100)
        }

        return Bar(
            entry: entry,
            left: left,
            width: min(width, 100 - left),
            clippedStart: rawStart < 0,
            clippedEnd: rawEnd > total,
            harvest: split == nil ? nil : harvest,
            split: split
        )
    }

    /// A move and, when there is one, the harvest of the same plant.
    struct ForageUnit {
        let entry: CalendarEntryOut
        let harvest: CalendarEntryOut?
    }

    /// Moves and harvests of the same forage, brought together.
    ///
    /// Every harvest of a named forage follows its move: it starts as the flow ends and runs two
    /// to four weeks longer, so the pair is one stretch of time with two halves. A forage with no
    /// harvest entry stays a single bar, and a harvest that belongs to no plant stays one too.
    static func pairForages(_ entries: [CalendarEntryOut]) -> [ForageUnit] {
        var harvests: [String: CalendarEntryOut] = [:]
        for entry in entries where entry.category == "harvest" {
            if let honey = entry.honey { harvests[honey] = entry }
        }

        var paired: Set<String> = []
        var units: [ForageUnit] = []
        for entry in entries {
            var harvest: CalendarEntryOut?
            if entry.category == "migration", let honey = entry.honey {
                harvest = harvests[honey]
            }
            if let harvest { paired.insert(harvest.id) }
            units.append(ForageUnit(entry: entry, harvest: harvest))
        }
        // The harvests that were folded into a move are not bars of their own any more.
        return units.filter { !paired.contains($0.entry.id) }
    }

    /// The rows of the ribbon, in `rowOrder`, with the empty ones left out.
    ///
    /// The same entry can arrive twice for one year -- the API repeats an entry for every year the
    /// window reaches, and a window of thirteen months catches two runs of the same thing. Both
    /// are kept when they really are two runs in this year (a swarm check in spring and in
    /// summer), and the duplicate of one run is not.
    static func rows(for entries: [CalendarEntryOut], year: Int) -> [RibbonRow] {
        var seen: Set<String> = []
        let once = entries.filter { seen.insert("\($0.key):\($0.start):\($0.end)").inserted }

        var byRow: [Row: [Bar]] = [:]
        for unit in pairForages(once) {
            guard let bar = bar(for: unit.entry, year: year, harvest: unit.harvest),
                  let row = row(ofCategory: unit.entry.category) else { continue }
            byRow[row, default: []].append(bar)
        }

        return rowOrder.compactMap { candidate in
            guard let bars = byRow[candidate], !bars.isEmpty else { return nil }
            let sorted = bars.sorted { $0.left < $1.left }
            return RibbonRow(row: candidate, bars: sorted, lanes: lanes(for: sorted))
        }
    }

    /// Bars stacked into lanes, so that two things happening at once are two lines and not one
    /// illegible overlap.
    ///
    /// Beekeeping overlaps by nature: the swarm season runs through the first harvest, five
    /// migrations are open at the same time in June. Drawing those on one line either hides a bar
    /// behind another or shortens both into something untrue.
    ///
    /// Greedy, taking the earliest bar first and putting it in the first lane with room: for
    /// intervals sorted by start this uses the fewest lanes possible, so a row never grows taller
    /// than its busiest moment needs.
    static func lanes(for bars: [Bar]) -> [[Bar]] {
        var lanes: [[Bar]] = []
        for bar in bars.sorted(by: { $0.left < $1.left }) {
            if let index = lanes.firstIndex(where: { lane in
                guard let last = lane.last else { return true }
                return last.left + last.width + laneGap <= bar.left
            }) {
                lanes[index].append(bar)
            } else {
                lanes.append([bar])
            }
        }
        return lanes
    }

    /// Where today's line goes, in percent, or nil when today is in another year.
    static func todayPosition(_ today: String, year: Int) -> Double? {
        let total = Double(daysInYear(year))
        let offset = Double(dayOffset(today, year: year))
        if offset < 0 || offset >= total { return nil }
        // Mid-day, so the line sits inside today rather than on the boundary with yesterday.
        return ((offset + 0.5) / total) * 100
    }

    /// Month columns, as percentages, so the grid lines land on the first of each month.
    static func monthColumns(_ year: Int) -> [MonthColumn] {
        let total = Double(daysInYear(year))
        return (1...12).map { month in
            let start = Double(calendar.dateComponents([.day], from: date(year, 1, 1), to: date(year, month, 1)).day ?? 0)
            let next = month == 12
                ? total
                : Double(calendar.dateComponents([.day], from: date(year, 1, 1), to: date(year, month + 1, 1)).day ?? 0)
            return MonthColumn(month: month, left: (start / total) * 100, width: ((next - start) / total) * 100)
        }
    }

    /// Runs of consecutive months that share a season, for the scenery behind the bars.
    ///
    /// January and December are both winter but are not one run -- the year has two ends, and a
    /// single stretched winter panel would have to span the whole ribbon to cover them.
    static func seasonSegments(_ year: Int) -> [SeasonSegment] {
        var segments: [SeasonSegment] = []
        for column in monthColumns(year) {
            let season = season(ofMonth: column.month)
            if let last = segments.last, last.season == season, last.toMonth == column.month - 1 {
                segments[segments.count - 1] = SeasonSegment(
                    season: season,
                    fromMonth: last.fromMonth,
                    toMonth: column.month,
                    left: last.left,
                    width: last.width + column.width
                )
                continue
            }
            segments.append(SeasonSegment(
                season: season, fromMonth: column.month, toMonth: column.month,
                left: column.left, width: column.width
            ))
        }
        return segments
    }
}
