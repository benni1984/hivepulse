import SwiftUI
import MapKit

/// Regional health map for supporters/admins: coloured 0.5° cells over Apple Maps, overlay chips, legend and cell details.
struct CommunityHeatmapSection: View {
    @ObservedObject var vm: CommunityHeatmapViewModel

    @State private var camera: MapCameraPosition = .region(MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 51.0, longitude: 10.0),
        span: MKCoordinateSpan(latitudeDelta: 16, longitudeDelta: 16)
    ))

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(NSLocalizedString("heatmap.title", comment: ""))
                .font(.dmSans(18, weight: .bold, relativeTo: .headline))
                .foregroundColor(.hpStone900)

            if let heatmap = vm.heatmap, !heatmap.features.isEmpty {
                overlayPicker
                map(heatmap)
                legend
                if let cell = vm.selected {
                    details(cell)
                } else {
                    Text(NSLocalizedString("heatmap.hint", comment: ""))
                        .font(.dmSans(13, relativeTo: .footnote))
                        .foregroundColor(.hpStone500)
                }
            } else if vm.isLoading {
                ProgressView().frame(maxWidth: .infinity)
            } else {
                Text(NSLocalizedString("heatmap.empty", comment: ""))
                    .font(.dmSans(15, relativeTo: .subheadline))
                    .foregroundColor(.hpStone500)
            }
        }
        .hpCard()
    }

    // MARK: - Parts

    private var overlayPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(HeatmapOverlay.allCases) { overlay in
                    let isSelected = overlay == vm.overlay
                    Button {
                        vm.overlay = overlay
                    } label: {
                        Text(overlay.title)
                            .font(.dmSans(14, weight: .medium, relativeTo: .subheadline))
                            .foregroundColor(.hpStone900)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 7)
                            .background(isSelected ? Color.hpAmber : Color.white)
                            .clipShape(Capsule())
                            .overlay(Capsule().stroke(isSelected ? Color.hpAmber : Color.hpStone200, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(isSelected ? .isSelected : [])
                }
            }
        }
    }

    private func map(_ heatmap: CommunityHeatmap) -> some View {
        MapReader { proxy in
            Map(position: $camera, interactionModes: [.pan, .zoom]) {
                ForEach(heatmap.features.indices, id: \.self) { index in
                    let feature = heatmap.features[index]
                    MapPolygon(coordinates: feature.ring)
                        .foregroundStyle(feature.properties.level(for: vm.overlay).color(for: vm.overlay).opacity(0.65))
                        .stroke(.white, lineWidth: 1)
                }
            }
            .onTapGesture { point in
                if let coordinate = proxy.convert(point, from: .local) {
                    vm.select(at: coordinate)
                }
            }
        }
        .frame(height: 320)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .accessibilityIdentifier("communityHeatmapMap")
        .task(id: heatmap.features.count) {
            if let region = heatmap.boundingRegion { camera = .region(region) }
        }
    }

    private var legend: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), alignment: .leading)], alignment: .leading, spacing: 6) {
            ForEach(vm.overlay.legendLevels, id: \.self) { level in
                HStack(spacing: 6) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(level.color(for: vm.overlay))
                        .frame(width: 12, height: 12)
                    Text(level.legendTitle(for: vm.overlay))
                        .font(.dmSans(13, relativeTo: .footnote))
                        .foregroundColor(.hpStone500)
                }
            }
        }
    }

    private func details(_ cell: CommunityHeatmapProperties) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(String(format: NSLocalizedString("heatmap.cellSummary", comment: ""), cell.apiaryCount, cell.inspectionCount))
                .font(.dmSans(15, weight: .bold, relativeTo: .subheadline))
                .foregroundColor(.hpStone900)
            detailRow("heatmap.cell.varroa", cell.avgVarroa.map { String(format: "%.1f", $0) } ?? "—")
            detailRow("heatmap.cell.mood", cell.moodScore.map { "\(Int($0.rounded()))%" } ?? "—")
            detailRow("heatmap.cell.brood", cell.avgBrood.map { String(format: "%.1f", $0) } ?? "—")
            detailRow("heatmap.cell.swarm", "\(Int(cell.swarmPct.rounded()))%")
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.hpStone50)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .accessibilityIdentifier("heatmapCellDetails")
    }

    private func detailRow(_ key: String, _ value: String) -> some View {
        HStack {
            Text(NSLocalizedString(key, comment: ""))
                .foregroundColor(.hpStone500)
            Spacer()
            Text(value)
                .foregroundColor(.hpStone900)
        }
        .font(.dmSans(14, relativeTo: .subheadline))
    }
}

// MARK: - Labels & colours

extension HeatmapOverlay {
    var title: String {
        NSLocalizedString("heatmap.overlay.\(rawValue)", comment: "")
    }
}

extension HeatLevel {
    /// Web palette: green / amber / red / grey (brood "strong" uses the darker green, as on web).
    func color(for overlay: HeatmapOverlay) -> Color {
        switch self {
        case .good:   return overlay == .brood ? Color(hex: 0x16A34A) : Color(hex: 0x22C55E)
        case .fair:   return Color(hex: 0xF59E0B)
        case .poor:   return Color(hex: 0xEF4444)
        case .noData: return Color(hex: 0x9CA3AF)
        }
    }

    func legendTitle(for overlay: HeatmapOverlay) -> String {
        let suffix: String
        switch (self, overlay) {
        case (.noData, _):       return NSLocalizedString("heatmap.noData", comment: "")
        case (.good, .varroa):   suffix = "varroa.low"
        case (.fair, .varroa):   suffix = "varroa.medium"
        case (.poor, .varroa):   suffix = "varroa.high"
        case (.good, .mood):     suffix = "mood.good"
        case (.fair, .mood):     suffix = "mood.fair"
        case (.poor, .mood):     suffix = "mood.low"
        case (.good, .swarm):    suffix = "swarm.low"
        case (.fair, .swarm):    suffix = "swarm.medium"
        case (.poor, .swarm):    suffix = "swarm.high"
        case (.good, .brood):    suffix = "brood.strong"
        case (.fair, .brood):    suffix = "brood.fair"
        case (.poor, .brood):    suffix = "brood.low"
        }
        return NSLocalizedString("heatmap.\(suffix)", comment: "")
    }
}
