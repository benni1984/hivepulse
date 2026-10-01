import XCTest
@testable import HivePulse

/// An inspection recorded at the apiary must never be lost, must never be stored twice,
/// and a rejection from the server must not disappear into the queue.
final class OfflineInspectionQueueTests: XCTestCase {

    private var directory: URL!
    private var store: OfflineStore!
    private var service: MockInspectionService!
    private var queue: OfflineInspectionQueue!

    override func setUp() async throws {
        try await super.setUp()
        directory = FileManager.default.temporaryDirectory
            .appendingPathComponent("offline-tests-\(UUID().uuidString)", isDirectory: true)
        store = OfflineStore(directory: directory)
        service = MockInspectionService()
        queue = OfflineInspectionQueue(store: store, service: service)
    }

    override func tearDown() async throws {
        try? FileManager.default.removeItem(at: directory)
        try await super.tearDown()
    }

    private func request(notes: String = "Ruhig") -> InspectionCreateRequest {
        InspectionCreateRequest(
            date: "2026-04-23", queenSeen: true, queenColor: nil, broodFrames: 5,
            honeyFrames: 2, mood: "calm", populationStrength: 3, varroaLevel: 1,
            swarmCellsSeen: false, treatmentApplied: nil, feedingDone: false,
            feedingType: nil, weightKg: nil, notes: notes, customFields: [:]
        )
    }

    private var offline: Error { URLError(.notConnectedToInternet) }

    func test_onlineSave_reachesTheServerAndLeavesNothingQueued() async throws {
        service.createResult = .success(makeInspection(id: "i-1"))

        let result = try await queue.submit(hiveId: "h-1", request: request())

        XCTAssertEqual(result.id, "i-1")
        XCTAssertFalse(result.isPending)
        let count = await queue.count
        XCTAssertEqual(count, 0)
        XCTAssertNotNil(service.lastRequest?.clientId, "a client_id is always sent")
    }

    func test_withoutAConnection_theVisitIsQueuedAndReturnedAsPending() async throws {
        service.createResult = .failure(offline)

        let result = try await queue.submit(hiveId: "h-1", request: request())

        XCTAssertTrue(result.isPending)
        XCTAssertEqual(result.date, "2026-04-23")
        XCTAssertEqual(result.broodFrames, 5)
        let count = await queue.count
        XCTAssertEqual(count, 1)
    }

    func test_aRejectionFromTheServerIsReportedNotQueued() async throws {
        service.createResult = .failure(APIError.validation("brood_frames"))

        do {
            _ = try await queue.submit(hiveId: "h-1", request: request())
            XCTFail("expected the validation error to surface")
        } catch {
            // expected
        }
        let count = await queue.count
        XCTAssertEqual(count, 0, "a refused visit must not sit in the queue forever")
    }

    func test_queuedVisitsSurviveANewQueueInstance() async throws {
        service.createResult = .failure(offline)
        _ = try await queue.submit(hiveId: "h-1", request: request())

        // The app was closed and started again
        let restarted = OfflineInspectionQueue(store: OfflineStore(directory: directory), service: service)
        let pending = await restarted.pending(hiveId: "h-1")

        XCTAssertEqual(pending.count, 1)
        XCTAssertTrue(pending[0].isPending)
    }

    func test_flushUploadsEveryQueuedVisitWithItsOriginalClientId() async throws {
        service.createResult = .failure(offline)
        let first = try await queue.submit(hiveId: "h-1", request: request(notes: "first"))
        _ = try await queue.submit(hiveId: "h-2", request: request(notes: "second"))

        service.createResult = .success(makeInspection())
        let remaining = await queue.flush()

        XCTAssertEqual(remaining, 0)
        XCTAssertEqual(service.sentRequests.count, 4, "two offline attempts plus two retries")
        let retriedIds = service.sentRequests.suffix(2).compactMap(\.clientId)
        XCTAssertTrue(retriedIds.contains(first.clientId ?? ""), "the retry carries the original id")
    }

    func test_flushStopsAtTheFirstOfflineFailureAndKeepsTheEntries() async throws {
        service.createResult = .failure(offline)
        _ = try await queue.submit(hiveId: "h-1", request: request())
        _ = try await queue.submit(hiveId: "h-2", request: request())

        let remaining = await queue.flush()

        XCTAssertEqual(remaining, 2, "nothing is lost while there is still no connection")
    }

    func test_flushDropsAnEntryTheServerRefuses() async throws {
        service.createResult = .failure(offline)
        _ = try await queue.submit(hiveId: "h-1", request: request())

        service.createResult = .failure(APIError.notFound("hive gone"))
        let remaining = await queue.flush()

        XCTAssertEqual(remaining, 0, "a refused entry must not block the queue")
    }

    func test_pendingVisitsAreListedForTheirOwnHive() async throws {
        service.createResult = .failure(offline)
        _ = try await queue.submit(hiveId: "h-1", request: request())
        _ = try await queue.submit(hiveId: "h-2", request: request())

        let forFirst = await queue.pending(hiveId: "h-1")
        XCTAssertEqual(forFirst.count, 1)
        XCTAssertEqual(forFirst[0].hiveId, "h-1")
    }

    func test_signingOutClearsTheQueue() async throws {
        service.createResult = .failure(offline)
        _ = try await queue.submit(hiveId: "h-1", request: request())

        await queue.clear()

        let count = await queue.count
        XCTAssertEqual(count, 0)
    }
}
