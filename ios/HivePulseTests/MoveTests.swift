import XCTest
@testable import HivePulse

private final class MockMoveService: MoveServiceProtocol {
    var moveResult: Result<MoveResult, Error> = .success(MoveResult(moved: 1, apiary: makeApiary(id: "a-heath", name: "Heath"), moves: []))
    var movesResult: Result<[HiveMoveOut], Error> = .success([])
    var overviewResult: Result<[HiveMoveOut], Error> = .success([])

    private(set) var requests: [MoveCreateRequest] = []
    private(set) var hiveIds: [String] = []
    private(set) var ranges: [(String?, String?)] = []

    func move(_ request: MoveCreateRequest) async throws -> MoveResult {
        requests.append(request)
        return try moveResult.get()
    }

    func moves(forHive hiveId: String) async throws -> [HiveMoveOut] {
        hiveIds.append(hiveId)
        return try movesResult.get()
    }

    func overview(from: String?, to: String?) async throws -> [HiveMoveOut] {
        ranges.append((from, to))
        return try overviewResult.get()
    }
}

private func place(_ name: String, _ lat: Double?, _ lon: Double?) -> MovePlace {
    MovePlace(apiaryId: nil, name: name, latitude: lat, longitude: lon)
}

private func makeMove(id: String, hive: String = "1", movedOn: String = "2026-05-12",
                      createdAt: Date = Date(timeIntervalSince1970: 1_000),
                      forage: String? = nil, from: MovePlace? = nil, to: MovePlace? = nil) -> HiveMoveOut {
    HiveMoveOut(id: id, hiveId: "h-" + hive, hiveName: "Hive " + hive, movedOn: movedOn, forage: forage, note: nil,
                from: from ?? place("Home", 48.1, 8.0), to: to ?? place("Heath", 48.5, 9.0),
                createdByName: "Alice", createdAt: createdAt)
}

// MARK: - The journey on the map

final class MoveRoutesTests: XCTestCase {

    func test_aJourneyStartsWhereTheHiveCameFromAndVisitsEveryPlaceOldestFirst() {
        let routes = MoveRoutes.build(from: [
            makeMove(id: "m2", movedOn: "2026-06-14", forage: "fir",
                     from: place("Heath", 48.5, 9.0), to: place("Forest", 47.9, 8.1)),
            makeMove(id: "m1", movedOn: "2026-05-12", forage: "acacia"),
        ])

        XCTAssertEqual(routes.count, 1)
        XCTAssertEqual(routes[0].points.map(\.name), ["Home", "Heath", "Forest"])
        XCTAssertEqual(routes[0].points.map(\.order), [0, 1, 2])
        XCTAssertEqual(routes[0].points[1].date, "2026-05-12")
        XCTAssertEqual(routes[0].points[1].forage, "acacia")
        XCTAssertNil(routes[0].points[0].date)
    }

    func test_eachHiveGetsItsOwnRouteAndColour() {
        let routes = MoveRoutes.build(from: [makeMove(id: "a", hive: "1"), makeMove(id: "b", hive: "2")])

        XCTAssertEqual(routes.map(\.hiveName), ["Hive 1", "Hive 2"])
        XCTAssertNotEqual(routes[0].colorIndex, routes[1].colorIndex)
    }

    func test_twoMovesOfTheSameDayKeepTheOrderTheyWereMadeIn() {
        let routes = MoveRoutes.build(from: [
            makeMove(id: "late", createdAt: Date(timeIntervalSince1970: 2_000),
                     from: place("Heath", 48.5, 9.0), to: place("Lake", 47.9, 8.1)),
            makeMove(id: "early", createdAt: Date(timeIntervalSince1970: 1_000)),
        ])

        XCTAssertEqual(routes[0].points.map(\.name), ["Home", "Heath", "Lake"])
    }

    func test_aPlaceWithoutAPositionIsSkippedButStillCountsAsAStop() {
        let nowhere = place("Nowhere", nil, nil)
        let routes = MoveRoutes.build(from: [
            makeMove(id: "m1", to: nowhere),
            makeMove(id: "m2", movedOn: "2026-06-01", from: nowhere, to: place("Lake", 47.9, 8.1)),
        ])

        // "Stop 2" is still the second move, though stop 1 cannot be drawn.
        XCTAssertEqual(routes[0].points.map(\.name), ["Home", "Lake"])
        XCTAssertEqual(routes[0].points.map(\.order), [0, 2])
    }

    func test_noMovesGiveNoRoutes() {
        XCTAssertTrue(MoveRoutes.build(from: []).isEmpty)
        XCTAssertFalse(MoveRoutes.hasPositions([]))
    }

    func test_thereIsNothingToDrawWhenNoPlaceHasAPosition() {
        let nowhere = place("Nowhere", nil, nil)
        let routes = MoveRoutes.build(from: [makeMove(id: "m1", from: nowhere, to: nowhere)])

        XCTAssertFalse(MoveRoutes.hasPositions(routes))
        XCTAssertNil(MoveRoutes.region(fitting: routes))
    }

    func test_theMapRegionHoldsEveryPointWithRoomAround() throws {
        let routes = MoveRoutes.build(from: [makeMove(id: "m1")])   // Home 48.1/8.0 -> Heath 48.5/9.0

        let region = try XCTUnwrap(MoveRoutes.region(fitting: routes))

        XCTAssertEqual(region.center.latitude, 48.3, accuracy: 0.001)
        XCTAssertEqual(region.center.longitude, 8.5, accuracy: 0.001)
        XCTAssertGreaterThan(region.span.latitudeDelta, 0.4)
        XCTAssertGreaterThan(region.span.longitudeDelta, 1.0)
    }

    func test_aSinglePlaceStillGetsAUsableView() throws {
        let single = MoveRoutes.build(from: [makeMove(id: "m1", from: place("Home", nil, nil), to: place("Heath", 48.5, 9.0))])

        let region = try XCTUnwrap(MoveRoutes.region(fitting: single))

        XCTAssertGreaterThanOrEqual(region.span.latitudeDelta, 0.05)
    }
}

final class ForageTests: XCTestCase {

    func test_knownKeysAreRecognisedAndAnythingElseIsNot() {
        for key in Forage.keys { XCTAssertTrue(Forage.isKnown(key), key) }
        XCTAssertFalse(Forage.isKnown("Robinie"))
        XCTAssertFalse(Forage.isKnown(""))
        XCTAssertFalse(Forage.isKnown(nil))
    }

    func test_aForageTypedByHandIsShownAsWritten() {
        XCTAssertEqual(Forage.label(for: "Robinie"), "Robinie")
    }
}

// MARK: - The form

@MainActor
final class MoveHivesViewModelTests: XCTestCase {

    private var service: MockMoveService!
    private var apiaries: MockApiaryService!

    override func setUp() {
        super.setUp()
        service = MockMoveService()
        apiaries = MockApiaryService()
    }

    private func makeViewModel() -> MoveHivesViewModel {
        MoveHivesViewModel(apiaryId: "a-home", hives: [makeHive(id: "h-1", name: "Hive 1"), makeHive(id: "h-2", name: "Hive 2")],
                           moveService: service, apiaryService: apiaries)
    }

    private func owned(_ id: String, _ name: String, access: String? = "owner") -> ApiaryOut {
        ApiaryOut(id: id, name: name, description: nil, latitude: nil, longitude: nil, address: nil,
                  hiveCount: 0, createdAt: Date(), access: access)
    }

    func test_theTargetsAreOnlyTheCallersOtherApiaries() async {
        apiaries.listResult = .success(makePage([owned("a-home", "Home"), owned("a-heath", "Heath"), owned("a-theirs", "Theirs", access: "shared")]))
        let vm = makeViewModel()

        await vm.loadTargets()

        XCTAssertEqual(vm.targets.map(\.id), ["a-heath"])
    }

    func test_nothingCanBeSentBeforeHivesAndATargetAreChosen() {
        let vm = makeViewModel()
        XCTAssertFalse(vm.canSubmit)

        vm.toggle("h-1")
        XCTAssertFalse(vm.canSubmit, "still no target")

        vm.target = "a-heath"
        XCTAssertTrue(vm.canSubmit)
    }

    func test_aNewPlaceNeedsAName() {
        let vm = makeViewModel()
        vm.toggle("h-1")
        vm.target = MoveHivesViewModel.newPlace
        XCTAssertFalse(vm.canSubmit)

        vm.newName = "   "
        XCTAssertFalse(vm.canSubmit)

        vm.newName = "Black Forest"
        XCTAssertTrue(vm.canSubmit)
    }

    func test_selectAllSelectsEveryHiveAndAgainNone() {
        let vm = makeViewModel()

        vm.toggleAll()
        XCTAssertTrue(vm.allSelected)
        XCTAssertEqual(vm.selected, ["h-1", "h-2"])

        vm.toggleAll()
        XCTAssertTrue(vm.selected.isEmpty)
    }

    func test_theRequestForAnExistingApiaryCarriesTheDetails() {
        let vm = makeViewModel()
        vm.toggle("h-2")
        vm.target = "a-heath"
        vm.forage = "acacia"
        vm.note = "  early bloom  "

        let request = vm.request()

        XCTAssertEqual(request.hiveIds, ["h-2"])
        XCTAssertEqual(request.toApiaryId, "a-heath")
        XCTAssertNil(request.newApiary)
        XCTAssertEqual(request.forage, "acacia")
        XCTAssertEqual(request.note, "early bloom")
        XCTAssertEqual(request.movedOn, MoveHivesViewModel.dayString(vm.movedOn))
    }

    func test_theRequestForANewPlaceHasNoTargetId() {
        let vm = makeViewModel()
        vm.toggle("h-1")
        vm.target = MoveHivesViewModel.newPlace
        vm.newName = " Black Forest "
        vm.newAddress = " Titisee "

        let request = vm.request()

        XCTAssertNil(request.toApiaryId)
        XCTAssertEqual(request.newApiary?.name, "Black Forest")
        XCTAssertEqual(request.newApiary?.address, "Titisee")
    }

    func test_anAddressLeftEmptyIsNotSent() {
        let vm = makeViewModel()
        vm.toggle("h-1")
        vm.target = MoveHivesViewModel.newPlace
        vm.newName = "Lake"
        vm.newAddress = "  "

        XCTAssertNil(vm.request().newApiary?.address)
    }

    func test_aForageTypedByHandIsSentAsWrittenAndNoForageIsSentAsNothing() {
        let vm = makeViewModel()
        XCTAssertNil(vm.forageValue)

        vm.forage = MoveHivesViewModel.otherForage
        vm.otherForage = "  Robinie "
        XCTAssertEqual(vm.forageValue, "Robinie")

        vm.otherForage = "  "
        XCTAssertNil(vm.forageValue)
    }

    func test_theDayIsWrittenInTheServersFormat() {
        var components = DateComponents()
        components.year = 2026; components.month = 5; components.day = 7; components.hour = 23; components.minute = 30
        let evening = Calendar.current.date(from: components)!

        XCTAssertEqual(MoveHivesViewModel.dayString(evening), "2026-05-07")
    }

    func test_submitSendsTheMoveAndReturnsWhatTheServerAnswered() async {
        let vm = makeViewModel()
        vm.toggle("h-1")
        vm.target = "a-heath"

        let result = await vm.submit()

        XCTAssertEqual(result?.moved, 1)
        XCTAssertEqual(service.requests.count, 1)
        XCTAssertNil(vm.errorMessage)
        XCTAssertFalse(vm.isSubmitting)
    }

    func test_submitDoesNothingWhileTheFormIsIncomplete() async {
        let vm = makeViewModel()

        let result = await vm.submit()

        XCTAssertNil(result)
        XCTAssertTrue(service.requests.isEmpty)
    }

    func test_aRefusedMoveShowsTheServersReasonAndKeepsTheForm() async {
        service.moveResult = .failure(APIError.conflict("Only the owner can do this."))
        let vm = makeViewModel()
        vm.toggle("h-1")
        vm.target = "a-heath"

        let result = await vm.submit()

        XCTAssertNil(result)
        XCTAssertEqual(vm.errorMessage, "Only the owner can do this.")
        XCTAssertEqual(vm.selected, ["h-1"])
        XCTAssertFalse(vm.isSubmitting)
    }
}

// MARK: - The history and the overview

@MainActor
final class HiveMovesViewModelTests: XCTestCase {

    func test_loadFillsTheListAndTheRoutesForTheHiveItWasGiven() async {
        let service = MockMoveService()
        service.movesResult = .success([makeMove(id: "m1")])
        let vm = HiveMovesViewModel(hiveId: "h-1", service: service)

        await vm.load()

        XCTAssertEqual(service.hiveIds, ["h-1"])
        XCTAssertEqual(vm.moves.map(\.id), ["m1"])
        XCTAssertEqual(vm.routes.count, 1)
        XCTAssertTrue(vm.loaded)
        XCTAssertFalse(vm.isLoading)
    }

    func test_aFailedLoadReadsAsNoMovesNotAsAnError() async {
        let service = MockMoveService()
        service.movesResult = .failure(APIError.server("down"))
        let vm = HiveMovesViewModel(hiveId: "h-1", service: service)

        await vm.load()

        XCTAssertTrue(vm.moves.isEmpty)
        XCTAssertTrue(vm.routes.isEmpty)
        XCTAssertTrue(vm.loaded)
    }
}

@MainActor
final class MovesOverviewViewModelTests: XCTestCase {

    func test_loadAsksForEverythingWhenNoRangeWasChosen() async {
        let service = MockMoveService()
        service.overviewResult = .success([makeMove(id: "m1"), makeMove(id: "m2", hive: "2")])
        let vm = MovesOverviewViewModel(service: service)

        await vm.load()

        XCTAssertNil(service.ranges[0].0)
        XCTAssertNil(service.ranges[0].1)
        XCTAssertEqual(vm.routes.count, 2)
    }

    func test_theChosenDatesLimitTheRequest() async {
        let service = MockMoveService()
        let vm = MovesOverviewViewModel(service: service)
        var components = DateComponents()
        components.year = 2026; components.month = 6; components.day = 1
        vm.from = Calendar.current.date(from: components)
        components.day = 30
        vm.to = Calendar.current.date(from: components)

        await vm.load()

        XCTAssertEqual(service.ranges[0].0, "2026-06-01")
        XCTAssertEqual(service.ranges[0].1, "2026-06-30")
    }

    func test_aFailedLoadShowsTheMessage() async {
        let service = MockMoveService()
        service.overviewResult = .failure(APIError.server("down"))
        let vm = MovesOverviewViewModel(service: service)

        await vm.load()

        XCTAssertEqual(vm.errorMessage, "down")
        XCTAssertFalse(vm.isLoading)
    }
}

// MARK: - What goes over the wire

final class MoveDTOTests: XCTestCase {

    private func decoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .hivePulseBackend
        return decoder
    }

    func test_aMoveIsReadAsTheServerSendsIt() throws {
        let json = #"[{"id":"m","hive_id":"h","hive_name":"Hive 1","moved_on":"2026-06-14","forage":"fir","note":null,"from":{"apiary_id":"a","name":"Heath","latitude":48.5,"longitude":9.0},"to":{"apiary_id":null,"name":"Forest","latitude":null,"longitude":null},"created_by_name":"Alice","created_at":"2026-06-14T08:00:00.123456"}]"#

        let moves = try decoder().decode([HiveMoveOut].self, from: Data(json.utf8))

        XCTAssertEqual(moves[0].movedOn, "2026-06-14")
        XCTAssertEqual(moves[0].from.name, "Heath")
        XCTAssertEqual(moves[0].from.latitude, 48.5)
        XCTAssertNil(moves[0].to.apiaryId)
        XCTAssertNil(moves[0].to.latitude)
        XCTAssertEqual(moves[0].forage, "fir")
    }

    func test_theRequestUsesTheServersNamesAndLeavesOutWhatWasNotChosen() throws {
        let request = MoveCreateRequest(hiveIds: ["h-1"], toApiaryId: "a-1", newApiary: nil,
                                        movedOn: "2026-05-12", forage: nil, note: nil)

        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: JSONEncoder().encode(request)) as? [String: Any])

        XCTAssertEqual(json["hive_ids"] as? [String], ["h-1"])
        XCTAssertEqual(json["to_apiary_id"] as? String, "a-1")
        XCTAssertEqual(json["moved_on"] as? String, "2026-05-12")
        XCTAssertNil(json["new_apiary"])
        XCTAssertNil(json["forage"])
    }
}

// MARK: - Back to where they came from

private func at(_ id: String, _ name: String) -> MovePlace {
    MovePlace(apiaryId: id, name: name, latitude: nil, longitude: nil)
}

final class ReturnSuggestionTests: XCTestCase {

    private let places: [(id: String, name: String)] = [("a-home", "Home"), ("a-forest", "Forest"), ("a-heath", "Heath")]

    /// A move into Heath, from Home unless said otherwise.
    private func intoHeath(_ id: String, hive: String, movedOn: String = "2026-05-12",
                           createdAt: Date = Date(timeIntervalSince1970: 1_000), from: MovePlace? = nil) -> HiveMoveOut {
        makeMove(id: id, hive: hive, movedOn: movedOn, createdAt: createdAt,
                 from: from ?? at("a-home", "Home"), to: at("a-heath", "Heath"))
    }

    func test_hivesGoBackToTheirPreviousPlaceGroupedByThatPlace() {
        let moves = [
            intoHeath("m1", hive: "1"),
            intoHeath("m2", hive: "2"),
            intoHeath("m3", hive: "3", from: at("a-forest", "Forest")),
        ]

        let result = MoveRoutes.returnSuggestions(moves: moves, hiveIds: ["h-1", "h-2", "h-3"], apiaryId: "a-heath", places: places)

        XCTAssertEqual(result, [
            ReturnSuggestion(apiaryId: "a-home", name: "Home", hiveIds: ["h-1", "h-2"]),
            ReturnSuggestion(apiaryId: "a-forest", name: "Forest", hiveIds: ["h-3"]),
        ])
    }

    func test_theLatestMoveThatBroughtTheHiveHereDecides() {
        let moves = [
            intoHeath("old", hive: "1", movedOn: "2026-04-01"),
            intoHeath("new", hive: "1", movedOn: "2026-06-01", from: at("a-forest", "Forest")),
        ]

        let result = MoveRoutes.returnSuggestions(moves: moves, hiveIds: ["h-1"], apiaryId: "a-heath", places: places)

        XCTAssertEqual(result.map(\.apiaryId), ["a-forest"])
    }

    func test_twoMovesOfOneDayAreToldApartByWhenTheyWereMade() {
        let moves = [
            intoHeath("late", hive: "1", createdAt: Date(timeIntervalSince1970: 2_000), from: at("a-forest", "Forest")),
            intoHeath("early", hive: "1", createdAt: Date(timeIntervalSince1970: 1_000)),
        ]

        let result = MoveRoutes.returnSuggestions(moves: moves, hiveIds: ["h-1"], apiaryId: "a-heath", places: places)

        XCTAssertEqual(result.map(\.apiaryId), ["a-forest"])
    }

    func test_hivesThatDidNotMoveHereOrAreNotHereAreLeftOut() {
        let moves = [intoHeath("m1", hive: "1"), intoHeath("m2", hive: "9")]

        let result = MoveRoutes.returnSuggestions(moves: moves, hiveIds: ["h-1", "h-2"], apiaryId: "a-heath", places: places)

        XCTAssertEqual(result, [ReturnSuggestion(apiaryId: "a-home", name: "Home", hiveIds: ["h-1"])])
    }

    func test_aPreviousPlaceThatIsGoneOrNotTheCallersOwnIsLeftOut() {
        let gone = intoHeath("m1", hive: "1", from: MovePlace(apiaryId: nil, name: "Old place", latitude: nil, longitude: nil))
        let foreign = intoHeath("m2", hive: "2", from: at("a-theirs", "Theirs"))

        XCTAssertTrue(MoveRoutes.returnSuggestions(moves: [gone, foreign], hiveIds: ["h-1", "h-2"],
                                                   apiaryId: "a-heath", places: places).isEmpty)
    }

    func test_noHistoryOffersNothing() {
        XCTAssertTrue(MoveRoutes.returnSuggestions(moves: [], hiveIds: ["h-1"], apiaryId: "a-heath", places: places).isEmpty)
    }
}

@MainActor
final class MoveHivesReturnTests: XCTestCase {

    private func makeViewModel(_ service: MockMoveService, _ apiaries: MockApiaryService) -> MoveHivesViewModel {
        MoveHivesViewModel(apiaryId: "a-heath", hives: [makeHive(id: "h-1", name: "Hive 1"), makeHive(id: "h-2", name: "Hive 2")],
                           moveService: service, apiaryService: apiaries)
    }

    private func owned(_ id: String, _ name: String) -> ApiaryOut {
        ApiaryOut(id: id, name: name, description: nil, latitude: nil, longitude: nil, address: nil,
                  hiveCount: 0, createdAt: Date(), access: "owner")
    }

    func test_theShortcutPicksTheHivesAndThePlaceTheyCameFrom() async {
        let service = MockMoveService()
        service.overviewResult = .success([makeMove(id: "m1", hive: "1", from: at("a-home", "Home"), to: at("a-heath", "Heath"))])
        let apiaries = MockApiaryService()
        apiaries.listResult = .success(makePage([owned("a-home", "Home"), owned("a-heath", "Heath")]))
        let vm = makeViewModel(service, apiaries)

        await vm.loadTargets()
        XCTAssertEqual(vm.returns.map(\.name), ["Home"])
        vm.sendBack(vm.returns[0])

        XCTAssertEqual(vm.selected, ["h-1"])
        XCTAssertEqual(vm.target, "a-home")
        XCTAssertTrue(vm.canSubmit)
        XCTAssertEqual(vm.request().hiveIds, ["h-1"])
        XCTAssertEqual(vm.request().toApiaryId, "a-home")
    }

    func test_withoutAHistoryTheFormWorksAsBefore() async {
        let service = MockMoveService()
        service.overviewResult = .failure(URLError(.notConnectedToInternet))
        let apiaries = MockApiaryService()
        apiaries.listResult = .success(makePage([owned("a-home", "Home"), owned("a-heath", "Heath")]))
        let vm = makeViewModel(service, apiaries)

        await vm.loadTargets()

        XCTAssertTrue(vm.returns.isEmpty)
        XCTAssertEqual(vm.targets.map(\.id), ["a-home"])
    }
}
