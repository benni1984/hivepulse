import Foundation
import CoreLocation

/// The regional health map draws each grid cell as a soft round patch instead of a hard rectangle: a few circles of
/// the same colour, growing in size and each only faintly opaque, so the colour is strongest in the middle and
/// fades out towards the edge. Where neighbouring patches meet, their colours blend like a real heat map.
///
/// Web (`lib/heatBlobs.ts`) and Android (`HeatBlobs.kt`) use the same numbers.
enum HeatBlobs {
    struct Blob: Equatable {
        let center: CLLocationCoordinate2D
        /// Radius of the outermost circle, in metres.
        let radius: CLLocationDistance

        static func == (a: Blob, b: Blob) -> Bool {
            a.center.latitude == b.center.latitude && a.center.longitude == b.center.longitude && a.radius == b.radius
        }
    }

    /// One circle of the stack: its size as a share of the outer radius, and the opacity it adds.
    struct Ring: Equatable {
        let scale: Double
        let opacity: Double
    }

    /// Eight faint layers, largest first, adding up to about 0.57 opacity in the middle.
    static let rings: [Ring] = [1, 0.88, 0.76, 0.64, 0.52, 0.4, 0.28, 0.16].map { Ring(scale: $0, opacity: 0.09) }

    private static let metresPerDegree = 111_320.0

    /// Centre and outer radius for a cell given as a ring of map coordinates, or nil if it has none.
    static func blob(for ring: [CLLocationCoordinate2D]) -> Blob? {
        let points = ring.filter { $0.latitude.isFinite && $0.longitude.isFinite }
        guard let minLat = points.map(\.latitude).min(), let maxLat = points.map(\.latitude).max(),
              let minLon = points.map(\.longitude).min(), let maxLon = points.map(\.longitude).max() else { return nil }

        let lat = (minLat + maxLat) / 2
        let lon = (minLon + maxLon) / 2
        let height = (maxLat - minLat) * metresPerDegree
        let width = (maxLon - minLon) * metresPerDegree * cos(lat * .pi / 180)
        // A little more than half the cell, so that neighbouring patches overlap and blend.
        return Blob(center: CLLocationCoordinate2D(latitude: lat, longitude: lon), radius: max(height, width) * 0.75)
    }
}
