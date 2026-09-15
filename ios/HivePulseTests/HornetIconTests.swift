import XCTest
import UIKit
@testable import HivePulse

final class HornetIconTests: XCTestCase {

    func test_image_isTintableTemplateOfRequestedSize() {
        let image = HornetIcon.image(pointSize: 48)

        XCTAssertEqual(image.renderingMode, .alwaysTemplate)
        XCTAssertEqual(image.size, CGSize(width: 48, height: 48))
        XCTAssertEqual(HornetIcon.tabImage.size, CGSize(width: 26, height: 26))
    }

    func test_image_drawsBodyAndLeavesCornersTransparent() {
        // 48pt so every sampled pixel lies fully inside the feature it checks (2 px per grid unit)
        let image = HornetIcon.image(pointSize: 48)

        XCTAssertGreaterThan(alpha(in: image, x: 12, y: 9), 0.9, "thorax should be opaque")
        XCTAssertGreaterThan(alpha(in: image, x: 12, y: 20.5), 0.9, "abdomen tip should be opaque")
        XCTAssertLessThan(alpha(in: image, x: 12, y: 16.1), 0.1, "stripe should be cut out of the abdomen")
        XCTAssertLessThan(alpha(in: image, x: 1, y: 22), 0.05, "corners stay transparent")
    }

    /// Alpha (0–1) of the pixel at a point in the 24-unit grid, sampled from a bitmap one pixel per point.
    private func alpha(in image: UIImage, x: CGFloat, y: CGFloat) -> CGFloat {
        let side = Int(image.size.width)
        var pixels = [UInt8](repeating: 0, count: side * side * 4)
        let context = CGContext(data: &pixels, width: side, height: side, bitsPerComponent: 8,
                                bytesPerRow: side * 4, space: CGColorSpaceCreateDeviceRGB(),
                                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        context.draw(image.cgImage!, in: CGRect(x: 0, y: 0, width: side, height: side))
        // CGContext's origin is bottom-left; convert the top-left grid coordinate.
        let px = min(side - 1, Int(x * CGFloat(side) / 24))
        let py = min(side - 1, Int(y * CGFloat(side) / 24))
        let row = side - 1 - py
        return CGFloat(pixels[(row * side + px) * 4 + 3]) / 255
    }
}
