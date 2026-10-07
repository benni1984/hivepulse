import XCTest
@testable import HivePulse

private final class MockHomeService: HomeServiceProtocol {
    var result: Result<HomeSummary, Error> = .success(makeHome())
    private(set) var calls = 0

    func home() async throws -> HomeSummary {
        calls += 1
        return try result.get()
    }
}

private final class MockTreatmentService: TreatmentServiceProtocol {
    var open: [PlannedTreatmentOut] = []
    var done: [PlannedTreatmentOut] = []
    var listError: Error?
    var createError: Error?
    var actionError: Error?

    private(set) var filters: [TreatmentFilter] = []
    private(set) var created: [TreatmentCreateRequest] = []
    private(set) var doneIds: [String] = []
    private(set) var reopenedIds: [String] = []
    private(set) var deletedIds: [String] = []

    func list(_ filter: TreatmentFilter) async throws -> [PlannedTreatmentOut] {
        filters.append(filter)
        if let listError { throw listError }
        return filter.status == "done" ? done : open
    }

    func create(_ request: TreatmentCreateRequest) async throws -> PlannedTreatmentOut {
        if let createError { throw createError }
        created.append(request)
        return makeTreatment(id: "t-new", product: request.product)
    }

    func markDone(_ id: String) async throws -> PlannedTreatmentOut {
        if let actionError { throw actionError }
        doneIds.append(id)
        return makeTreatment(id: id)
    }

    func reopen(_ id: String) async throws -> PlannedTreatmentOut {
        if let actionError { throw actionError }
        reopenedIds.append(id)
        return makeTreatment(id: id)
    }

    func delete(_ id: String) async throws {
        if let actionError { throw actionError }
        deletedIds.append(id)
    }
}

private func makeTreatment(id: String = "t-1", product: String = "Formic acid", overdue: Bool = false) -> PlannedTreatmentOut {
    PlannedTreatmentOut(id: id, target: TreatmentTarget(type: "hive", id: "h-1", name: "Hive 1"), apiaryName: "Garden",
                        product: product, dueOn: "2026-08-20", note: nil, doneOn: nil, overdue: overdue,
                        createdByName: "Alice", createdAt: Date())
}

private func makeHome(hives: Int = 2, upcoming: [PlannedTreatmentOut] = []) -> HomeSummary {
    HomeSummary(
        today: "2026-10-07", inSeason: true, apiaryCount: 1, hiveCount: hives,
        inspections: HomeInspections(intervalDays: 7, overdueCount: 0, dueSoonCount: 0, next: []),
        health: HomeHealth(ok: hives, watch: 0, alert: 0, unknown: 0, attention: []),
        treatments: HomeTreatments(openCount: upcoming.count, overdueCount: 0, upcoming: upcoming),
        ad: nil
    )
}

// MARK: - The summary

@MainActor
final class HomeSummaryViewModelTests: XCTestCase {

    private var homes: MockHomeService!
    private var treatments: MockTreatmentService!

    override func setUp() {
        super.setUp()
        homes = MockHomeService()
        treatments = MockTreatmentService()
    }

    private func makeViewModel() -> HomeSummaryViewModel {
        HomeSummaryViewModel(homeService: homes, treatmentService: treatments)
    }

    func test_itIsNotShownBeforeItLoadsOrForSomebodyWithNoHives() async {
        let vm = makeViewModel()
        XCTAssertFalse(vm.isVisible)

        homes.result = .success(makeHome(hives: 0))
        await vm.load()

        XCTAssertFalse(vm.isVisible)
    }

    func test_itIsShownOnceThereAreHives() async {
        let vm = makeViewModel()

        await vm.load()

        XCTAssertTrue(vm.isVisible)
        XCTAssertEqual(vm.home?.hiveCount, 2)
    }

    func test_aFailedLoadShowsNothingAndNoError() async {
        homes.result = .failure(APIError.server("down"))
        let vm = makeViewModel()

        await vm.load()

        XCTAssertFalse(vm.isVisible)
        XCTAssertNil(vm.errorMessage)
    }

    func test_aFailedReloadKeepsWhatWasThere() async {
        let vm = makeViewModel()
        await vm.load()
        homes.result = .failure(APIError.server("down"))

        await vm.load()

        XCTAssertTrue(vm.isVisible)
    }

    func test_markingATreatmentDoneAsksTheServerAndReloads() async {
        let vm = makeViewModel()
        await vm.load()

        await vm.markDone(makeTreatment(id: "t-9"))

        XCTAssertEqual(treatments.doneIds, ["t-9"])
        XCTAssertEqual(homes.calls, 2)
    }

    func test_aRefusedDoneShowsTheReasonAndDoesNotReload() async {
        treatments.actionError = APIError.notFound("This treatment does not exist.")
        let vm = makeViewModel()
        await vm.load()

        await vm.markDone(makeTreatment())

        XCTAssertEqual(vm.errorMessage, "This treatment does not exist.")
        XCTAssertEqual(homes.calls, 1)
    }

    func test_aReasonThisAppDoesNotKnowIsShownAsTheServerSentIt() {
        XCTAssertEqual(HomeSummaryViewModel.reasonText("something_new"), "something_new")
    }
}

// MARK: - The treatments of one hive or apiary

@MainActor
final class TreatmentsViewModelTests: XCTestCase {

    private var service: MockTreatmentService!

    override func setUp() {
        super.setUp()
        service = MockTreatmentService()
    }

    func test_itAsksForTheOpenAndTheDoneOnesOfItsHive() async {
        let vm = TreatmentsViewModel(target: .hive("h-1"), service: service)

        await vm.load()

        XCTAssertEqual(Set(service.filters.map(\.status)), ["open", "done"])
        XCTAssertTrue(service.filters.allSatisfy { $0.hiveId == "h-1" && $0.apiaryId == nil })
    }

    func test_itAsksForTheOnesOfItsApiary() async {
        let vm = TreatmentsViewModel(target: .apiary("a-1"), service: service)

        await vm.load()

        XCTAssertTrue(service.filters.allSatisfy { $0.apiaryId == "a-1" && $0.hiveId == nil })
    }

    func test_onlyTheLastFiveDoneOnesAreKept() async {
        service.done = (1...8).map { makeTreatment(id: "d-\($0)") }
        let vm = TreatmentsViewModel(target: .hive("h-1"), service: service)

        await vm.load()

        XCTAssertEqual(vm.done.count, 5)
    }

    func test_aFailedLoadSetsTheMessage() async {
        service.listError = APIError.server("down")
        let vm = TreatmentsViewModel(target: .hive("h-1"), service: service)

        await vm.load()

        XCTAssertEqual(vm.errorMessage, "down")
        XCTAssertFalse(vm.isLoading)
    }

    func test_nothingCanBePlannedWithoutAProduct() {
        let vm = TreatmentsViewModel(target: .hive("h-1"), service: service)
        XCTAssertFalse(vm.canPlan)

        vm.product = "   "
        XCTAssertFalse(vm.canPlan)

        vm.product = "Thymol"
        XCTAssertTrue(vm.canPlan)
    }

    func test_theRequestForAHiveCarriesTheTrimmedDetails() {
        let vm = TreatmentsViewModel(target: .hive("h-1"), service: service)
        vm.product = "  Oxalic acid "
        vm.note = "  dusk  "
        var components = DateComponents()
        components.year = 2026; components.month = 12; components.day = 10
        vm.dueOn = Calendar.current.date(from: components)!

        let request = vm.request()

        XCTAssertEqual(request.hiveId, "h-1")
        XCTAssertNil(request.apiaryId)
        XCTAssertEqual(request.product, "Oxalic acid")
        XCTAssertEqual(request.dueOn, "2026-12-10")
        XCTAssertEqual(request.note, "dusk")
    }

    func test_theRequestForAnApiaryHasNoHiveAndNoEmptyNote() {
        let vm = TreatmentsViewModel(target: .apiary("a-1"), service: service)
        vm.product = "Thymol"
        vm.note = "   "

        let request = vm.request()

        XCTAssertEqual(request.apiaryId, "a-1")
        XCTAssertNil(request.hiveId)
        XCTAssertNil(request.note)
    }

    func test_planningSendsItReloadsAndEmptiesTheForm() async {
        let vm = TreatmentsViewModel(target: .hive("h-1"), service: service)
        vm.product = "Thymol"
        vm.note = "evening"

        let planned = await vm.plan()

        XCTAssertTrue(planned)
        XCTAssertEqual(service.created.count, 1)
        XCTAssertEqual(vm.product, "")
        XCTAssertEqual(vm.note, "")
        XCTAssertFalse(service.filters.isEmpty, "the list was reloaded")
        XCTAssertFalse(vm.isSaving)
    }

    func test_aRefusedPlanShowsTheReasonAndKeepsTheForm() async {
        service.createError = APIError.conflict("Only the owner can do this.")
        let vm = TreatmentsViewModel(target: .apiary("a-1"), service: service)
        vm.product = "Thymol"

        let planned = await vm.plan()

        XCTAssertFalse(planned)
        XCTAssertEqual(vm.errorMessage, "Only the owner can do this.")
        XCTAssertEqual(vm.product, "Thymol")
    }

    func test_doneReopenAndDeleteAskTheServerAndReload() async {
        let vm = TreatmentsViewModel(target: .hive("h-1"), service: service)
        let item = makeTreatment(id: "t-5")

        await vm.markDone(item)
        await vm.reopen(item)
        await vm.delete(item)

        XCTAssertEqual(service.doneIds, ["t-5"])
        XCTAssertEqual(service.reopenedIds, ["t-5"])
        XCTAssertEqual(service.deletedIds, ["t-5"])
        XCTAssertEqual(service.filters.count, 6, "three reloads of two lists")
    }

    func test_aRefusedActionShowsTheReason() async {
        service.actionError = APIError.notFound("This treatment does not exist.")
        let vm = TreatmentsViewModel(target: .hive("h-1"), service: service)

        await vm.delete(makeTreatment())

        XCTAssertEqual(vm.errorMessage, "This treatment does not exist.")
    }
}

// MARK: - Days

final class DayFormatTests: XCTestCase {

    func test_nothingGivesNothingAndGarbageComesBackAsItWas() {
        XCTAssertEqual(DayFormat.string(from: nil), "")
        XCTAssertEqual(DayFormat.string(from: ""), "")
        XCTAssertEqual(DayFormat.string(from: "soon"), "soon")
    }

    func test_aDayIsParsedAsThatDayAtNoonOnThePhone() throws {
        let date = try XCTUnwrap(DayFormat.date(from: "2026-05-12"))
        let parts = Calendar.current.dateComponents([.year, .month, .day, .hour], from: date)

        XCTAssertEqual(parts.year, 2026)
        XCTAssertEqual(parts.month, 5)
        XCTAssertEqual(parts.day, 12)
        XCTAssertEqual(parts.hour, 12)
    }

    func test_aTimeThatComesWithTheDayIsIgnored() throws {
        let date = try XCTUnwrap(DayFormat.date(from: "2026-05-12T23:30:00.123456"))

        XCTAssertEqual(Calendar.current.component(.day, from: date), 12)
    }

    func test_aDayPickedOnThePhoneIsWrittenInTheServersFormat() {
        var components = DateComponents()
        components.year = 2026; components.month = 5; components.day = 7; components.hour = 23; components.minute = 30
        let evening = Calendar.current.date(from: components)!

        XCTAssertEqual(DayFormat.wireString(from: evening), "2026-05-07")
    }
}

// MARK: - What the server sends

final class HomeDTOTests: XCTestCase {

    func test_theWholeSummaryIsReadAsTheServerSendsIt() throws {
        let json = #"""
        {"today":"2026-10-07","in_season":true,"apiary_count":2,"hive_count":5,
         "inspections":{"interval_days":7,"overdue_count":1,"due_soon_count":2,"next":[
           {"hive_id":"h-1","hive_name":"Hive 1","apiary_name":"Garden","last_inspection_on":null,"due_on":"2026-10-05","overdue_days":2}]},
         "health":{"ok":3,"watch":1,"alert":1,"unknown":0,"attention":[
           {"hive_id":"h-2","hive_name":"Hive 2","apiary_name":"Garden","status":"alert","reasons":["varroa_high","swarm_cells"]}]},
         "treatments":{"open_count":1,"overdue_count":0,"upcoming":[
           {"id":"t-1","target":{"type":"hive","id":"h-1","name":"Hive 1"},"apiary_name":"Garden","product":"Formic acid",
            "due_on":"2026-10-20","note":null,"done_on":null,"overdue":false,"created_by_name":"Alice","created_at":"2026-10-01T08:00:00.123456"}]},
         "ad":{"id":"fair","label":"Ad","title":"Honey fair","body":"Saturday in town.","url":null}}
        """#
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .hivePulseBackend

        let home = try decoder.decode(HomeSummary.self, from: Data(json.utf8))

        XCTAssertEqual(home.hiveCount, 5)
        XCTAssertTrue(home.inSeason)
        XCTAssertEqual(home.inspections.overdueCount, 1)
        XCTAssertNil(home.inspections.next[0].lastInspectionOn)
        XCTAssertEqual(home.inspections.next[0].overdueDays, 2)
        XCTAssertEqual(home.health.attention[0].reasons, ["varroa_high", "swarm_cells"])
        XCTAssertEqual(home.treatments.upcoming[0].product, "Formic acid")
        XCTAssertEqual(home.treatments.upcoming[0].target.name, "Hive 1")
        XCTAssertEqual(home.ad?.title, "Honey fair")
        XCTAssertNil(home.ad?.url)
    }

    func test_aSummaryWithoutAnAnnouncementHasNone() throws {
        let json = #"{"today":"2026-10-07","in_season":false,"apiary_count":0,"hive_count":0,"inspections":{"interval_days":7,"overdue_count":0,"due_soon_count":0,"next":[]},"health":{"ok":0,"watch":0,"alert":0,"unknown":0,"attention":[]},"treatments":{"open_count":0,"overdue_count":0,"upcoming":[]},"ad":null}"#
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .hivePulseBackend

        let home = try decoder.decode(HomeSummary.self, from: Data(json.utf8))

        XCTAssertNil(home.ad)
        XCTAssertFalse(home.inSeason)
    }

    func test_theTreatmentRequestUsesTheServersNames() throws {
        let request = TreatmentCreateRequest(hiveId: "h-1", apiaryId: nil, product: "Thymol", dueOn: "2026-08-20", note: nil)

        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: JSONEncoder().encode(request)) as? [String: Any])

        XCTAssertEqual(json["hive_id"] as? String, "h-1")
        XCTAssertEqual(json["due_on"] as? String, "2026-08-20")
        XCTAssertNil(json["apiary_id"])
        XCTAssertNil(json["note"])
    }
}
