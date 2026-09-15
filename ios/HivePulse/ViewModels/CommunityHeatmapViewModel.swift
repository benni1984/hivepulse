import Foundation
import CoreLocation

enum HeatmapOverlay: String, CaseIterable, Identifiable {
    case varroa, mood, swarm, brood
    var id: String { rawValue }

    /// Legend buckets — swarm has no "no data" entry because `swarm_pct` is never null.
    var legendLevels: [HeatLevel] {
        self == .swarm ? [.good, .fair, .poor] : HeatLevel.allCases
    }
}

/// Traffic-light bucket for one heatmap cell. Thresholds mirror the web `CommunityMap` and Android.
enum HeatLevel: CaseIterable {
    case good, fair, poor, noData
}

extension CommunityHeatmapProperties {
    func level(for overlay: HeatmapOverlay) -> HeatLevel {
        switch overlay {
        case .varroa:
            guard let v = avgVarroa else { return .noData }
            return v < 2 ? .good : v < 5 ? .fair : .poor
        case .mood:
            guard let m = moodScore else { return .noData }
            return m >= 70 ? .good : m >= 40 ? .fair : .poor
        case .swarm:
            return swarmPct < 10 ? .good : swarmPct < 30 ? .fair : .poor
        case .brood:
            guard let b = avgBrood else { return .noData }
            return b >= 5 ? .good : b >= 3 ? .fair : .poor
        }
    }
}

extension CommunityHeatmapFeature {
    /// Outer ring as map coordinates (GeoJSON stores `[longitude, latitude]`).
    var ring: [CLLocationCoordinate2D] {
        (geometry.coordinates.first ?? []).compactMap { point in
            point.count >= 2 ? CLLocationCoordinate2D(latitude: point[1], longitude: point[0]) : nil
        }
    }

    /// Ray-casting point-in-polygon test on the outer ring.
    func contains(_ coordinate: CLLocationCoordinate2D) -> Bool {
        let points = ring
        guard points.count >= 3 else { return false }
        var inside = false
        var j = points.count - 1
        for i in points.indices {
            let a = points[i], b = points[j]
            if (a.latitude > coordinate.latitude) != (b.latitude > coordinate.latitude),
               coordinate.longitude < (b.longitude - a.longitude) * (coordinate.latitude - a.latitude)
                                      / (b.latitude - a.latitude) + a.longitude {
                inside.toggle()
            }
            j = i
        }
        return inside
    }
}

/// Narrow seam so the heatmap view model can be tested without the network.
protocol CommunityHeatmapProviding {
    func communityHeatmap() async throws -> CommunityHeatmap
}

extension StatsService: CommunityHeatmapProviding {
    func communityHeatmap() async throws -> CommunityHeatmap {
        try await APIClient.shared.get("stats/community-heatmap")
    }
}

/// Members-only regional health map — iOS counterpart of the web `CommunityMap` and Android `CommunityHeatmapSection`.
@MainActor
final class CommunityHeatmapViewModel: ObservableObject {
    @Published var heatmap: CommunityHeatmap?
    @Published var overlay: HeatmapOverlay = .varroa
    @Published var selected: CommunityHeatmapProperties?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let service: any CommunityHeatmapProviding

    init(service: any CommunityHeatmapProviding = StatsService()) {
        self.service = service
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            heatmap = try await service.communityHeatmap()
            selected = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Selects the cell under a tapped map coordinate; tapping outside every cell clears the selection.
    func select(at coordinate: CLLocationCoordinate2D) {
        selected = heatmap?.features.first { $0.contains(coordinate) }?.properties
    }
}
