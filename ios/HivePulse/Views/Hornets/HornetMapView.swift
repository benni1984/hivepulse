import SwiftUI
import MapKit

struct HornetMapView: View {
    @EnvironmentObject var vm: HornetViewModel

    var body: some View {
        Group {
            if vm.isLoading && vm.nests == nil {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let geoJSON = vm.nests {
                MapContent(features: geoJSON.features)
            } else {
                ContentUnavailableView(
                    NSLocalizedString("hornets.map.noNests", comment: ""),
                    systemImage: "map",
                    description: Text(NSLocalizedString("hornets.map.hint", comment: ""))
                )
            }
        }
        .task { await vm.loadNests() }
    }
}

/// Where the hornet map points, worked out without a map (#555).
///
/// Its own type because `MapContent` is private and this arithmetic is the half of the screen a
/// test can reach: no simulator, no MapKit view, no location permission.
enum HornetMapRegion {
    /// Most of western Europe, and the view nobody should ever actually see: what is left when
    /// the device will not say where it is and nobody has reported a nest anywhere.
    ///
    /// It used to be the *only* view. The map opened at 47.0/2.0 with an eight-degree span —
    /// the middle of France — and never moved again, not even to the nests it was drawing, so a
    /// beekeeper in Saxony opened the hornet map and looked at Bourges.
    static let wideEurope = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 50.0, longitude: 9.0),
        span: MKCoordinateSpan(latitudeDelta: 16, longitudeDelta: 16)
    )

    /// Close enough to tell one village from the next.
    static let nearbySpan = MKCoordinateSpan(latitudeDelta: 0.12, longitudeDelta: 0.12)

    /// The region that holds every reported nest, or nil when there are none.
    static func around(_ features: [HornetNestFeature]) -> MKCoordinateRegion? {
        let points = features.map {
            CLLocationCoordinate2D(latitude: $0.geometry.coordinates[1],
                                   longitude: $0.geometry.coordinates[0])
        }
        guard let first = points.first else { return nil }

        var minLat = first.latitude, maxLat = first.latitude
        var minLon = first.longitude, maxLon = first.longitude
        for point in points.dropFirst() {
            minLat = min(minLat, point.latitude);  maxLat = max(maxLat, point.latitude)
            minLon = min(minLon, point.longitude); maxLon = max(maxLon, point.longitude)
        }

        let center = CLLocationCoordinate2D(latitude: (minLat + maxLat) / 2,
                                            longitude: (minLon + maxLon) / 2)
        // A floor on the span, or a single nest fills the screen at a zoom where the map is one
        // green square; the 1.4 keeps the outermost pins off the edge.
        return MKCoordinateRegion(
            center: center,
            span: MKCoordinateSpan(
                latitudeDelta: max((maxLat - minLat) * 1.4, nearbySpan.latitudeDelta),
                longitudeDelta: max((maxLon - minLon) * 1.4, nearbySpan.longitudeDelta)
            )
        )
    }

    /// Where to point once the device has answered. `nil` means it did not.
    static func forBeekeeper(at location: CLLocationCoordinate2D) -> MKCoordinateRegion {
        MKCoordinateRegion(center: location, span: nearbySpan)
    }
}

private struct MapContent: View {
    let features: [HornetNestFeature]

    @State private var position: MapCameraPosition = .region(HornetMapRegion.wideEurope)
    private let locator = OneTimeLocator()

    var body: some View {
        Map(position: $position) {
            ForEach(features, id: \.properties.id) { feature in
                let coord = CLLocationCoordinate2D(
                    latitude: feature.geometry.coordinates[1],
                    longitude: feature.geometry.coordinates[0]
                )
                Annotation(
                    feature.properties.notes ?? feature.properties.status,
                    coordinate: coord
                ) {
                    NestPin(status: feature.properties.status)
                }
            }
        }
        .overlay(alignment: .bottomLeading) {
            MapLegend()
                .padding(12)
        }
        .task {
            // The nests first, so the map is right the moment it is drawn, and the beekeeper
            // second, because the fix takes a moment and must not hold the screen.
            if let fitted = HornetMapRegion.around(features) {
                position = .region(fitted)
            }
            // Only if permission is already there: a prompt that appears because somebody
            // opened a map is a prompt they refuse, and the refusal would also cost the report
            // form, where the location is the point.
            if let here = await locator.locateIfAlreadyAllowed() {
                position = .region(HornetMapRegion.forBeekeeper(at: here.coordinate))
            }
        }
    }
}

private struct NestPin: View {
    let status: String

    var color: Color {
        switch status {
        case "destruction_ordered": return .yellow
        case "destroyed":           return .green
        default:                    return .red
        }
    }

    var body: some View {
        ZStack {
            Circle()
                .fill(color)
                .frame(width: 20, height: 20)
            Image(systemName: "ant.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 10, height: 10)
                .foregroundColor(.white)
        }
    }
}

private struct MapLegend: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            LegendRow(color: .red,    label: NSLocalizedString("hornets.map.status.found", comment: ""))
            LegendRow(color: .yellow, label: NSLocalizedString("hornets.map.status.ordered", comment: ""))
            LegendRow(color: .green,  label: NSLocalizedString("hornets.map.status.destroyed", comment: ""))
        }
        .padding(10)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 10))
    }
}

private struct LegendRow: View {
    let color: Color
    let label: String

    var body: some View {
        HStack(spacing: 6) {
            Circle().fill(color).frame(width: 12, height: 12)
            Text(label).font(.caption)
        }
    }
}
