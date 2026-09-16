import XCTest
@testable import HivePulse

/// Drives `HiveService.resolveQR` through a real `APIClient` (mock transport), not a stubbed service.
///
/// Regression: `resolveQR` fetched with `client.get(url)` typed as `Data`. `get` is generic over
/// `Decodable`, and `Data` decodes from a base64 *string*, so every scan against the real backend failed
/// with "The data couldn't be read because it isn't in the correct format". `HiveViewModelTests` only
/// exercised `MockHiveService`, which returns `QRScanResult` directly, so the decode path was untested.
@MainActor
final class QRScanDecodingTests: XCTestCase {

    private var previousClient: APIClient!

    override func setUp() {
        super.setUp()
        previousClient = APIClient.shared
        KeychainService.shared.accessToken = "unit-test-token"
        MockURLProtocol.configure(MockURLProtocol.authenticatedHandlers)
        APIClient.shared = .forUITesting()
    }

    override func tearDown() {
        APIClient.shared = previousClient
        KeychainService.shared.clearAll()
        super.tearDown()
    }

    func test_resolveQR_unlinkedToken_decodes() async throws {
        let result = try await HiveService().resolveQR(token: "tok-free")

        guard case .unlinked(let token) = result else {
            return XCTFail("expected .unlinked, got \(result)")
        }
        XCTAssertEqual(token, "tok-free")
    }

    func test_resolveQR_linkedToken_decodesHive() async throws {
        let result = try await HiveService().resolveQR(token: "tok-h1")

        guard case .linked(let hive) = result else {
            return XCTFail("expected .linked, got \(result)")
        }
        XCTAssertEqual(hive.id, "h-1")
        XCTAssertEqual(hive.name, "Hive Alpha")
    }
}
