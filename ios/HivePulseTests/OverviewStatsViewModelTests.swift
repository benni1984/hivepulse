import XCTest
@testable import HivePulse

final class MockOverviewStatsService: OverviewStatsProviding {
    var result: Result<OverviewStats, Error> = .success(makeOverviewStats())
    private(set) var requestedPresets: [String?] = []

    func overview(preset: String?, from: String?, to: String?) async throws -> OverviewStats {
        requestedPresets.append(preset)
        return try result.get()
    }
}

func makeOverviewStats(preset: String = "365d") -> OverviewStats {
    OverviewStats(
        period: StatsPeriod(from: "2025-09-15", to: "2026-09-15", preset: preset),
        apiaryCount: 2, hiveCount: 7, inspectionsTotal: 31,
        perApiary: [
            ApiaryStatsSummary(apiaryId: "a-1", apiaryName: "Meadow", hiveCount: 4, inspectionsTotal: 20),
            ApiaryStatsSummary(apiaryId: "a-2", apiaryName: "Forest", hiveCount: 3, inspectionsTotal: 11),
        ]
    )
}

@MainActor
final class OverviewStatsViewModelTests: XCTestCase {

    private var svc: MockOverviewStatsService!
    private var vm: OverviewStatsViewModel!

    override func setUp() {
        super.setUp()
        svc = MockOverviewStatsService()
        vm = OverviewStatsViewModel(service: svc)
    }

    func test_load_defaultsToLastYear() async {
        await vm.load()

        XCTAssertEqual(svc.requestedPresets, ["365d"])
        XCTAssertEqual(vm.stats?.inspectionsTotal, 31)
        XCTAssertEqual(vm.stats?.perApiary.count, 2)
        XCTAssertFalse(vm.isLoading)
        XCTAssertNil(vm.errorMessage)
    }

    func test_load_usesSelectedPreset() async {
        vm.preset = "30d"

        await vm.load()

        XCTAssertEqual(svc.requestedPresets.last, "30d")
    }

    func test_load_failureKeepsPreviousStatsAndSetsError() async {
        await vm.load()
        svc.result = .failure(NSError(domain: "test", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "offline"]))
        vm.preset = "all"

        await vm.load()

        XCTAssertEqual(vm.stats?.inspectionsTotal, 31)
        XCTAssertEqual(vm.errorMessage, "offline")
        XCTAssertFalse(vm.isLoading)
    }

    func test_overviewStats_decodesPerApiaryBreakdown() throws {
        let json = """
        {"period":{"from":"2025-09-15","to":"2026-09-15","preset":"365d"},
         "apiary_count":1,"hive_count":4,"inspections_total":20,
         "per_apiary":[{"apiary_id":"a-1","apiary_name":"Meadow","hive_count":4,"inspections_total":20}]}
        """.data(using: .utf8)!

        let stats = try JSONDecoder().decode(OverviewStats.self, from: json)

        XCTAssertEqual(stats.inspectionsTotal, 20)
        let row = try XCTUnwrap(stats.perApiary.first)
        XCTAssertEqual(row.id, "a-1")
        XCTAssertEqual(row.apiaryName, "Meadow")
        XCTAssertEqual(row.hiveCount, 4)
        XCTAssertEqual(row.inspectionsTotal, 20)
    }
}
