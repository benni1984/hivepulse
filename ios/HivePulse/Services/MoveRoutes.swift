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

/// A way back: the place some of the hives stood before they came to this apiary, and which hives those are.
struct ReturnSuggestion: Equatable, Identifiable {
    let apiaryId: String
    let name: String
    let hiveIds: [String]

    var id: String { apiaryId }
}

enum MoveRoutes {

    /// "Back to where they came from": for the hives standing in `apiaryId`, the place each one was taken from
    /// when it came here, grouped by that place. A hive that never moved here, or whose previous place is gone
    /// or not among `places` (not the caller's own), is left out: there is nowhere to send it back to.
    /// The same rule as the website's.
    static func returnSuggestions(moves: [HiveMoveOut], hiveIds: [String], apiaryId: String,
                                  places: [(id: String, name: String)]) -> [ReturnSuggestion] {
        let here = Set(hiveIds)
        var latest: [String: HiveMoveOut] = [:]
        for move in moves where here.contains(move.hiveId) && move.to.apiaryId == apiaryId {
            if let seen = latest[move.hiveId] {
                let newer = move.movedOn > seen.movedOn || (move.movedOn == seen.movedOn && move.createdAt > seen.createdAt)
                if !newer { continue }
            }
            latest[move.hiveId] = move
        }

        var byPlace: [String: [String]] = [:]
        for hiveId in hiveIds {
            guard let from = latest[hiveId]?.from.apiaryId, from != apiaryId,
                  places.contains(where: { $0.id == from }) else { continue }
            byPlace[from, default: []].append(hiveId)
        }
        return byPlace
            .map { id, ids in ReturnSuggestion(apiaryId: id, name: places.first { $0.id == id }!.name, hiveIds: ids) }
            .sorted { $0.hiveIds.count != $1.hiveIds.count ? $0.hiveIds.count > $1.hiveIds.count : $0.name < $1.name }
    }

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
