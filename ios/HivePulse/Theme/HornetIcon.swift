import UIKit

/// Custom hornet glyph — SF Symbols only offer ants and ladybugs, which read as beetles.
/// Drawn on a 24×24 grid with the same geometry as Android's `ic_hornet.xml`, and returned as a template
/// image so tab bars and `.foregroundColor` can tint it.
enum HornetIcon {
    /// Tab bar size, matching SF Symbols in a tab item.
    static let tabImage = image(pointSize: 26)

    static func image(pointSize: CGFloat) -> UIImage {
        let size = CGSize(width: pointSize, height: pointSize)
        let image = UIGraphicsImageRenderer(size: size).image { context in
            context.cgContext.scaleBy(x: pointSize / 24, y: pointSize / 24)

            // Wings — translucent so they read as wings rather than legs
            UIColor.black.withAlphaComponent(0.6).setFill()
            for wing in wings {
                ellipse(cx: wing.cx, cy: wing.cy, rx: wing.rx, ry: wing.ry, degrees: wing.degrees).fill()
            }

            UIColor.black.setFill()
            UIColor.black.setStroke()

            // Antennae
            let antennae = UIBezierPath()
            antennae.move(to: CGPoint(x: 10.7, y: 3.3))
            antennae.addQuadCurve(to: CGPoint(x: 8, y: 1), controlPoint: CGPoint(x: 9.5, y: 1.8))
            antennae.move(to: CGPoint(x: 13.3, y: 3.3))
            antennae.addQuadCurve(to: CGPoint(x: 16, y: 1), controlPoint: CGPoint(x: 14.5, y: 1.8))
            antennae.lineWidth = 1.4
            antennae.lineCapStyle = .round
            antennae.stroke()

            // Head, thorax, waist
            ellipse(cx: 12, cy: 4.9, rx: 2.2, ry: 2.2).fill()
            ellipse(cx: 12, cy: 9.3, rx: 3.1, ry: 2.7).fill()
            ellipse(cx: 12, cy: 12.6, rx: 1.25, ry: 1).fill()

            // Abdomen with two stripes cut out
            let abdomen = UIBezierPath()
            abdomen.move(to: CGPoint(x: 12, y: 13.1))
            abdomen.addCurve(to: CGPoint(x: 16.1, y: 17.6), controlPoint1: CGPoint(x: 14.8, y: 13.1), controlPoint2: CGPoint(x: 16.1, y: 15.6))
            abdomen.addCurve(to: CGPoint(x: 12, y: 21.6), controlPoint1: CGPoint(x: 16.1, y: 20), controlPoint2: CGPoint(x: 14.4, y: 21.6))
            abdomen.addCurve(to: CGPoint(x: 7.9, y: 17.6), controlPoint1: CGPoint(x: 9.6, y: 21.6), controlPoint2: CGPoint(x: 7.9, y: 20))
            abdomen.addCurve(to: CGPoint(x: 12, y: 13.1), controlPoint1: CGPoint(x: 7.9, y: 15.6), controlPoint2: CGPoint(x: 9.2, y: 13.1))
            abdomen.close()
            abdomen.append(UIBezierPath(rect: CGRect(x: 8.7, y: 15.4, width: 6.6, height: 1.4)))
            abdomen.append(UIBezierPath(rect: CGRect(x: 8.6, y: 18.2, width: 6.8, height: 1.3)))
            abdomen.usesEvenOddFillRule = true
            abdomen.fill()

            // Stinger
            let stinger = UIBezierPath()
            stinger.move(to: CGPoint(x: 10.9, y: 21.3))
            stinger.addLine(to: CGPoint(x: 13.1, y: 21.3))
            stinger.addLine(to: CGPoint(x: 12, y: 23.5))
            stinger.close()
            stinger.fill()
        }
        return image.withRenderingMode(.alwaysTemplate)
    }

    private static let wings: [(cx: CGFloat, cy: CGFloat, rx: CGFloat, ry: CGFloat, degrees: CGFloat)] = [
        (6.2, 8.2, 5.2, 2.1, -25), (17.8, 8.2, 5.2, 2.1, 25),
        (7, 11.4, 3.7, 1.4, -10), (17, 11.4, 3.7, 1.4, 10),
    ]

    private static func ellipse(cx: CGFloat, cy: CGFloat, rx: CGFloat, ry: CGFloat, degrees: CGFloat = 0) -> UIBezierPath {
        let path = UIBezierPath(ovalIn: CGRect(x: -rx, y: -ry, width: rx * 2, height: ry * 2))
        path.apply(CGAffineTransform(rotationAngle: degrees * .pi / 180).concatenating(CGAffineTransform(translationX: cx, y: cy)))
        return path
    }
}
