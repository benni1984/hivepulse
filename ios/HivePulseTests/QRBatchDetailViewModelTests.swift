import XCTest
@testable import HivePulse

@MainActor
final class QRBatchDetailViewModelTests: XCTestCase {

    private var svc: MockQrBatchService!

    override func setUp() {
        super.setUp()
        svc = MockQrBatchService()
    }

    func test_load_populatesBatch() async {
        let vm = QRBatchDetailViewModel(batchId: "b-1", service: svc)

        await vm.load()

        XCTAssertEqual(vm.batch?.id, "b-1")
        XCTAssertEqual(vm.batch?.tokens.count, 2)
        XCTAssertFalse(vm.isLoading)
    }

    func test_load_failureSetsError() async {
        svc.getResult = .failure(NSError(domain: "test", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Batch not found"]))
        let vm = QRBatchDetailViewModel(batchId: "b-1", service: svc)

        await vm.load()

        XCTAssertNil(vm.batch)
        XCTAssertEqual(vm.errorMessage, "Batch not found")
    }

    func test_downloadPdf_writesFileAndExposesURLForQuickLook() async throws {
        let pdf = Data("%PDF-1.4 test".utf8)
        svc.pdfResult = .success(pdf)
        let vm = QRBatchDetailViewModel(batchId: "b-1", service: svc)

        await vm.downloadPdf()

        let url = try XCTUnwrap(vm.pdfURL)
        XCTAssertEqual(url.pathExtension, "pdf")
        XCTAssertEqual(try Data(contentsOf: url), pdf)
        XCTAssertFalse(vm.isDownloading)
        XCTAssertNil(vm.errorMessage)
    }

    func test_downloadPdf_failureSetsErrorInsteadOfFailingSilently() async {
        svc.pdfResult = .failure(NSError(domain: "test", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Request failed"]))
        let vm = QRBatchDetailViewModel(batchId: "b-1", service: svc)

        await vm.downloadPdf()

        XCTAssertNil(vm.pdfURL)
        XCTAssertEqual(vm.errorMessage, "Request failed")
        XCTAssertFalse(vm.isDownloading)
    }

    func test_downloadPdf_ignoresRepeatedTapsWhileRunning() async {
        svc.pdfDelayNanoseconds = 200_000_000
        let vm = QRBatchDetailViewModel(batchId: "b-1", service: svc)

        async let first: Void = vm.downloadPdf()
        async let second: Void = vm.downloadPdf()
        async let third: Void = vm.downloadPdf()
        _ = await (first, second, third)

        XCTAssertEqual(svc.pdfCallCount, 1)
        XCTAssertNotNil(vm.pdfURL)
        XCTAssertFalse(vm.isDownloading)
    }
}
