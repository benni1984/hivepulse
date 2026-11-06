import SwiftUI
import UIKit

/// The beekeeper's year at a glance: twelve months across, a row per subject, a bar per job.
///
/// The list answers "what do I do now". This answers what the list cannot: how the year hangs
/// together -- that swarm control runs straight through the first honey, that the varroa treatment
/// sits in the gap after the supers come off, that feeding and winter preparation are the same six
/// weeks.
///
/// **Why this scrolls sideways and the website's does not.** The website draws the ribbon from
/// tablet width up and gives a phone a plain vertical list instead, because twelve months across
/// 360 points is thirty points a month and unreadable. That reasoning is about the *viewport*, and
/// on the web there is no good answer: a sideways-scrolling strip inside a page fights the page's
/// own scrolling. In an app it does not -- swiping a strip sideways is an ordinary gesture -- so
/// here the canvas is simply made wider than the screen (`minCanvas`) and the year is dragged
/// through, and on an iPad or in landscape the canvas fills the width and nothing needs dragging
/// at all.
///
/// The constants are Android's, which is where they were settled -- on an emulator, by looking at
/// the thing. The arithmetic is identical on both clients, so a number that reads well there reads
/// well here, and a divergence would only mean one of the two had never been looked at.
///
/// The row labels stand in a column that does not scroll, so you still know which row you are
/// looking at after dragging into August. Their heights are computed from the same lane counts as
/// the rows themselves, which is what keeps the two columns in step.
struct YearRibbonView: View {

    let state: YearRibbonState
    @Binding var picked: YearRibbon.Bar?

    /// How wide the year is drawn, at the least.
    ///
    /// Two things pull against each other here. Wide enough and a month is comfortable to read;
    /// too wide and "the whole year in one picture" shows a quarter of a year and needs four
    /// drags, which is not a picture of anything. At 640 a month is 53 points -- room for "Jan"
    /// and for a three-week bar to be 37, which a gloved finger can hit -- and about six months
    /// are on an iPhone screen at once, so the year is two drags rather than four.
    private let minCanvas: CGFloat = 640
    /// The height of one lane of bars, and the gap between two lanes.
    private let laneHeight: CGFloat = 26
    private let laneSpacing: CGFloat = 4
    /// The gap between one row and the next, and the height of the month strip.
    private let rowSpacing: CGFloat = 14
    private let monthHeight: CGFloat = 24
    /// The row names column. Every point here is a point the year does not get, and on a phone
    /// that is the one thing the screen is for, so it is as narrow as two lines of the longest
    /// name allow.
    private let labelWidth: CGFloat = 58
    /// How tall a row label block is, so the label column lines up with the rows beside it.
    /// Two lines of 11 points: the longest of these names needs two in every language
    /// ("Schwarmkontrolle", "Contrôle de l'essaimage"), and at 16 the second was cut off.
    private let labelHeight: CGFloat = 22

    private var rows: [YearRibbon.RibbonRow] { state.rows }

    private func height(of row: YearRibbon.RibbonRow) -> CGFloat {
        let lanes = CGFloat(max(row.lanes.count, 1))
        return lanes * laneHeight + (lanes - 1) * laneSpacing
    }

    var body: some View {
        GeometryReader { geometry in
            let canvas = max(minCanvas, geometry.size.width - labelWidth - 8)
            HStack(alignment: .top, spacing: 8) {
                labelColumn
                ScrollView(.horizontal, showsIndicators: true) {
                    VStack(alignment: .leading, spacing: rowSpacing) {
                        monthStrip(canvas)
                        ForEach(rows) { row in
                            rowStrip(row, canvas: canvas)
                        }
                    }
                    .frame(width: canvas, alignment: .topLeading)
                }
                // The identifier belongs to the strip that scrolls, not to the whole view. On the
                // outer frame SwiftUI passed it down to whichever child it felt like -- the test
                // log shows it resolving to a StaticText -- and a drag across a scrap of text
                // moves no scroll view, so the year never scrolled and no bar ever came into
                // reach. Named here, "yearRibbon" is the thing a swipe has to land on.
                .accessibilityIdentifier("yearRibbon")
            }
        }
        .frame(height: totalHeight)
    }

    /// The whole thing is a fixed height, because it sits inside a vertical scroll view and a
    /// GeometryReader would otherwise claim every point it is offered.
    private var totalHeight: CGFloat {
        monthHeight + rows.reduce(0) { $0 + rowSpacing + labelHeight + height(of: $1) }
    }

    // MARK: - The label column

    private var labelColumn: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Lines the column up with the month strip, which has no label of its own.
            Color.clear.frame(height: monthHeight)
            ForEach(rows) { row in
                VStack(alignment: .leading, spacing: 0) {
                    Text(rowLabel(row.row))
                        // A fixed size rather than `.caption2`, which grows with the reader's
                        // text setting: the block it sits in is exactly two lines tall, so a
                        // label that grew would be cut off instead of wrapping.
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.hpStone500)
                        .lineLimit(2)
                        .frame(height: labelHeight, alignment: .bottomLeading)
                    Spacer(minLength: 0)
                }
                .padding(.top, rowSpacing)
                .frame(height: rowSpacing + labelHeight + height(of: row), alignment: .topLeading)
            }
        }
        .frame(width: labelWidth, alignment: .topLeading)
    }

    private func rowLabel(_ row: YearRibbon.Row) -> String {
        switch row {
        case .inspection: return NSLocalizedString("calendar.category.inspection", comment: "")
        case .swarm: return NSLocalizedString("calendar.category.swarm", comment: "")
        // The one row that is three categories at once, so it needs a name of its own.
        case .forage: return NSLocalizedString("calendar.rows.forage", comment: "")
        case .varroa: return NSLocalizedString("calendar.category.varroa", comment: "")
        case .feeding: return NSLocalizedString("calendar.category.feeding", comment: "")
        case .care: return NSLocalizedString("calendar.category.care", comment: "")
        case .winter: return NSLocalizedString("calendar.category.winter", comment: "")
        }
    }

    // MARK: - The months

    private func monthStrip(_ canvas: CGFloat) -> some View {
        ZStack(alignment: .topLeading) {
            // A quiet, still tint per season, so winter and summer are tellable at a glance.
            ForEach(YearRibbon.seasonSegments(state.year)) { segment in
                seasonTint(segment.season)
                    .frame(width: canvas * segment.width / 100, height: monthHeight)
                    .offset(x: canvas * segment.left / 100)
            }
            ForEach(YearRibbon.monthColumns(state.year)) { column in
                Text(Self.shortMonth(column.month))
                    .font(.caption2.weight(.semibold))
                    .foregroundColor(.hpStone500)
                    .lineLimit(1)
                    .padding(.leading, 5)
                    .frame(width: canvas * column.width / 100, height: monthHeight, alignment: .leading)
                    .offset(x: canvas * column.left / 100)
            }
        }
        .frame(width: canvas, height: monthHeight, alignment: .topLeading)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    // MARK: - A row

    private func rowStrip(_ row: YearRibbon.RibbonRow, canvas: CGFloat) -> some View {
        let rowHeight = height(of: row)
        return VStack(alignment: .leading, spacing: 0) {
            // The label is in the column at the left; this is the space it occupies, so the two
            // sides stay level without either having to measure the other.
            Color.clear.frame(height: labelHeight)
            ZStack(alignment: .topLeading) {
                // The month grid, faint, so a bar can be read against the calendar.
                ForEach(YearRibbon.monthColumns(state.year)) { column in
                    Rectangle()
                        .fill(column.month % 2 == 0 ? Color.black.opacity(0.03) : Color.clear)
                        .frame(width: canvas * column.width / 100, height: rowHeight)
                        .offset(x: canvas * column.left / 100)
                }
                ForEach(Array(row.lanes.enumerated()), id: \.offset) { index, lane in
                    ForEach(lane) { bar in
                        Button {
                            picked = picked?.id == bar.id ? nil : bar
                        } label: {
                            BarBlock(bar: bar, picked: picked?.id == bar.id, height: laneHeight)
                        }
                        .buttonStyle(.plain)
                        .frame(width: max(canvas * bar.width / 100, 1), height: laneHeight)
                        .offset(
                            x: canvas * bar.left / 100,
                            y: CGFloat(index) * (laneHeight + laneSpacing)
                        )
                        .accessibilityIdentifier("ribbonBar")
                        .accessibilityLabel(Self.spokenLabel(for: bar))
                    }
                }
                // Today, over the bars rather than under them: it is the one line a beekeeper
                // looks for first, and a bar would hide it.
                if let todayAt = state.todayAt {
                    Rectangle()
                        .fill(Color.hpAmber)
                        .frame(width: 2, height: rowHeight)
                        .offset(x: canvas * todayAt / 100)
                }
            }
            .frame(width: canvas, height: rowHeight, alignment: .topLeading)
        }
    }

    /// "Swarm control, 22 Apr – 2 Jul" -- the two things a bar's position and length mean, for
    /// somebody who cannot see either. `shortDay` is what the detail card under the ribbon uses.
    static func spokenLabel(for bar: YearRibbon.Bar) -> String {
        // A forage reads from the move to the end of its harvest, because that is the one bar it
        // is drawn as. Android's `barDates` says the same.
        let from = BeekeepingYear.shortDay(bar.entry.start)
        let to = BeekeepingYear.shortDay(bar.harvest?.end ?? bar.entry.end)
        return "\(bar.entry.title), \(from) – \(to)"
    }

    private func seasonTint(_ season: YearRibbon.Season) -> Color {
        switch season {
        case .winter: return Color(red: 0.945, green: 0.961, blue: 0.976)
        case .spring: return Color(red: 0.941, green: 0.992, blue: 0.957)
        case .summer: return Color(red: 0.996, green: 0.988, blue: 0.910)
        case .autumn: return Color(red: 0.996, green: 0.953, blue: 0.925)
        }
    }

    static func shortMonth(_ month: Int) -> String {
        var components = DateComponents()
        components.year = 2026
        components.month = month
        components.day = 1
        guard let date = Calendar.current.date(from: components) else { return "\(month)" }
        let formatter = DateFormatter()
        formatter.setLocalizedDateFormatFromTemplate("MMM")
        return formatter.string(from: date)
    }
}

/// One bar. A forage is drawn in two colours: the move, then its harvest as an amber tail.
///
/// The seam is a hard stop in a gradient rather than two shapes, so a bar one point wider than its
/// own label still shows both halves instead of dropping one.
private struct BarBlock: View {
    let bar: YearRibbon.Bar
    let picked: Bool
    let height: CGFloat

    var body: some View {
        ZStack(alignment: .leading) {
            RoundedRectangle(cornerRadius: 5).fill(fill)
            Text(label)
                .font(.caption2.weight(.semibold))
                .foregroundColor(.white)
                .lineLimit(1)
                .padding(.horizontal, 5)
        }
        .overlay(
            RoundedRectangle(cornerRadius: 5)
                .strokeBorder(Color.white, lineWidth: picked ? 2 : 0)
        )
        .accessibilityHidden(true)
    }

    private var fill: LinearGradient {
        let base = YearRibbonColours.tint(bar.entry.category)
        guard let split = bar.split else {
            return LinearGradient(colors: [base, base], startPoint: .leading, endPoint: .trailing)
        }
        let at = min(max(split / 100, 0), 1)
        return LinearGradient(
            stops: [
                .init(color: base, location: 0),
                .init(color: base, location: at),
                .init(color: .hpAmberDark, location: at),
                .init(color: .hpAmberDark, location: 1),
            ],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    /// The name on a bar: the plant for a forage, otherwise the job.
    private var label: String {
        if let honey = bar.entry.honey {
            return Forage.label(for: honey)
        }
        return bar.entry.title
    }
}

/// The colour of a bar, which is its category -- the only thing left telling them apart on a
/// shared row. The same values as Android's `barTint` and the website's `.dash-year-cat-*`.
enum YearRibbonColours {
    static func tint(_ category: String) -> Color {
        switch category {
        case "inspection": return Color(red: 0.086, green: 0.639, blue: 0.290)
        case "swarm": return Color(red: 0.863, green: 0.149, blue: 0.149)
        case "bloom": return Color(red: 0.396, green: 0.639, blue: 0.051)
        case "migration": return Color(red: 0.033, green: 0.569, blue: 0.698)
        case "harvest": return .hpAmberDark
        case "varroa": return Color(red: 0.725, green: 0.110, blue: 0.110)
        case "feeding": return Color(red: 0.851, green: 0.467, blue: 0.024)
        case "care": return Color(red: 0.486, green: 0.227, blue: 0.929)
        case "winter": return Color(red: 0.278, green: 0.333, blue: 0.408)
        default: return .hpStone500
        }
    }
}

/// A photograph of the thing itself: the plant in flower, a capped queen cell, the mite on a bee.
///
/// The bar says *when*; this says what you are looking for. The author and the licence sit under
/// it, which is what CC BY and CC BY-SA ask for and what `YearPhotos` carries for every picture.
///
/// The file is in the app, not fetched: at the apiary there is usually no signal, and a year
/// screen that loses its pictures off-grid would lose them exactly where they are wanted.
struct YearPhotoFigure: View {
    let photo: YearPhoto
    /// The small square tile for a list row, or the wide crop for a detail.
    var thumbnail = false

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            image
            Text(String(format: NSLocalizedString("calendar.photoCredit", comment: ""), photo.author, photo.licence))
                .font(.caption2)
                .foregroundColor(.hpStone500)
                .lineLimit(2)
                .accessibilityIdentifier("yearPhotoCredit")
        }
    }

    @ViewBuilder
    private var image: some View {
        if let loaded = Self.load(thumbnail ? photo.thumb : photo.file) {
            Image(uiImage: loaded)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(height: thumbnail ? 52 : 150)
                .frame(maxWidth: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .accessibilityIdentifier("yearPhoto")
        }
    }

    /// Decoded once per name and kept: a list scrolling through twelve months would otherwise
    /// decode the same WebP again on every pass.
    private static var cache: [String: UIImage] = [:]

    static func load(_ name: String) -> UIImage? {
        if let held = cache[name] { return held }
        guard let url = Bundle.main.url(forResource: name, withExtension: "webp"),
              let data = try? Data(contentsOf: url),
              let image = UIImage(data: data) else { return nil }
        cache[name] = image
        return image
    }
}

/// The entry, or both entries of a forage, under the ribbon once a bar is tapped.
struct RibbonDetail: View {
    let bar: YearRibbon.Bar

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // One picture for the pair: a forage shows its plant, which is what both halves are
            // about.
            if let photo = YearPhotos.of(bar.entry.key, honey: bar.entry.honey) {
                YearPhotoFigure(photo: photo)
            }
            part(bar.entry)
            if let harvest = bar.harvest {
                Divider()
                part(harvest)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .hpCard()
        .accessibilityIdentifier("ribbonDetail")
    }

    private func part(_ entry: CalendarEntryOut) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(BeekeepingYear.shortDay(entry.start) + " – " + BeekeepingYear.shortDay(entry.end))
                .font(.caption2).foregroundColor(.hpStone500)
            Text(entry.title).font(.subheadline.weight(.bold)).foregroundColor(.hpStone900)
            Text(entry.body).font(.caption).foregroundColor(.hpStone500)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
