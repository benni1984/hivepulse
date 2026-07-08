import XCTest
import UIKit
@testable import HivePulse

@MainActor
final class HiveQRViewTests: XCTestCase {

    private var svc: MockHiveService!

    override func setUp() {
        super.setUp()
        svc = MockHiveService()
    }

    func test_qrImageData_successReturnsDecodableImage() async throws {
        svc.qrImageResult = .success(MockHiveService.onePixelPNG)
        let data = try await svc.qrImageData(hiveId: "h-1")
        XCTAssertNotNil(UIImage(data: data))
    }

    func test_qrImageData_failurePropagatesError() async {
        svc.qrImageResult = .failure(NSError(domain: "test", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Load failed"]))
        do {
            _ = try await svc.qrImageData(hiveId: "h-1")
            XCTFail("Expected qrImageData to throw")
        } catch {
            XCTAssertEqual((error as NSError).localizedDescription, "Load failed")
        }
    }
}
