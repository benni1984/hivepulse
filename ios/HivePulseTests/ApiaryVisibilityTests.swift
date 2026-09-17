import XCTest
@testable import HivePulse

/// An apiary can be made public (or private again) after it was created.
@MainActor
final class ApiaryVisibilityTests: XCTestCase {

    private var svc: MockApiaryService!
    private var vm: ApiaryViewModel!

    override func setUp() {
        super.setUp()
        svc = MockApiaryService()
        vm = ApiaryViewModel(service: svc)
    }

    func test_create_passesPublicFlag() async throws {
        svc.createResult = .success(makeApiary())
        _ = try await vm.create(name: "Meadow", description: nil, latitude: nil, longitude: nil,
                                address: nil, isPublic: true)
        XCTAssertEqual(svc.lastCreateIsPublic, true)
    }

    func test_create_defaultsToPrivate() async throws {
        svc.createResult = .success(makeApiary())
        _ = try await vm.create(name: "Meadow", description: nil, latitude: nil, longitude: nil, address: nil)
        XCTAssertEqual(svc.lastCreateIsPublic, false)
    }

    func test_update_makesExistingApiaryPublicAndReturnsIt() async throws {
        var updated = makeApiary(id: "a-1", name: "Meadow")
        updated.isPublic = true
        svc.updateResult = .success(updated)

        let result = try await vm.update("a-1", name: "Meadow", description: nil,
                                         latitude: nil, longitude: nil, address: nil, isPublic: true)

        XCTAssertEqual(svc.lastUpdateIsPublic, true)
        XCTAssertEqual(result.isPublic, true)
    }

    func test_update_withoutFlagLeavesVisibilityUnchanged() async throws {
        svc.updateResult = .success(makeApiary())
        try await vm.update("a-1", name: "Meadow", description: nil, latitude: nil, longitude: nil, address: nil)
        XCTAssertTrue(svc.updateCalled)
        XCTAssertNil(svc.lastUpdateIsPublic)
    }

    // MARK: - Wire format

    func test_apiaryOut_decodesIsPublic() throws {
        let json = #"{"id":"a-1","name":"Meadow","description":null,"latitude":null,"longitude":null,"address":null,"hive_count":1,"is_public":true,"created_at":"2024-01-01T00:00:00.123456"}"#
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .hivePulseBackend
        let apiary = try decoder.decode(ApiaryOut.self, from: Data(json.utf8))
        XCTAssertEqual(apiary.isPublic, true)
    }

    func test_apiaryOut_withoutIsPublicStillDecodes() throws {
        let json = #"{"id":"a-1","name":"Meadow","description":null,"latitude":null,"longitude":null,"address":null,"hive_count":1,"created_at":"2024-01-01T00:00:00.123456"}"#
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .hivePulseBackend
        XCTAssertNil(try decoder.decode(ApiaryOut.self, from: Data(json.utf8)).isPublic)
    }

    func test_apiaryCreate_encodesIsPublicAsSnakeCase() throws {
        let body = ApiaryCreate(name: "Meadow", description: nil, latitude: nil, longitude: nil,
                                address: nil, isPublic: true)
        let object = try JSONSerialization.jsonObject(with: JSONEncoder().encode(body)) as? [String: Any]
        XCTAssertEqual(object?["is_public"] as? Bool, true)
        XCTAssertNil(object?["isPublic"])
    }

    func test_apiaryCreate_omitsIsPublicWhenNil() throws {
        let body = ApiaryCreate(name: "Meadow", description: nil, latitude: nil, longitude: nil, address: nil)
        let object = try JSONSerialization.jsonObject(with: JSONEncoder().encode(body)) as? [String: Any]
        XCTAssertNil(object?["is_public"])
    }
}
