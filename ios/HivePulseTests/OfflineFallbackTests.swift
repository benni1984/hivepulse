import XCTest
@testable import HivePulse

/// At the apiary there is often no signal. Reads must then come from the local copy —
/// but only for connection failures: a 404 or an expired session is a real answer and
/// has to keep surfacing as an error instead of showing stale data.
final class OfflineFallbackTests: XCTestCase {

    private var directory: URL!
    private var store: OfflineStore!

    override func setUp() {
        super.setUp()
        directory = FileManager.default.temporaryDirectory
            .appendingPathComponent("offline-fallback-\(UUID().uuidString)", isDirectory: true)
        store = OfflineStore(directory: directory)
    }

    override func tearDown() {
        try? FileManager.default.removeItem(at: directory)
        super.tearDown()
    }

    // MARK: - What counts as offline

    func test_connectionFailuresCountAsOffline() {
        XCTAssertTrue(URLError(.notConnectedToInternet).isOffline)
        XCTAssertTrue(URLError(.networkConnectionLost).isOffline)
        XCTAssertTrue(URLError(.timedOut).isOffline)
        XCTAssertTrue(APIError.network(URLError(.cannotConnectToHost)).isOffline)
    }

    func test_serverAnswersDoNotCountAsOffline() {
        XCTAssertFalse(APIError.unauthorized.isOffline)
        XCTAssertFalse(APIError.notFound("hive").isOffline)
        XCTAssertFalse(APIError.validation("date").isOffline)
        XCTAssertFalse(URLError(.badURL).isOffline)
    }

    // MARK: - The store itself

    func test_storedValuesSurviveANewStoreOnTheSameFolder() {
        store.save([makeApiary(id: "a-1")], for: OfflineStore.Key.apiaries)

        let reopened = OfflineStore(directory: directory)
        let cached = reopened.load([ApiaryOut].self, for: OfflineStore.Key.apiaries)

        XCTAssertEqual(cached?.count, 1)
        XCTAssertEqual(cached?.first?.id, "a-1")
    }

    func test_inspectionsRoundTripIncludingTheirDates() throws {
        let inspection = makeInspection(id: "i-1")
        store.save([inspection], for: OfflineStore.Key.inspections(hiveId: "h-1"))

        let cached = store.load([InspectionOut].self, for: OfflineStore.Key.inspections(hiveId: "h-1"))

        XCTAssertEqual(cached?.first?.id, "i-1")
        XCTAssertEqual(
            cached?.first?.createdAt.timeIntervalSince1970 ?? 0,
            inspection.createdAt.timeIntervalSince1970,
            accuracy: 1
        )
    }

    func test_aScannedQrCodeFindsItsHive() {
        store.rememberHives([makeHive(id: "h-1")])

        XCTAssertEqual(store.hive(qrToken: makeHive(id: "h-1").qrToken)?.id, "h-1")
        XCTAssertEqual(store.hive(id: "h-1")?.id, "h-1")
        XCTAssertNil(store.hive(qrToken: "unknown-token"))
    }

    func test_signingOutRemovesEverything() {
        store.save([makeApiary(id: "a-1")], for: OfflineStore.Key.apiaries)
        store.rememberHives([makeHive(id: "h-1")])

        store.clear()

        XCTAssertNil(store.load([ApiaryOut].self, for: OfflineStore.Key.apiaries))
        XCTAssertNil(store.hive(id: "h-1"))
    }

    // MARK: - The inspection service

    func test_theListShowsQueuedVisitsAboveTheStoredOnes() async throws {
        let api = MockInspectionService()
        api.listResult = .success(makePage([makeInspection(id: "i-1")], perPage: 20))
        let queue = OfflineInspectionQueue(store: store, service: MockInspectionService().offline())
        _ = try? await queue.submit(hiveId: "h-1", request: minimalRequest())

        let service = InspectionService(api: api, store: store, queue: queue)
        let result = try await service.list(hiveId: "h-1", page: 1)

        XCTAssertEqual(result.items.count, 2)
        XCTAssertTrue(result.items[0].isPending)
        XCTAssertEqual(result.items[1].id, "i-1")
        XCTAssertEqual(result.total, 2)
    }

    func test_offlineTheListCombinesQueuedAndCachedVisits() async throws {
        store.save([makeInspection(id: "i-1")], for: OfflineStore.Key.inspections(hiveId: "h-1"))
        let queue = OfflineInspectionQueue(store: store, service: MockInspectionService().offline())
        _ = try? await queue.submit(hiveId: "h-1", request: minimalRequest())

        let api = MockInspectionService()
        api.listResult = .failure(URLError(.notConnectedToInternet))
        let service = InspectionService(api: api, store: store, queue: queue)

        let result = try await service.list(hiveId: "h-1", page: 1)

        XCTAssertEqual(result.items.count, 2)
        XCTAssertTrue(result.items[0].isPending)
    }

    func test_offlineWithNothingStoredTheErrorSurfaces() async {
        let api = MockInspectionService()
        api.listResult = .failure(URLError(.notConnectedToInternet))
        let queue = OfflineInspectionQueue(store: store, service: api)
        let service = InspectionService(api: api, store: store, queue: queue)

        do {
            _ = try await service.list(hiveId: "h-1", page: 1)
            XCTFail("expected the offline error to surface")
        } catch {
            XCTAssertTrue(error.isOffline)
        }
    }

    func test_aServerErrorIsNotAnsweredFromTheCache() async {
        store.save([makeInspection(id: "i-1")], for: OfflineStore.Key.inspections(hiveId: "h-1"))
        let api = MockInspectionService()
        api.listResult = .failure(APIError.unauthorized)
        let queue = OfflineInspectionQueue(store: store, service: api)
        let service = InspectionService(api: api, store: store, queue: queue)

        do {
            _ = try await service.list(hiveId: "h-1", page: 1)
            XCTFail("expected the 401 to surface")
        } catch {
            XCTAssertFalse(error.isOffline)
        }
    }

    private func minimalRequest() -> InspectionCreateRequest {
        InspectionCreateRequest(
            date: "2026-04-23", queenSeen: nil, queenColor: nil, broodFrames: nil,
            honeyFrames: nil, mood: nil, populationStrength: nil, varroaLevel: nil,
            swarmCellsSeen: nil, treatmentApplied: nil, feedingDone: nil,
            feedingType: nil, weightKg: nil, notes: nil, customFields: [:]
        )
    }
}

private extension MockInspectionService {
    /// A service that always fails the way a missing connection does.
    func offline() -> MockInspectionService {
        createResult = .failure(URLError(.notConnectedToInternet))
        return self
    }
}
