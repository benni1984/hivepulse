import XCTest
import CoreLocation
import MapKit
@testable import HivePulse

private final class MockCommunityHeatmapService: CommunityHeatmapProviding {
    var result: Result<CommunityHeatmap, Error>
    private(set) var callCount = 0

    init(result: Result<CommunityHeatmap, Error>) { self.result = result }

    func communityHeatmap() async throws -> CommunityHeatmap {
        callCount += 1
        return try result.get()
    }
}

private func props(varroa: Double? = nil, mood: Double? = nil, brood: Double? = nil, swarm: Double = 0,
                   apiaries: Int = 1, inspections: Int = 1) -> CommunityHeatmapProperties {
    CommunityHeatmapProperties(avgVarroa: varroa, moodScore: mood, avgBrood: brood, swarmPct: swarm,
                               apiaryCount: apiaries, inspectionCount: inspections)
}

/// Square cell with its south-west corner at (lat, lon), 0.5° wide — same shape as the backend grid.
private func cell(lat: Double, lon: Double, _ p: CommunityHeatmapProperties) -> CommunityHeatmapFeature {
    CommunityHeatmapFeature(
        geometry: PolygonGeometry(type: "Polygon", coordinates: [[
            [lon, lat], [lon + 0.5, lat], [lon + 0.5, lat + 0.5], [lon, lat + 0.5], [lon, lat],
        ]]),
        properties: p
    )
}

@MainActor
final class CommunityHeatmapTests: XCTestCase {

    // MARK: - Decoding

    func test_decodesContractShape_withNullMetrics() throws {
        let json = """
        {"type":"FeatureCollection","features":[{"type":"Feature",
          "geometry":{"type":"Polygon","coordinates":[[[9.5,51.0],[10.0,51.0],[10.0,51.5],[9.5,51.5],[9.5,51.0]]]},
          "properties":{"avg_varroa":2.4,"mood_score":78,"avg_brood":null,"swarm_pct":12,"apiary_count":6,"inspection_count":34}}]}
        """
        let heatmap = try JSONDecoder().decode(CommunityHeatmap.self, from: Data(json.utf8))

        XCTAssertEqual(heatmap.features.count, 1)
        let p = heatmap.features[0].properties
        XCTAssertEqual(p.avgVarroa, 2.4)
        XCTAssertEqual(p.moodScore, 78)
        XCTAssertNil(p.avgBrood)
        XCTAssertEqual(p.swarmPct, 12)
        XCTAssertEqual(p.apiaryCount, 6)
        XCTAssertEqual(p.inspectionCount, 34)
        XCTAssertEqual(heatmap.features[0].ring.first?.latitude, 51.0)
        XCTAssertEqual(heatmap.features[0].ring.first?.longitude, 9.5)
    }

    // MARK: - Levels (thresholds mirror web + Android)

    func test_varroaLevels() {
        XCTAssertEqual(props(varroa: 1.9).level(for: .varroa), .good)
        XCTAssertEqual(props(varroa: 2).level(for: .varroa), .fair)
        XCTAssertEqual(props(varroa: 4.9).level(for: .varroa), .fair)
        XCTAssertEqual(props(varroa: 5).level(for: .varroa), .poor)
        XCTAssertEqual(props(varroa: nil).level(for: .varroa), .noData)
    }

    func test_moodLevels() {
        XCTAssertEqual(props(mood: 70).level(for: .mood), .good)
        XCTAssertEqual(props(mood: 69).level(for: .mood), .fair)
        XCTAssertEqual(props(mood: 40).level(for: .mood), .fair)
        XCTAssertEqual(props(mood: 39).level(for: .mood), .poor)
        XCTAssertEqual(props(mood: nil).level(for: .mood), .noData)
    }

    func test_swarmLevels() {
        XCTAssertEqual(props(swarm: 9).level(for: .swarm), .good)
        XCTAssertEqual(props(swarm: 10).level(for: .swarm), .fair)
        XCTAssertEqual(props(swarm: 29).level(for: .swarm), .fair)
        XCTAssertEqual(props(swarm: 30).level(for: .swarm), .poor)
    }

    func test_broodLevels() {
        XCTAssertEqual(props(brood: 5).level(for: .brood), .good)
        XCTAssertEqual(props(brood: 4.9).level(for: .brood), .fair)
        XCTAssertEqual(props(brood: 3).level(for: .brood), .fair)
        XCTAssertEqual(props(brood: 2.9).level(for: .brood), .poor)
        XCTAssertEqual(props(brood: nil).level(for: .brood), .noData)
    }

    func test_legendLevels_swarmHasNoNoDataEntry() {
        XCTAssertEqual(HeatmapOverlay.swarm.legendLevels, [.good, .fair, .poor])
        XCTAssertEqual(HeatmapOverlay.varroa.legendLevels, [.good, .fair, .poor, .noData])
    }

    // MARK: - Hit testing

    func test_contains_insideAndOutsideCell() {
        let feature = cell(lat: 51.0, lon: 9.5, props())

        XCTAssertTrue(feature.contains(CLLocationCoordinate2D(latitude: 51.25, longitude: 9.75)))
        XCTAssertFalse(feature.contains(CLLocationCoordinate2D(latitude: 51.25, longitude: 10.25)))
        XCTAssertFalse(feature.contains(CLLocationCoordinate2D(latitude: 50.9, longitude: 9.75)))
    }

    func test_boundingRegion_fitsAllCells_withMinimumSpan() {
        let heatmap = CommunityHeatmap(type: "FeatureCollection", features: [
            cell(lat: 48.0, lon: 8.0, props()), cell(lat: 53.5, lon: 13.5, props()),
        ])

        let region = heatmap.boundingRegion

        XCTAssertEqual(region?.center.latitude ?? 0, 51.0, accuracy: 0.001)
        XCTAssertEqual(region?.center.longitude ?? 0, 11.0, accuracy: 0.001)
        XCTAssertEqual(region?.span.latitudeDelta ?? 0, 6 * 1.4, accuracy: 0.001)

        let single = CommunityHeatmap(type: "FeatureCollection", features: [cell(lat: 51, lon: 9.5, props())])
        XCTAssertEqual(single.boundingRegion?.span.latitudeDelta ?? 0, 2, accuracy: 0.001)
        XCTAssertNil(CommunityHeatmap(type: "FeatureCollection", features: []).boundingRegion)
    }

    // MARK: - ViewModel

    func test_load_success_setsHeatmap() async {
        let heatmap = CommunityHeatmap(type: "FeatureCollection", features: [cell(lat: 51, lon: 9.5, props(varroa: 1))])
        let svc = MockCommunityHeatmapService(result: .success(heatmap))
        let vm = CommunityHeatmapViewModel(service: svc)

        await vm.load()

        XCTAssertEqual(vm.heatmap?.features.count, 1)
        XCTAssertNil(vm.errorMessage)
        XCTAssertFalse(vm.isLoading)
        XCTAssertEqual(vm.overlay, .varroa)
    }

    func test_load_failure_setsErrorMessage() async {
        let svc = MockCommunityHeatmapService(result: .failure(NSError(domain: "t", code: 403,
            userInfo: [NSLocalizedDescriptionKey: "Supporter required"])))
        let vm = CommunityHeatmapViewModel(service: svc)

        await vm.load()

        XCTAssertNil(vm.heatmap)
        XCTAssertEqual(vm.errorMessage, "Supporter required")
        XCTAssertFalse(vm.isLoading)
    }

    func test_selectAtCoordinate_picksTappedCell_andClearsOutside() async {
        let west = props(varroa: 1, apiaries: 4)
        let east = props(varroa: 6, apiaries: 2)
        let heatmap = CommunityHeatmap(type: "FeatureCollection", features: [
            cell(lat: 51, lon: 9.5, west), cell(lat: 51, lon: 10.0, east),
        ])
        let vm = CommunityHeatmapViewModel(service: MockCommunityHeatmapService(result: .success(heatmap)))
        await vm.load()

        vm.select(at: CLLocationCoordinate2D(latitude: 51.2, longitude: 10.3))
        XCTAssertEqual(vm.selected, east)

        vm.select(at: CLLocationCoordinate2D(latitude: 40, longitude: 0))
        XCTAssertNil(vm.selected)
    }
}
