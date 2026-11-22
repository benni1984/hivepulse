import MapKit
import XCTest
@testable import HivePulse

/// Where the hornet map points (#555).
///
/// The map itself opened at 47.0 / 2.0 with an eight-degree span — the middle of France — and
/// never moved again, not even to the nests it was drawing. These are the three answers that
/// replaced it, in order: the beekeeper, then the nests, then a wide view nobody should see.
final class HornetMapRegionTests: XCTestCase {

    private func nest(lat: Double, lon: Double) -> HornetNestFeature {
        // GeoJSON is [longitude, latitude], which is the wrong way round from how anybody says
        // it, and the kind of thing that puts a nest in the Indian Ocean.
        HornetNestFeature(
            type: "Feature",
            geometry: HornetNestGeometry(type: "Point", coordinates: [lon, lat]),
            properties: HornetNestProperties(
                id: UUID().uuidString, status: "found", reporterName: nil, notes: nil,
                photoUrl: nil, createdAt: "2026-01-01T00:00:00")
        )
    }

    func test_noNestsMeansNoRegionToFit() {
        XCTAssertNil(HornetMapRegion.around([]))
    }

    func test_oneNestIsNotShownAtAZoomWhereTheMapIsOneGreenSquare() {
        let region = HornetMapRegion.around([nest(lat: 51.05, lon: 13.74)])

        XCTAssertEqual(region?.center.latitude ?? 0, 51.05, accuracy: 0.0001)
        XCTAssertEqual(region?.center.longitude ?? 0, 13.74, accuracy: 0.0001)
        // Zero extent must not become a zero span.
        XCTAssertEqual(region?.span.latitudeDelta ?? 0,
                       HornetMapRegion.nearbySpan.latitudeDelta, accuracy: 0.0001)
    }

    func test_severalNestsAreCentredBetweenThemWithRoomAtTheEdges() {
        let region = HornetMapRegion.around([
            nest(lat: 50.0, lon: 12.0),
            nest(lat: 52.0, lon: 14.0),
        ])

        XCTAssertEqual(region?.center.latitude ?? 0, 51.0, accuracy: 0.0001)
        XCTAssertEqual(region?.center.longitude ?? 0, 13.0, accuracy: 0.0001)
        // 2 degrees of nests in 2.8 degrees of map: the outermost pins are not on the edge.
        XCTAssertEqual(region?.span.latitudeDelta ?? 0, 2.8, accuracy: 0.0001)
        XCTAssertEqual(region?.span.longitudeDelta ?? 0, 2.8, accuracy: 0.0001)
    }

    func test_latitudeAndLongitudeAreNotSwapped() {
        // The one mistake this file exists to catch: a nest near Dresden belongs at 51 north
        // and 13 east, not at 13 north and 51 east, which is the Arabian Sea.
        let region = HornetMapRegion.around([nest(lat: 51.05, lon: 13.74)])

        XCTAssertGreaterThan(region?.center.latitude ?? 0, 50)
        XCTAssertLessThan(region?.center.longitude ?? 0, 20)
    }

    func test_theBeekeeperGetsAVillageSizedView() {
        let here = CLLocationCoordinate2D(latitude: 47.45, longitude: 7.8)

        let region = HornetMapRegion.forBeekeeper(at: here)

        XCTAssertEqual(region.center.latitude, 47.45, accuracy: 0.0001)
        XCTAssertEqual(region.span.latitudeDelta, HornetMapRegion.nearbySpan.latitudeDelta,
                       accuracy: 0.0001)
        XCTAssertLessThan(region.span.latitudeDelta, 1,
                          "a region a degree wide is a country, not a neighbourhood")
    }

    func test_theFallbackIsStillAMapOfWhereTheseBeesLive() {
        // Not France. The wide view is only ever reached when there is nothing else to go on,
        // and it should at least be centred on the languages the app is translated into.
        XCTAssertGreaterThan(HornetMapRegion.wideEurope.center.latitude, 40)
        XCTAssertLessThan(HornetMapRegion.wideEurope.center.latitude, 60)
        XCTAssertGreaterThan(HornetMapRegion.wideEurope.span.latitudeDelta, 5,
                             "a fallback that is zoomed in is a fallback that hides everything")
    }
}
