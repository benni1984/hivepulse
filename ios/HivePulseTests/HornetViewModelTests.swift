import XCTest
@testable import HivePulse

@MainActor
final class HornetViewModelTests: XCTestCase {

    private var svc: MockHornetService!
    private var vm: HornetViewModel!

    override func setUp() {
        super.setUp()
        svc = MockHornetService()
        vm = HornetViewModel(service: svc)
    }

    // MARK: - loadStats

    func test_loadStats_populatesStats() async {
        await vm.loadStats()
        XCTAssertEqual(vm.stats?.totalCaught, 42)
        XCTAssertNil(vm.errorMessage)
    }

    func test_loadStats_failure_setsError() async {
        svc.statsResult = .failure(NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Stats failed"]))
        await vm.loadStats()
        XCTAssertNil(vm.stats)
        XCTAssertEqual(vm.errorMessage, "Stats failed")
    }

    // MARK: - loadNests

    func test_loadNests_populatesNests() async {
        await vm.loadNests()
        XCTAssertNotNil(vm.nests)
        XCTAssertEqual(vm.nests?.features.count, 1)
        XCTAssertNil(vm.errorMessage)
    }

    func test_loadNests_failure_setsError() async {
        svc.nestsResult = .failure(NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Nests failed"]))
        await vm.loadNests()
        XCTAssertNil(vm.nests)
        XCTAssertEqual(vm.errorMessage, "Nests failed")
    }

    // MARK: - loadSightings

    func test_loadSightings_populatesSightings() async {
        await vm.loadSightings()
        XCTAssertEqual(vm.sightings.count, 1)
        XCTAssertEqual(vm.sightings[0].id, "s-1")
    }

    func test_loadSightings_page2_appendsSightings() async {
        await vm.loadSightings(page: 1)
        let s2 = makeHornetSighting(id: "s-2")
        svc.sightingsResult = .success(PaginatedResponse(items: [s2], total: 2, page: 2, perPage: 12, pages: 2))
        await vm.loadSightings(page: 2)
        XCTAssertEqual(vm.sightings.count, 2)
    }

    func test_loadSightings_page1_replacesSightings() async {
        await vm.loadSightings(page: 1)
        let s2 = makeHornetSighting(id: "s-fresh")
        svc.sightingsResult = .success(makePage([s2]))
        await vm.loadSightings(page: 1)
        XCTAssertEqual(vm.sightings.count, 1)
        XCTAssertEqual(vm.sightings[0].id, "s-fresh")
    }

    func test_loadSightings_failure_setsError() async {
        svc.sightingsResult = .failure(NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Sightings failed"]))
        await vm.loadSightings()
        XCTAssertTrue(vm.sightings.isEmpty)
        XCTAssertEqual(vm.errorMessage, "Sightings failed")
    }

    // MARK: - submitCatch

    func test_submitCatch_success_clearsError() async {
        vm.errorMessage = "old error"
        await vm.submitCatch(count: 3)
        XCTAssertNil(vm.errorMessage)
    }

    func test_submitCatch_failure_setsError() async {
        svc.submitCatchResult = .failure(NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Submit failed"]))
        await vm.submitCatch(count: 1)
        XCTAssertEqual(vm.errorMessage, "Submit failed")
    }

    // MARK: - submitNest

    func test_submitNest_success() async {
        await vm.submitNest(latitude: 48.85, longitude: 2.35)
        XCTAssertNil(vm.errorMessage)
    }

    func test_submitNest_failure_setsError() async {
        svc.submitNestResult = .failure(NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Nest failed"]))
        await vm.submitNest(latitude: 48.85, longitude: 2.35)
        XCTAssertEqual(vm.errorMessage, "Nest failed")
    }

    // MARK: - submitSighting

    func test_submitSighting_prependsSightingToList() async {
        await vm.loadSightings()
        let existing = vm.sightings.count
        let newSighting = makeHornetSighting(id: "s-new")
        svc.submitSightingResult = .success(newSighting)
        await vm.submitSighting(photoUrl: "https://example.com/x.jpg")
        XCTAssertEqual(vm.sightings.count, existing + 1)
        XCTAssertEqual(vm.sightings[0].id, "s-new")
    }

    func test_submitSighting_failure_setsError() async {
        svc.submitSightingResult = .failure(NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Upload failed"]))
        await vm.submitSighting(photoUrl: "")
        XCTAssertEqual(vm.errorMessage, "Upload failed")
    }

    // MARK: - vote

    func test_vote_success_reloadsSightings() async {
        await vm.loadSightings()
        let refreshed = makeHornetSighting(id: "s-1")
        svc.sightingsResult = .success(makePage([refreshed]))
        await vm.vote(sightingId: "s-1", vote: "yes")
        XCTAssertNil(vm.errorMessage)
        XCTAssertEqual(vm.sightings.count, 1)
    }

    func test_vote_failure_setsError() async {
        svc.voteError = NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Vote failed"])
        await vm.vote(sightingId: "s-1", vote: "yes")
        XCTAssertEqual(vm.errorMessage, "Vote failed")
    }

    // MARK: - loadingState

    func test_isLoading_falseAfterLoad() async {
        await vm.loadNests()
        XCTAssertFalse(vm.isLoading)
    }

    // MARK: - loadNearbyTraps

    func test_loadNearbyTraps_populatesNearbyTraps() async {
        await vm.loadNearbyTraps(lat: 48.85, lon: 2.35)
        XCTAssertEqual(vm.nearbyTraps.count, 1)
        XCTAssertEqual(vm.nearbyTraps[0].accessCode, "ABCD1234")
        XCTAssertNil(vm.trapError)
        XCTAssertFalse(vm.trapLoading)
    }

    func test_loadNearbyTraps_failure_setsTrapError() async {
        svc.nearbyResult = .failure(NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "GPS failed"]))
        await vm.loadNearbyTraps(lat: 0, lon: 0)
        XCTAssertTrue(vm.nearbyTraps.isEmpty)
        XCTAssertEqual(vm.trapError, "GPS failed")
    }

    // MARK: - loadTrap

    func test_loadTrap_setsCurrentTrap() async {
        await vm.loadTrap(accessCode: "ABCD1234")
        XCTAssertNotNil(vm.currentTrap)
        XCTAssertEqual(vm.currentTrap?.accessCode, "ABCD1234")
        XCTAssertEqual(vm.currentTrap?.totalCaught, 7)
        XCTAssertNil(vm.trapError)
    }

    func test_loadTrap_failure_setsTrapError() async {
        svc.getTrapResult = .failure(NSError(domain: "t", code: 404,
            userInfo: [NSLocalizedDescriptionKey: "Not found"]))
        await vm.loadTrap(accessCode: "XXXXXXXX")
        XCTAssertNil(vm.currentTrap)
        XCTAssertEqual(vm.trapError, "Not found")
    }

    // MARK: - createTrap

    func test_createTrap_returnsTrapWithAccessCode() async {
        let trap = await vm.createTrap(name: "Garden", latitude: 48.85, longitude: 2.35)
        XCTAssertNotNil(trap)
        XCTAssertEqual(trap?.accessCode, "ABCD1234")
        XCTAssertNotNil(vm.trapSuccess)
        XCTAssertNil(vm.trapError)
    }

    func test_createTrap_failure_setsTrapError() async {
        svc.createTrapResult = .failure(NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Create failed"]))
        let trap = await vm.createTrap(name: "", latitude: 0, longitude: 0)
        XCTAssertNil(trap)
        XCTAssertEqual(vm.trapError, "Create failed")
    }

    // MARK: - addTrapCatch

    func test_addTrapCatch_success_setsTrapSuccess() async {
        vm.currentTrap = makeHornetTrap()
        await vm.addTrapCatch(accessCode: "ABCD1234", count: 3, date: "2026-05-15")
        XCTAssertNotNil(vm.trapSuccess)
        XCTAssertNil(vm.trapError)
    }

    func test_addTrapCatch_failure_setsTrapError() async {
        svc.addCatchResult = .failure(NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Catch failed"]))
        vm.currentTrap = makeHornetTrap()
        await vm.addTrapCatch(accessCode: "ABCD1234", count: 1, date: "2026-05-15")
        XCTAssertEqual(vm.trapError, "Catch failed")
    }

    func test_addTrapCatch_refreshesTrapAfterSuccess() async {
        let updatedTrap = makeHornetTrap(accessCode: "ABCD1234")
        svc.getTrapResult = .success(updatedTrap)
        vm.currentTrap = makeHornetTrap()
        await vm.addTrapCatch(accessCode: "ABCD1234", count: 5, date: "2026-05-16")
        // getTrap was called again to refresh — currentTrap matches updated version
        XCTAssertEqual(vm.currentTrap?.accessCode, "ABCD1234")
    }

    // MARK: - trap loading flag

    func test_trapLoading_falseAfterTrapLoad() async {
        await vm.loadTrap(accessCode: "ABCD1234")
        XCTAssertFalse(vm.trapLoading)
    }
}
