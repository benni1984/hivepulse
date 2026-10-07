import XCTest
@testable import HivePulse

private func entry(_ key: String, _ start: String, _ end: String? = nil, category: String = "care",
                   interval: Int? = nil, honey: String? = nil, active: Bool = false) -> CalendarEntryOut {
    CalendarEntryOut(key: key, category: category, title: "Title " + key, body: "Body " + key,
                     start: start, end: end ?? start, intervalDays: interval, honey: honey, active: active)
}

private func makeRegion(_ source: String = "default", country: String? = nil, postal: String? = nil,
                    shift: Int = 0, located: Bool = true, adjust: Int = 0) -> RegionOut {
    RegionOut(country: country, postalCode: postal, latitude: nil, longitude: nil,
              adjustDays: adjust, shiftDays: shift, source: source, located: located)
}

private func makeWindow(_ entries: [CalendarEntryOut], start: String = "2026-09-01", end: String = "2027-01-29",
                    today: String = "2026-10-07", region: RegionOut? = nil) -> CalendarOut {
    CalendarOut(region: region ?? makeRegion(), today: today, start: start, end: end, entries: entries)
}

private final class MockCalendarService: CalendarServiceProtocol {
    var windows: [Result<CalendarOut, Error>] = []
    var regionResult: Result<RegionOut, Error> = .success(makeRegion())
    var updateResult: Result<RegionOut, Error> = .success(makeRegion())
    private(set) var requests: [(from: String, days: Int, language: String)] = []
    private(set) var updates: [RegionUpdateRequest] = []

    func region() async throws -> RegionOut { try regionResult.get() }

    func updateRegion(_ request: RegionUpdateRequest) async throws -> RegionOut {
        updates.append(request)
        return try updateResult.get()
    }

    func calendar(from: String, days: Int, language: String) async throws -> CalendarOut {
        requests.append((from, days, language))
        guard !windows.isEmpty else { throw URLError(.notConnectedToInternet) }
        return try windows.removeFirst().get()
    }
}

// MARK: - The arithmetic

final class BeekeepingYearArithmeticTests: XCTestCase {

    func test_addDaysCrossesMonthAndYearEnds() {
        XCTAssertEqual(BeekeepingYear.addDays("2026-01-31", 1), "2026-02-01")
        XCTAssertEqual(BeekeepingYear.addDays("2026-12-31", 1), "2027-01-01")
        XCTAssertEqual(BeekeepingYear.addDays("2026-03-01", -1), "2026-02-28")
        XCTAssertEqual(BeekeepingYear.addDays("2026-10-25", 1), "2026-10-26")
        XCTAssertEqual(BeekeepingYear.addDays("2026-09-01", -120), "2026-05-04")
    }

    func test_firstOfMonthOfThisAndAnEarlierMonth() {
        XCTAssertEqual(BeekeepingYear.firstOfMonth("2026-05-20"), "2026-05-01")
        XCTAssertEqual(BeekeepingYear.firstOfMonth("2026-05-20", monthsAgo: 1), "2026-04-01")
        XCTAssertEqual(BeekeepingYear.firstOfMonth("2026-01-20", monthsAgo: 1), "2025-12-01")
    }

    func test_mergeKeepsEachRunOnceOldestFirst() {
        let a = entry("a", "2026-05-01")
        let merged = BeekeepingYear.merge([a, entry("b", "2026-03-01")], [a, entry("c", "2026-05-01")])

        XCTAssertEqual(merged.map(\.key), ["b", "a", "c"])
    }

    func test_theSameTaskOfTheNextYearIsASecondEntry() {
        let merged = BeekeepingYear.merge([entry("x", "2026-04-20")], [entry("x", "2027-04-20")])

        XCTAssertEqual(merged.map(\.start), ["2026-04-20", "2027-04-20"])
    }

    private func months(_ items: [TimelineItem]) -> [String] {
        items.compactMap { if case .month(let m) = $0.kind { return m } else { return nil } }
    }

    private func order(_ items: [TimelineItem]) -> [String] {
        items.compactMap {
            switch $0.kind {
            case .month: return nil
            case .today: return "today"
            case .entry(let e): return e.key
            }
        }
    }

    func test_aMonthHeaderComesBeforeTheEntriesThatStartInIt() {
        let items = BeekeepingYear.timeline([entry("a", "2026-02-10"), entry("b", "2026-02-20"), entry("c", "2026-03-05")],
                                            today: "2026-01-01")

        XCTAssertEqual(months(items), ["2026-01", "2026-02", "2026-03"])
    }

    func test_todayLiesBetweenWhatStartedBeforeAndWhatStartsAfter() {
        let items = BeekeepingYear.timeline([entry("before", "2026-05-01"), entry("after", "2026-05-30")], today: "2026-05-15")

        XCTAssertEqual(order(items), ["before", "today", "after"])
    }

    func test_todayGetsItsMonthWhenNoEntryStartsInIt() {
        let items = BeekeepingYear.timeline([entry("april", "2026-04-10"), entry("july", "2026-07-10")], today: "2026-05-20")

        XCTAssertEqual(months(items), ["2026-04", "2026-05", "2026-07"])
    }

    func test_todayIsAtTheEndWhenEverythingStartedBeforeIt() {
        let items = BeekeepingYear.timeline([entry("a", "2026-05-01")], today: "2026-05-20")

        XCTAssertEqual(items.last?.kind, .today)
    }

    func test_todayIsShownOnce() {
        let items = BeekeepingYear.timeline([entry("a", "2026-05-01"), entry("b", "2026-06-01"), entry("c", "2026-07-01")],
                                            today: "2026-06-10")

        XCTAssertEqual(order(items).filter { $0 == "today" }.count, 1)
    }

    func test_noEntriesNoRows() {
        XCTAssertTrue(BeekeepingYear.timeline([], today: "2026-05-20").isEmpty)
    }

    func test_theCountriesAreUniqueCodesAndNamedInTheLanguageOfTheApp() {
        XCTAssertEqual(Set(BeekeepingYear.countryCodes).count, BeekeepingYear.countryCodes.count)
        XCTAssertTrue(BeekeepingYear.countryCodes.allSatisfy { $0.count == 2 })
        for code in ["DE", "AT", "CH", "FR", "ES", "GB", "IT", "BE", "LU"] {
            XCTAssertTrue(BeekeepingYear.countryCodes.contains(code), code)
        }
        XCTAssertEqual(BeekeepingYear.countryName("DE", language: "de"), "Deutschland")
        XCTAssertEqual(BeekeepingYear.countryName("DE", language: "en"), "Germany")
    }
}

// MARK: - What the server sends

final class BeekeepingYearDecodingTests: XCTestCase {

    func test_aWindowIsRead() throws {
        let json = """
        {"region":{"country":"DE","postal_code":"20095","latitude":53.55,"longitude":9.99,"adjust_days":2,"shift_days":15,
                   "source":"postal_code","located":true},
         "today":"2026-10-07","start":"2026-09-01","end":"2027-01-29",
         "entries":[{"key":"swarm-control","category":"swarm","title":"T","body":"B","start":"2027-04-20","end":"2027-06-30",
                     "interval_days":9,"honey":null,"active":false},
                    {"key":"harvest-rapeseed","category":"harvest","title":"T","body":"B","start":"2027-05-15","end":"2027-06-05",
                     "interval_days":null,"honey":"rapeseed","active":true}]}
        """
        let window = try JSONDecoder().decode(CalendarOut.self, from: Data(json.utf8))

        XCTAssertEqual(window.region.shiftDays, 15)
        XCTAssertEqual(window.region.postalCode, "20095")
        XCTAssertEqual(window.entries[0].intervalDays, 9)
        XCTAssertNil(window.entries[0].honey)
        XCTAssertEqual(window.entries[1].honey, "rapeseed")
        XCTAssertTrue(window.entries[1].active)
        XCTAssertEqual(window.entries[0].id, "swarm-control|2027-04-20")
    }

    func test_theRegionUpdateIsEncodedTheWayTheServerReadsIt() throws {
        let body = RegionUpdateRequest(country: "AT", postalCode: "1010", adjustDays: -3)
        let json = try XCTUnwrap(String(data: JSONEncoder().encode(body), encoding: .utf8))

        XCTAssertTrue(json.contains("\"postal_code\":\"1010\""))
        XCTAssertTrue(json.contains("\"adjust_days\":-3"))
        XCTAssertFalse(json.contains("postalCode"))
    }
}

// MARK: - The timeline

@MainActor
final class BeekeepingYearViewModelTests: XCTestCase {

    private func makeViewModel(_ service: MockCalendarService, language: String = "de") -> BeekeepingYearViewModel {
        let now = DayFormat.date(from: "2026-10-07")!
        return BeekeepingYearViewModel(service: service, language: language, now: now)
    }

    func test_theFirstStretchStartsInTheMonthBeforeThisOneInTheLanguageOfTheApp() async {
        let service = MockCalendarService()
        service.windows = [.success(makeWindow([entry("a", "2026-10-01")]))]
        let vm = makeViewModel(service)

        await vm.load()

        XCTAssertEqual(service.requests.first?.from, "2026-09-01")
        XCTAssertEqual(service.requests.first?.days, 151)
        XCTAssertEqual(service.requests.first?.language, "de")
        XCTAssertTrue(vm.isLoaded)
        XCTAssertEqual(vm.entries.count, 1)
    }

    func test_todayIsTheServersDayNotThePhones() async {
        let service = MockCalendarService()
        service.windows = [.success(makeWindow([], today: "2026-10-08"))]
        let vm = makeViewModel(service)

        await vm.load()

        XCTAssertEqual(vm.today, "2026-10-08")
    }

    func test_aFailedFirstLoadSaysSoAndLoadsNothingElse() async {
        let service = MockCalendarService()
        let vm = makeViewModel(service)

        await vm.load()
        await vm.loadLater()

        XCTAssertTrue(vm.failed)
        XCTAssertFalse(vm.isLoaded)
        XCTAssertEqual(service.requests.count, 1)
    }

    func test_theNextStretchFollowsTheEndOfTheLastAndIsMergedWithoutRepeats() async {
        let service = MockCalendarService()
        let a = entry("a", "2026-10-01")
        service.windows = [
            .success(makeWindow([a], start: "2026-09-01", end: "2027-01-29")),
            .success(makeWindow([a, entry("b", "2027-02-05")], start: "2027-01-30", end: "2027-05-29")),
        ]
        let vm = makeViewModel(service)
        await vm.load()

        await vm.loadLater()

        XCTAssertEqual(service.requests[1].from, "2027-01-30")
        XCTAssertEqual(service.requests[1].days, 120)
        XCTAssertEqual(vm.entries.map(\.key), ["a", "b"])
    }

    func test_thePreviousStretchEndsWhereTheFirstBegins() async {
        let service = MockCalendarService()
        service.windows = [
            .success(makeWindow([entry("b", "2026-10-01")], start: "2026-09-01", end: "2027-01-29")),
            .success(makeWindow([entry("a", "2026-06-10")], start: "2026-05-04", end: "2026-09-01")),
        ]
        let vm = makeViewModel(service)
        await vm.load()

        await vm.loadEarlier()

        XCTAssertEqual(service.requests[1].from, "2026-05-04")
        XCTAssertEqual(vm.entries.map(\.key), ["a", "b"])
    }

    func test_aStretchIsNotAskedForBeforeTheFirstHasLoaded() async {
        let service = MockCalendarService()
        let vm = makeViewModel(service)

        await vm.loadEarlier()
        await vm.loadLater()

        XCTAssertTrue(service.requests.isEmpty)
    }

    func test_theRowsAreTheTimelineOfWhatIsLoaded() async {
        let service = MockCalendarService()
        service.windows = [.success(makeWindow([entry("a", "2026-10-01"), entry("b", "2026-11-01")]))]
        let vm = makeViewModel(service)
        await vm.load()

        XCTAssertTrue(vm.items.contains { $0.kind == .today })
        XCTAssertEqual(vm.items.filter { if case .entry = $0.kind { return true } else { return false } }.count, 2)
    }
}

// MARK: - The region

@MainActor
final class RegionViewModelTests: XCTestCase {

    func test_theFormShowsWhatIsStored() async {
        let service = MockCalendarService()
        service.regionResult = .success(makeRegion("postal_code", country: "DE", postal: "20095", shift: 15, adjust: 3))
        let vm = RegionViewModel(service: service)

        await vm.load()

        XCTAssertEqual(vm.country, "DE")
        XCTAssertEqual(vm.postalCode, "20095")
        XCTAssertEqual(vm.adjustDays, 3)
        XCTAssertTrue(vm.isLoaded)
    }

    func test_aRegionThatCannotBeReadHidesTheForm() async {
        let service = MockCalendarService()
        service.regionResult = .failure(URLError(.notConnectedToInternet))
        let vm = RegionViewModel(service: service)

        await vm.load()

        XCTAssertFalse(vm.isLoaded)
    }

    func test_savingSendsTheTrimmedPostalCodeAndTheAdjustmentWithinTheLimits() async {
        let service = MockCalendarService()
        service.updateResult = .success(makeRegion("postal_code", country: "AT", postal: "1010", shift: 2))
        let vm = RegionViewModel(service: service)
        vm.country = "AT"
        vm.postalCode = "  1010 "
        vm.adjustDays = 99

        let saved = await vm.save()

        XCTAssertNotNil(saved)
        XCTAssertEqual(service.updates.first?.country, "AT")
        XCTAssertEqual(service.updates.first?.postalCode, "1010")
        XCTAssertEqual(service.updates.first?.adjustDays, 28)
        XCTAssertEqual(vm.message, .saved)
    }

    func test_aPostalCodeThatWasNotFoundIsSaidSo() async {
        let service = MockCalendarService()
        service.updateResult = .success(makeRegion("default", country: "DE", postal: "00000", located: false))
        let vm = RegionViewModel(service: service)

        await vm.save()

        XCTAssertEqual(vm.message, .notLocated)
    }

    func test_aRefusalIsSaidSoAndReturnsNothing() async {
        let service = MockCalendarService()
        service.updateResult = .failure(URLError(.badServerResponse))
        let vm = RegionViewModel(service: service)

        let saved = await vm.save()

        XCTAssertNil(saved)
        XCTAssertEqual(vm.message, .failed)
        XCTAssertFalse(vm.isSaving)
    }

    func test_theAdjustmentIsClamped() {
        XCTAssertEqual(RegionViewModel.clamp(99), 28)
        XCTAssertEqual(RegionViewModel.clamp(-99), -28)
        XCTAssertEqual(RegionViewModel.clamp(5), 5)
    }
}

// MARK: - The line about the region

final class BeekeepingYearRegionLineTests: XCTestCase {

    func test_noRegionAsksForOne() {
        XCTAssertEqual(BeekeepingYear.regionLine(makeRegion()), NSLocalizedString("calendar.regionNone", comment: ""))
    }

    func test_aPostalCodeNamesThePlaceAndTheShift() {
        let line = BeekeepingYear.regionLine(makeRegion("postal_code", country: "DE", postal: "20095", shift: 15))

        XCTAssertTrue(line.contains("20095"))
        XCTAssertTrue(line.contains("15"))
    }

    func test_theSouthSaysEarlierWithoutTheSign() {
        let line = BeekeepingYear.regionLine(makeRegion("postal_code", country: "DE", postal: "80331", shift: -6))

        XCTAssertTrue(line.contains("6"))
        XCTAssertFalse(line.contains("-6"))
    }

    func test_noShiftSaysTheSameDates() {
        let line = BeekeepingYear.regionLine(makeRegion("postal_code", country: "DE", postal: "60311", shift: 0))

        XCTAssertTrue(line.contains("60311"))
    }

    func test_anApiaryIsNamedWhenThePositionComesFromThere() {
        let line = BeekeepingYear.regionLine(makeRegion("apiary", shift: 4))

        XCTAssertTrue(line.contains(NSLocalizedString("calendar.regionFromApiary", comment: "")))
    }

    func test_aMonthIsNamedInTheLanguageOfTheApp() {
        XCTAssertFalse(BeekeepingYear.monthName("2026-05").isEmpty)
        XCTAssertTrue(BeekeepingYear.monthName("2026-05").contains("2026"))
    }
}
