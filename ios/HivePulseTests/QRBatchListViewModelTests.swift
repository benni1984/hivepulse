import XCTest
@testable import HivePulse

@MainActor
final class QRBatchListViewModelTests: XCTestCase {

    private var svc: MockQrBatchService!

    override func setUp() {
        super.setUp()
        svc = MockQrBatchService()
    }

    private func summary(_ id: String, linked: Int, count: Int = 4) -> QrBatchSummary {
        QrBatchSummary(id: id, count: count, createdAt: Date(), linkedCount: linked)
    }

    func test_load_fillsTheList() async {
        svc.listItems = [summary("b-1", linked: 0), summary("b-2", linked: 3)]
        let vm = QRBatchListViewModel(service: svc)

        await vm.load()

        XCTAssertEqual(vm.batches.map(\.id), ["b-1", "b-2"])
        XCTAssertFalse(vm.isLoading)
        XCTAssertNil(vm.errorMessage)
    }

    func test_aBatchWithACodeOnAHiveCannotBeDeleted() {
        let vm = QRBatchListViewModel(service: svc)

        XCTAssertFalse(vm.canDelete(summary("b-1", linked: 1)))
        XCTAssertTrue(vm.canDelete(summary("b-2", linked: 0)))
    }

    func test_deleteRemovesTheRowAndAsksTheServer() async {
        let unused = summary("b-1", linked: 0)
        svc.listItems = [unused, summary("b-2", linked: 2)]
        let vm = QRBatchListViewModel(service: svc)
        await vm.load()

        await vm.delete(unused)

        XCTAssertEqual(svc.deletedIds, ["b-1"])
        XCTAssertEqual(vm.batches.map(\.id), ["b-2"])
        XCTAssertNil(vm.errorMessage)
    }

    func test_deleteNeverAsksTheServerForABatchInUse() async {
        let inUse = summary("b-1", linked: 2)
        svc.listItems = [inUse]
        let vm = QRBatchListViewModel(service: svc)
        await vm.load()

        await vm.delete(inUse)

        XCTAssertTrue(svc.deletedIds.isEmpty)
        XCTAssertEqual(vm.batches.count, 1)
    }

    func test_aRefusedDeleteKeepsTheRowAndShowsTheServersMessage() async {
        let unused = summary("b-1", linked: 0)
        svc.listItems = [unused]
        svc.deleteError = APIError.conflict("This batch contains codes that are attached to hives.")
        let vm = QRBatchListViewModel(service: svc)
        await vm.load()

        await vm.delete(unused)

        XCTAssertEqual(vm.batches.count, 1, "it was not deleted")
        XCTAssertEqual(vm.errorMessage, "This batch contains codes that are attached to hives.")
    }

    func test_createClampsTheCountAndReloads() async {
        let vm = QRBatchListViewModel(service: svc)

        await vm.create(count: 500)
        await vm.create(count: 0)

        XCTAssertEqual(svc.createdCounts, [50, 1])
    }

    func test_aFailedLoadSetsTheMessage() async {
        svc.listError = APIError.server("down")
        let vm = QRBatchListViewModel(service: svc)

        await vm.load()

        XCTAssertEqual(vm.errorMessage, "down")
        XCTAssertFalse(vm.isLoading)
    }
}
