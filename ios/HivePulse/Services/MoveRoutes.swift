import CoreLocation
import Foundation
import MapKit

/// The forage keys the clients offer. Anything else a beekeeper typed is shown as written.
enum Forage {
    static let keys = ["acacia", "rapeseed", "orchard", "dandelion", "linden", "chestnut", "fir", "heather", "sunflower", "lavender", "other"]

    static func isKnown(_ value: String?) -> Bool {
        guard let value else { return false }
        return keys.contains(value)
    }

    /// The forage as the user should read it: the translated name of a known key, or the text as written.
    static func label(for value: String) -> String {
        isKnown(value) ? NSLocalizedString("forage." + value, comment: "") : value
    }
}

struct MovePoint: Equatable {
    let latitude: Double
    let longitude: Double
    let name: String
    /// Day of the move that brought the hive here; the starting point has none.
    let date: String?
    let forage: String?
    /// 0 for the place the journey started, then 1, 2, ... in order.
    let order: Int

    var coordinate: CLLocationCoordinate2D { CLLocationCoordinate2D(latitude: latitude, longitude: longitude) }
}

struct MoveRoute: Identifiable, Equatable {
    let hiveId: String
    let hiveName: String
    let points: [MovePoint]
    /// Index into the palette, so two hives on one map get different lines.
    let colorIndex: Int

    var id: String { hiveId }
}

enum MoveRoutes {

    /// The journeys on the map: per hive, the place it started from followed by every place it was taken to,
    /// oldest first. A place without coordinates is skipped (the server could not find its address), but the
    /// numbering still counts it, so "stop 3" means the third move. The same rule as the website's.
    static func build(from moves: [HiveMoveOut]) -> [MoveRoute] {
        var order: [String] = []
        var byHive: [String: [HiveMoveOut]] = [:]
        for move in moves {
            if byHive[move.hiveId] == nil { order.append(move.hiveId) }
            byHive[move.hiveId, default: []].append(move)
        }

        return order.enumerated().map { index, hiveId in
            let ordered = byHive[hiveId]!.sorted { lhs, rhs in
                lhs.movedOn == rhs.movedOn ? lhs.createdAt < rhs.createdAt : lhs.movedOn < rhs.movedOn
            }
            var points: [MovePoint] = []
            let first = ordered[0].from
            if let lat = first.latitude, let lon = first.longitude {
                points.append(MovePoint(latitude: lat, longitude: lon, name: first.name, date: nil, forage: nil, order: 0))
            }
            for (i, move) in ordered.enumerated() {
                if let lat = move.to.latitude, let lon = move.to.longitude {
                    points.append(MovePoint(latitude: lat, longitude: lon, name: move.to.name,
                                            date: move.movedOn, forage: move.forage, order: i + 1))
                }
            }
            return MoveRoute(hiveId: hiveId, hiveName: ordered[0].hiveName, points: points, colorIndex: index)
        }
    }

    static func hasPositions(_ routes: [MoveRoute]) -> Bool {
        routes.contains { !$0.points.isEmpty }
    }

    /// A map region that holds every point with some room around it; nil when there is nothing to show.
    static func region(fitting routes: [MoveRoute]) -> MKCoordinateRegion? {
        let points = routes.flatMap(\.points)
        guard let first = points.first else { return nil }
        var minLat = first.latitude, maxLat = first.latitude
        var minLon = first.longitude, maxLon = first.longitude
        for point in points {
            minLat = min(minLat, point.latitude); maxLat = max(maxLat, point.latitude)
            minLon = min(minLon, point.longitude); maxLon = max(maxLon, point.longitude)
        }
        let center = CLLocationCoordinate2D(latitude: (minLat + maxLat) / 2, longitude: (minLon + maxLon) / 2)
        // A single place gets a street-level-ish view; several get their extent plus a margin.
        let span = MKCoordinateSpan(
            latitudeDelta: max((maxLat - minLat) * 1.4, 0.05),
            longitudeDelta: max((maxLon - minLon) * 1.4, 0.05)
        )
        return MKCoordinateRegion(center: center, span: span)
    }
}
