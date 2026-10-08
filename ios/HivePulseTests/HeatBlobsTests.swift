import XCTest
import CoreLocation
@testable import HivePulse

final class HeatBlobsTests: XCTestCase {

    /// A cell as a closed ring of map coordinates.
    private func cell(minLon: Double, minLat: Double, maxLon: Double, maxLat: Double) -> [CLLocationCoordinate2D] {
        [
            CLLocationCoordinate2D(latitude: minLat, longitude: minLon),
            CLLocationCoordinate2D(latitude: minLat, longitude: maxLon),
            CLLocationCoordinate2D(latitude: maxLat, longitude: maxLon),
            CLLocationCoordinate2D(latitude: maxLat, longitude: minLon),
            CLLocationCoordinate2D(latitude: minLat, longitude: minLon),
        ]
    }

    func test_putsThePatchInTheMiddleOfTheCell() throws {
        let blob = try XCTUnwrap(HeatBlobs.blob(for: cell(minLon: 8, minLat: 50, maxLon: 8.5, maxLat: 50.5)))
        XCTAssertEqual(blob.center.latitude, 50.25, accuracy: 1e-9)
        XCTAssertEqual(blob.center.longitude, 8.25, accuracy: 1e-9)
    }

    func test_reachesALittleBeyondTheCell_soNeighboursBlend() throws {
        // 0.5 degrees of latitude is about 55.7 km; the patch is three quarters of the larger side.
        let blob = try XCTUnwrap(HeatBlobs.blob(for: cell(minLon: 0, minLat: 0, maxLon: 0.5, maxLat: 0.5)))
        XCTAssertGreaterThan(blob.radius, 55_000 * 0.7)
        XCTAssertLessThan(blob.radius, 55_700 * 0.8)
    }

    func test_measuresTheWidthInKilometres_whichShrinkTowardsThePole() throws {
        let equator = try XCTUnwrap(HeatBlobs.blob(for: cell(minLon: 0, minLat: 0, maxLon: 2, maxLat: 1)))
        let north = try XCTUnwrap(HeatBlobs.blob(for: cell(minLon: 0, minLat: 70, maxLon: 2, maxLat: 71)))
        XCTAssertLessThan(north.radius, equator.radius)
    }

    func test_hasNothingToDrawForAnEmptyOrBrokenRing() {
        XCTAssertNil(HeatBlobs.blob(for: []))
        XCTAssertNil(HeatBlobs.blob(for: [CLLocationCoordinate2D(latitude: .nan, longitude: 1)]))
    }

    func test_fades_eachCircleIsSmallerThanTheOneBelow_andTheLayersStayFaint() {
        let scales = HeatBlobs.rings.map(\.scale)
        XCTAssertEqual(scales, scales.sorted(by: >))
        XCTAssertEqual(scales.count, 8)
        XCTAssertEqual(scales.first, 1)
        XCTAssertTrue(HeatBlobs.rings.allSatisfy { $0.opacity > 0 && $0.opacity < 0.2 })
    }

    func test_tapTargetIsSmallerThanThePatch_butCoversItsColouredMiddle() {
        XCTAssertLessThan(HeatBlobs.hitScale, 1)
        XCTAssertGreaterThan(HeatBlobs.hitScale, HeatBlobs.rings.last!.scale)
    }

    func test_isHit_middleYes_cornerAndFarAwayNo() throws {
        let blob = try XCTUnwrap(HeatBlobs.blob(for: cell(minLon: 9.5, minLat: 51, maxLon: 10, maxLat: 51.5)))
        XCTAssertTrue(blob.isHit(by: CLLocationCoordinate2D(latitude: 51.25, longitude: 9.75)))
        // The corner of the square cell lies outside the round tap target.
        XCTAssertFalse(blob.isHit(by: CLLocationCoordinate2D(latitude: 51.499, longitude: 9.501)))
        XCTAssertFalse(blob.isHit(by: CLLocationCoordinate2D(latitude: 40, longitude: 0)))
    }
}
