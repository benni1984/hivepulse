import XCTest
@testable import HivePulse

@MainActor
final class HiveViewModelTests: XCTestCase {

    private var svc: MockHiveService!
    private var vm: HiveViewModel!

    override func setUp() {
        super.setUp()
        svc = MockHiveService()
        vm = HiveViewModel(service: svc)
    }

    func test_load_populatesHives() async {
        svc.listResult = .success(makePage([makeHive(id: "h-1"), makeHive(id: "h-2")]))
        await vm.load(apiaryId: "a-1")
        XCTAssertEqual(vm.hives.count, 2)
        XCTAssertEqual(vm.hives[0].id, "h-1")
    }

    func test_load_setsErrorOnFailure() async {
        svc.listResult = .failure(NSError(domain: "test", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Load failed"]))
        await vm.load(apiaryId: "a-1")
        XCTAssertTrue(vm.hives.isEmpty)
        XCTAssertEqual(vm.errorMessage, "Load failed")
    }

    func test_initialize_appendsHive() async throws {
        let hive = try await vm.initialize(
            qrToken: "tok", apiaryId: "a-1", name: "New Hive",
            hiveType: "langstroth", latitude: nil, longitude: nil,
            acquisitionDate: nil, notes: nil
        )
        XCTAssertEqual(hive.name, "New Hive")
        XCTAssertEqual(vm.hives.count, 1)
        XCTAssertEqual(vm.hives[0].id, "h-new")
    }

    func test_delete_removesHive() async throws {
        svc.listResult = .success(makePage([makeHive(id: "h-1"), makeHive(id: "h-2")]))
        await vm.load(apiaryId: "a-1")
        try await vm.delete("h-1")
        XCTAssertEqual(vm.hives.count, 1)
        XCTAssertEqual(vm.hives[0].id, "h-2")
    }

    func test_create_sendsTheNewHiveToTheApiaryAndAppendsIt() async throws {
        let hive = try await vm.create(apiaryId: "a-1", name: "Nicole II", hiveType: "dadant",
                                       acquisitionDate: "2026-04-01", notes: "from a swarm")

        XCTAssertEqual(hive.name, "Nicole II")
        XCTAssertEqual(vm.hives.map(\.name), ["Nicole II"])
        let sent = try XCTUnwrap(svc.createRequests.first)
        XCTAssertEqual(sent.apiaryId, "a-1")
        XCTAssertEqual(sent.request.hiveType, "dadant")
        XCTAssertEqual(sent.request.acquisitionDate, "2026-04-01")
        XCTAssertEqual(sent.request.notes, "from a swarm")
    }

    func test_create_refusedLeavesTheListAlone() async {
        svc.createError = NSError(domain: "test", code: 403,
                                  userInfo: [NSLocalizedDescriptionKey: "Only the owner"])

        do {
            _ = try await vm.create(apiaryId: "a-1", name: "X", hiveType: "langstroth", acquisitionDate: nil, notes: nil)
            XCTFail("a refusal must be thrown to the form")
        } catch {
            XCTAssertEqual(error.localizedDescription, "Only the owner")
        }
        XCTAssertTrue(vm.hives.isEmpty)
    }

    func test_createRequest_isEncodedTheWayTheServerReadsIt() throws {
        let body = HiveCreateRequest(name: "H", hiveType: "top_bar", acquisitionDate: nil, notes: nil)
        let json = try XCTUnwrap(String(data: JSONEncoder().encode(body), encoding: .utf8))

        XCTAssertTrue(json.contains("\"hive_type\":\"top_bar\""))
        XCTAssertFalse(json.contains("hiveType"))
    }

    func test_update_replacesHive() async throws {
        svc.listResult = .success(makePage([makeHive(id: "h-1", name: "Old")]))
        await vm.load(apiaryId: "a-1")
        try await vm.update("h-1", name: "Updated", hiveType: "dadant", notes: nil)
        XCTAssertEqual(vm.hives[0].name, "Updated")
    }

    func test_resolveQR_returnsLinked() async throws {
        let hive = makeHive()
        svc.resolveResult = .linked(hive)
        let result = try await vm.resolveQR(token: "tok")
        guard case .linked(let h) = result else {
            return XCTFail("Expected .linked")
        }
        XCTAssertEqual(h.id, hive.id)
    }

    func test_resolveQR_returnsUnlinked() async throws {
        svc.resolveResult = .unlinked(token: "free-token")
        let result = try await vm.resolveQR(token: "free-token")
        guard case .unlinked(let tok) = result else {
            return XCTFail("Expected .unlinked")
        }
        XCTAssertEqual(tok, "free-token")
    }
}
