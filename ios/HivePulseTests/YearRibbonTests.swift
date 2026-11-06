import XCTest
@testable import HivePulse

/// The ribbon draws the beekeeper's year as twelve months across. Every function here has an edge
/// that a drawn bar would only ever show as "slightly wrong" -- a leap year, an entry that runs
/// over New Year, a one-day entry too thin for a finger -- which is why the arithmetic is tested
/// and not the pixels.
///
/// These mirror the website's `__tests__/yearRibbon.test.ts` and Android's `YearRibbonTests.kt`
/// case for case. All three have to agree: a beekeeper who looks at the year on the iPhone, on
/// Android and on the website must see the same shape.
final class YearRibbonTests: XCTestCase {

    private func entry(
        key: String = "swarm-check",
        category: String = "swarm",
        title: String = "Swarm control",
        body: String = "Every nine days.",
        start: String = "2026-05-01",
        end: String = "2026-06-30",
        intervalDays: Int? = 9,
        honey: String? = nil,
        active: Bool = false
    ) -> CalendarEntryOut {
        CalendarEntryOut(
            key: key, category: category, title: title, body: body,
            start: start, end: end, intervalDays: intervalDays, honey: honey, active: active
        )
    }

    // MARK: - The length of the year

    func testCountsALeapYearAsADayLonger() {
        XCTAssertEqual(YearRibbon.daysInYear(2026), 365)
        XCTAssertEqual(YearRibbon.daysInYear(2028), 366)
    }

    func testPlacesTheFirstOfJanuaryAtNoughtAndTheLastOfDecemberAtTheEnd() {
        XCTAssertEqual(YearRibbon.dayOffset("2026-01-01", year: 2026), 0)
        XCTAssertEqual(YearRibbon.dayOffset("2026-01-02", year: 2026), 1)
        XCTAssertEqual(YearRibbon.dayOffset("2026-12-31", year: 2026), 364)
        // An entry of the year before is negative, which is what lets a bar be cut at the edge.
        XCTAssertEqual(YearRibbon.dayOffset("2025-12-15", year: 2026), -17)
    }

    // MARK: - A bar on the ribbon

    func testSpansTheDaysTheEntryCoversCountingBothEnds() throws {
        let bar = try XCTUnwrap(YearRibbon.bar(for: entry(start: "2026-05-01", end: "2026-05-31"), year: 2026))
        let total = Double(YearRibbon.daysInYear(2026))
        XCTAssertEqual(bar.left, (Double(YearRibbon.dayOffset("2026-05-01", year: 2026)) / total) * 100, accuracy: 1e-9)
        // 31 days, not 30: an entry that ends on the day it starts is one day long.
        XCTAssertEqual(bar.width, (31 / total) * 100, accuracy: 1e-9)
        XCTAssertFalse(bar.clippedStart)
        XCTAssertFalse(bar.clippedEnd)
    }

    func testGivesASingleDayEnoughWidthToBeTapped() throws {
        let bar = try XCTUnwrap(YearRibbon.bar(for: entry(start: "2026-05-01", end: "2026-05-01"), year: 2026))
        // One day is 0.27% of a year, which no finger can hit.
        XCTAssertGreaterThanOrEqual(bar.width, 1.1)
    }

    func testCutsAnEntryThatStartedLastYearAtTheEdgeAndSaysItDid() throws {
        let bar = try XCTUnwrap(YearRibbon.bar(for: entry(start: "2025-12-15", end: "2026-02-10"), year: 2026))
        XCTAssertEqual(bar.left, 0, accuracy: 1e-9)
        XCTAssertTrue(bar.clippedStart)
        XCTAssertFalse(bar.clippedEnd)
        let total = Double(YearRibbon.daysInYear(2026))
        XCTAssertEqual(bar.width, (Double(YearRibbon.dayOffset("2026-02-10", year: 2026) + 1) / total) * 100, accuracy: 1e-9)
    }

    func testCutsAnEntryThatRunsIntoNextYearAtTheOtherEdge() throws {
        let bar = try XCTUnwrap(YearRibbon.bar(for: entry(start: "2026-11-25", end: "2027-01-15"), year: 2026))
        XCTAssertTrue(bar.clippedEnd)
        XCTAssertFalse(bar.clippedStart)
        XCTAssertEqual(bar.left + bar.width, 100, accuracy: 1e-9)
    }

    func testNeverLetsABarReachPastTheRightEdge() throws {
        // A one-day entry on 31 December would be widened past the end by the tap floor.
        let bar = try XCTUnwrap(YearRibbon.bar(for: entry(start: "2026-12-31", end: "2026-12-31"), year: 2026))
        XCTAssertLessThanOrEqual(bar.left + bar.width, 100 + 1e-9)
    }

    func testDropsAnEntryThatDoesNotTouchTheYearAtAll() {
        XCTAssertNil(YearRibbon.bar(for: entry(start: "2025-03-01", end: "2025-04-01"), year: 2026))
        XCTAssertNil(YearRibbon.bar(for: entry(start: "2027-03-01", end: "2027-04-01"), year: 2026))
    }

    // MARK: - The rows

    func testKeepsTheRowOrderAndLeavesOutTheRowsWithNothingInThem() {
        let rows = YearRibbon.rows(for: [
            entry(key: "winter-rest", category: "winter", start: "2026-01-01", end: "2026-02-10"),
            entry(key: "first-inspection", category: "inspection", start: "2026-03-01", end: "2026-03-31"),
        ], year: 2026)
        XCTAssertEqual(rows.map(\.row), [.inspection, .winter])
    }

    func testDrawsBloomMigrationAndHarvestOnOneRow() {
        let rows = YearRibbon.rows(for: [
            entry(key: "spring-bloom", category: "bloom", start: "2026-03-15", end: "2026-04-30"),
            entry(key: "migrate-acacia", category: "migration", start: "2026-05-10", end: "2026-05-30", honey: "acacia"),
            entry(key: "mystery-harvest", category: "harvest", start: "2026-07-01", end: "2026-07-20"),
        ], year: 2026)
        XCTAssertEqual(rows.count, 1)
        XCTAssertEqual(rows[0].row, .forage)
        XCTAssertEqual(rows[0].bars.count, 3)
    }

    func testLeavesEveryBarItsOwnCategory() {
        // On a shared row the colour is the only thing left telling them apart.
        let rows = YearRibbon.rows(for: [
            entry(key: "spring-bloom", category: "bloom", start: "2026-03-15", end: "2026-04-30"),
            entry(key: "mystery-harvest", category: "harvest", start: "2026-07-01", end: "2026-07-20"),
        ], year: 2026)
        XCTAssertEqual(rows[0].bars.map(\.entry.category), ["bloom", "harvest"])
    }

    func testDrawsAForageAsOneBarFromTheMoveToTheEndOfItsHarvest() {
        // You drive to the rape on 15 April and spin it on 5 June. That is one stretch of time
        // with two halves, and as two bars it landed on two lanes.
        let rows = YearRibbon.rows(for: [
            entry(key: "migrate-rapeseed", category: "migration", start: "2026-04-15", end: "2026-05-05", honey: "rapeseed"),
            entry(key: "harvest-rapeseed", category: "harvest", start: "2026-05-15", end: "2026-06-05", honey: "rapeseed"),
        ], year: 2026)
        XCTAssertEqual(rows[0].bars.count, 1)
        let bar = rows[0].bars[0]
        XCTAssertEqual(bar.entry.key, "migrate-rapeseed")
        XCTAssertEqual(bar.harvest?.key, "harvest-rapeseed")
        // 15 April to 5 June inclusive, not 15 April to 5 May.
        let expected = Double(YearRibbon.dayOffset("2026-06-05", year: 2026) + 1 - YearRibbon.dayOffset("2026-04-15", year: 2026))
            / Double(YearRibbon.daysInYear(2026)) * 100
        XCTAssertEqual(bar.width, expected, accuracy: 1e-9)
    }

    func testSplitsThatBarWhereTheHarvestBegins() throws {
        let rows = YearRibbon.rows(for: [
            entry(key: "migrate-rapeseed", category: "migration", start: "2026-04-15", end: "2026-05-05", honey: "rapeseed"),
            entry(key: "harvest-rapeseed", category: "harvest", start: "2026-05-15", end: "2026-06-05", honey: "rapeseed"),
        ], year: 2026)
        // 30 days of the 52 the bar covers are behind it when the harvest starts.
        let split = try XCTUnwrap(rows[0].bars[0].split)
        XCTAssertEqual(split, (30.0 / 52.0) * 100, accuracy: 0.1)
    }

    func testLeavesAForageWithNoHarvestEntryAsABarOfItsOwn() {
        let rows = YearRibbon.rows(for: [
            entry(key: "migrate-lavender", category: "migration", start: "2026-06-15", end: "2026-07-31", honey: "lavender"),
        ], year: 2026)
        XCTAssertEqual(rows[0].bars.count, 1)
        XCTAssertNil(rows[0].bars[0].harvest)
        XCTAssertNil(rows[0].bars[0].split)
    }

    func testLeavesAHarvestThatBelongsToNoPlantAlone() {
        // A harvest with no plant must never be folded into somebody else's move, which is what
        // would happen if the lookup ignored the forage.
        let rows = YearRibbon.rows(for: [
            entry(key: "mystery-harvest", category: "harvest", start: "2026-07-20", end: "2026-08-10", honey: nil),
        ], year: 2026)
        XCTAssertEqual(rows[0].bars.count, 1)
        XCTAssertEqual(rows[0].bars[0].entry.key, "mystery-harvest")
    }

    func testDoesNotPairAHarvestWithAMoveOfADifferentPlant() {
        let units = YearRibbon.pairForages([
            entry(key: "migrate-linden", category: "migration", honey: "linden"),
            entry(key: "harvest-heather", category: "harvest", honey: "heather"),
        ])
        XCTAssertEqual(units.count, 2)
        XCTAssertNil(units[0].harvest)
    }

    func testDropsAForagePairToFiveBarsWhereThreeRowsNeededTen() {
        // The whole point of the merge: fewer bars, and every plant on one line.
        let forages = [
            ("rapeseed", "2026-04-15", "2026-05-05", "2026-05-15", "2026-06-05"),
            ("acacia", "2026-05-10", "2026-05-30", "2026-05-28", "2026-06-15"),
            ("linden", "2026-06-15", "2026-07-10", "2026-07-08", "2026-07-31"),
            ("fir", "2026-06-01", "2026-07-31", "2026-07-15", "2026-08-31"),
            ("heather", "2026-08-01", "2026-09-10", "2026-09-05", "2026-09-30"),
        ]
        let entries = forages.flatMap { honey, moveStart, moveEnd, harvestStart, harvestEnd in
            [
                entry(key: "migrate-\(honey)", category: "migration", start: moveStart, end: moveEnd, honey: honey),
                entry(key: "harvest-\(honey)", category: "harvest", start: harvestStart, end: harvestEnd, honey: honey),
            ]
        }
        let rows = YearRibbon.rows(for: entries, year: 2026)
        XCTAssertEqual(rows[0].bars.count, 5)
        XCTAssertLessThanOrEqual(rows[0].lanes.count, 3)
    }

    func testDoesNotMergeAnythingElse() {
        let rows = YearRibbon.rows(for: [
            entry(key: "comb-renewal", category: "care", start: "2026-04-01", end: "2026-04-30"),
            entry(key: "foulbrood-check", category: "care", start: "2026-05-01", end: "2026-05-30"),
        ], year: 2026)
        XCTAssertEqual(rows[0].bars.count, 2)
        XCTAssertTrue(rows[0].bars.allSatisfy { $0.harvest == nil })
    }

    func testShowsTheSameRunOnceEvenThoughTheAPIRepeatsItPerYear() {
        let same = entry(key: "swarm-check", start: "2026-05-01", end: "2026-06-30")
        let rows = YearRibbon.rows(for: [same, same], year: 2026)
        XCTAssertEqual(rows[0].bars.count, 1)
    }

    func testKeepsTwoGenuineRunsOfOneEntryInTheSameYear() {
        let rows = YearRibbon.rows(for: [
            entry(key: "swarm-check", start: "2026-05-01", end: "2026-05-31"),
            entry(key: "swarm-check", start: "2026-07-01", end: "2026-07-31"),
        ], year: 2026)
        XCTAssertEqual(rows[0].bars.count, 2)
    }

    func testSortsTheBarsOfARowByWhenTheyStart() {
        let rows = YearRibbon.rows(for: [
            entry(key: "late", category: "care", start: "2026-09-01", end: "2026-09-20"),
            entry(key: "early", category: "care", start: "2026-03-01", end: "2026-03-20"),
        ], year: 2026)
        XCTAssertEqual(rows[0].bars.map(\.entry.key), ["early", "late"])
    }

    // MARK: - The lanes within a row

    private func bar(left: Double, width: Double) -> YearRibbon.Bar {
        YearRibbon.Bar(
            entry: entry(), left: left, width: width,
            clippedStart: false, clippedEnd: false, harvest: nil, split: nil
        )
    }

    func testKeepsBarsThatDoNotOverlapOnOneLane() {
        XCTAssertEqual(YearRibbon.lanes(for: [bar(left: 0, width: 10), bar(left: 20, width: 10)]).count, 1)
    }

    func testPutsTwoOverlappingBarsOnTwoLanes() {
        let lanes = YearRibbon.lanes(for: [bar(left: 0, width: 20), bar(left: 10, width: 20)])
        XCTAssertEqual(lanes.count, 2)
        XCTAssertEqual(lanes[0].count, 1)
        XCTAssertEqual(lanes[1].count, 1)
    }

    func testUsesNoMoreLanesThanTheBusiestMomentNeeds() {
        // Three open at once, then room again: three lanes, and the fourth bar rejoins the first.
        let lanes = YearRibbon.lanes(for: [
            bar(left: 0, width: 30), bar(left: 5, width: 30), bar(left: 10, width: 30), bar(left: 50, width: 10),
        ])
        XCTAssertEqual(lanes.count, 3)
        XCTAssertEqual(lanes[0].count, 2)
    }

    func testSeparatesBarsThatMerelyTouch() {
        // Ends exactly where the next begins: one long bar to the eye, so they go on two lanes.
        XCTAssertEqual(YearRibbon.lanes(for: [bar(left: 0, width: 10), bar(left: 10, width: 10)]).count, 2)
    }

    func testKeepsBarsOnOneLaneOnceTheGapIsClear() {
        XCTAssertEqual(
            YearRibbon.lanes(for: [bar(left: 0, width: 10), bar(left: 10 + YearRibbon.laneGap, width: 10)]).count,
            1
        )
    }

    func testLosesNoBarAndLeavesEveryLaneInDateOrder() {
        let bars = [
            bar(left: 0, width: 30), bar(left: 5, width: 10), bar(left: 18, width: 30),
            bar(left: 60, width: 5), bar(left: 62, width: 5),
        ]
        let lanes = YearRibbon.lanes(for: bars)
        XCTAssertEqual(lanes.reduce(0) { $0 + $1.count }, bars.count)
        for lane in lanes {
            XCTAssertEqual(lane.map(\.left), lane.map(\.left).sorted())
        }
    }

    func testGivesEveryRowItsLanesAlongsideItsBars() {
        let rows = YearRibbon.rows(for: [
            entry(key: "a", category: "care", start: "2026-04-01", end: "2026-06-30"),
            entry(key: "b", category: "care", start: "2026-05-01", end: "2026-07-31"),
        ], year: 2026)
        XCTAssertEqual(rows[0].bars.count, 2)
        XCTAssertEqual(rows[0].lanes.count, 2)
    }

    // MARK: - Today's line

    func testSitsInsideTodayRatherThanOnTheBoundaryWithYesterday() throws {
        let at = try XCTUnwrap(YearRibbon.todayPosition("2026-07-01", year: 2026))
        let total = Double(YearRibbon.daysInYear(2026))
        XCTAssertEqual(at, ((Double(YearRibbon.dayOffset("2026-07-01", year: 2026)) + 0.5) / total) * 100, accuracy: 1e-9)
    }

    func testIsLeftOffWhenTodayIsInAnotherYear() {
        XCTAssertNil(YearRibbon.todayPosition("2025-07-01", year: 2026))
        XCTAssertNil(YearRibbon.todayPosition("2027-07-01", year: 2026))
    }

    // MARK: - The month grid

    func testHasTwelveColumnsThatExactlyFillTheRibbon() {
        let columns = YearRibbon.monthColumns(2026)
        XCTAssertEqual(columns.count, 12)
        XCTAssertEqual(columns.first?.left ?? -1, 0, accuracy: 1e-9)
        XCTAssertEqual((columns.last?.left ?? 0) + (columns.last?.width ?? 0), 100, accuracy: 1e-9)
        XCTAssertEqual(columns.reduce(0) { $0 + $1.width }, 100, accuracy: 1e-9)
    }

    func testGivesFebruaryItsExtraDayInALeapYear() {
        let plain = YearRibbon.monthColumns(2026)[1]
        let leap = YearRibbon.monthColumns(2028)[1]
        XCTAssertGreaterThan(leap.width * 366, plain.width * 365)
    }

    // MARK: - The seasons behind the bars

    func testSplitsTheYearIntoRunsOfMonthsThatShareASeason() {
        let segments = YearRibbon.seasonSegments(2026)
        XCTAssertEqual(segments.map(\.season), [.winter, .spring, .summer, .autumn, .winter])
        XCTAssertEqual(segments.first?.fromMonth, 1)
        XCTAssertEqual(segments.first?.toMonth, 2)
    }

    func testDoesNotJoinJanuaryAndDecemberIntoOneWinter() {
        let winters = YearRibbon.seasonSegments(2026).filter { $0.season == .winter }
        XCTAssertEqual(winters.count, 2)
        XCTAssertEqual(winters.last?.fromMonth, 12)
        XCTAssertEqual(winters.last?.toMonth, 12)
    }

    func testCoversTheRibbonWithNoGapBetweenTheSegments() {
        let segments = YearRibbon.seasonSegments(2026)
        XCTAssertEqual(segments.first?.left ?? -1, 0, accuracy: 1e-9)
        XCTAssertEqual(segments.reduce(0) { $0 + $1.width }, 100, accuracy: 1e-9)
        for (before, after) in zip(segments, segments.dropFirst()) {
            XCTAssertEqual(after.left, before.left + before.width, accuracy: 1e-9)
        }
    }

    // MARK: - The three sides agree

    func testRowsCoverEveryCategoryTheBackendCanSend() {
        // A category with no row would silently vanish from the ribbon. The list is the enum of
        // docs/api-contract.md; a new one has to be given a row here, on Android and on the website.
        for category in ["inspection", "swarm", "bloom", "migration", "harvest",
                         "varroa", "feeding", "care", "winter"] {
            XCTAssertNotNil(YearRibbon.row(ofCategory: category), "\(category) has no row")
        }
        XCTAssertNil(YearRibbon.row(ofCategory: "something-new"))
    }

    // MARK: - The photographs

    func testEveryForageHasThePictureOfItsPlant() {
        // A forage is one bar named after the plant; without the plant's picture the bar would
        // show the honey extractor, which looks the same in every month.
        for forage in ["rapeseed", "acacia", "chestnut", "linden", "fir", "lavender", "sunflower", "heather"] {
            XCTAssertNotNil(YearPhotos.byForage[forage], "\(forage) has no plant picture")
        }
    }

    func testAForageEntryShowsThePlantWhateverTheJobIs() {
        let move = YearPhotos.of("migrate-rapeseed", honey: "rapeseed")
        let harvest = YearPhotos.of("harvest-rapeseed", honey: "rapeseed")
        XCTAssertNotNil(move)
        XCTAssertEqual(move?.file, harvest?.file)
    }

    func testAnEntryWithNoPictureAsksForNone() {
        // Five jobs have no usable photograph (see WITHOUT in the generator, and issue 412). The
        // layouts draw the icon instead, so nil is the expected answer and not a failure.
        for key in ["candy-feeding", "winter-feeding", "foulbrood-sample", "winter-prep", "oxalic-acid"] {
            XCTAssertNil(YearPhotos.of(key), "\(key) unexpectedly has a picture")
        }
    }

    func testAnUnknownHoneyFallsBackToTheJobsOwnPicture() {
        XCTAssertEqual(YearPhotos.of("winter-rest", honey: "some-new-plant")?.file, YearPhotos.byKey["winter-rest"]?.file)
    }

    func testEveryPictureCarriesAnAuthorAndALicence() {
        for (key, photo) in YearPhotos.byKey {
            XCTAssertFalse(photo.author.isEmpty, "\(key) has no author")
            XCTAssertFalse(photo.licence.isEmpty, "\(key) has no licence")
            XCTAssertTrue(photo.source.hasPrefix("https://commons.wikimedia.org/"), "\(key) has no source page")
        }
    }

    func testALicenceThatHasADeedLinksToIt() {
        // Public domain has no deed to link to -- there is no licence, which is the point -- and
        // Commons sends an empty licence URL for those.
        for (key, photo) in YearPhotos.byKey {
            if photo.licence.lowercased().hasPrefix("public domain") {
                XCTAssertEqual(photo.licenceUrl, "", "\(key) is public domain and needs no deed")
            } else {
                XCTAssertTrue(photo.licenceUrl.hasPrefix("http"), "\(key) has no licence link")
            }
        }
    }
}
