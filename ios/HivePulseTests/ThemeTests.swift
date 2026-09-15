import XCTest
import SwiftUI
@testable import HivePulse

final class ThemeTests: XCTestCase {

    func test_dmSansFontsAreBundledAndRegistered() {
        for weight in HPFontWeight.allCases {
            XCTAssertNotNil(
                UIFont(name: weight.postScriptName, size: 12),
                "\(weight.postScriptName) is not registered — check Resources/Fonts and UIAppFonts in Info.plist"
            )
        }
    }

    func test_brandColorsMatchDesignTokens() {
        XCTAssertEqual(rgb(.hpAmber), 0xF59E0B)
        XCTAssertEqual(rgb(.hpAmberDark), 0xD97706)
        XCTAssertEqual(rgb(.hpForest), 0x0F2D1C)
        XCTAssertEqual(rgb(.hpStone50), 0xFAFAF9)
        XCTAssertEqual(rgb(.hpStone200), 0xE7E5E4)
    }

    func test_appearanceFontUsesDmSansAtRequestedSize() {
        let font = HivePulseAppearance.uiFont(.bold, 17)
        XCTAssertEqual(font.fontName, "DMSans-Bold")
        XCTAssertEqual(font.pointSize, 17)
    }

    private func rgb(_ color: Color) -> UInt32 {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        UIColor(color).getRed(&r, green: &g, blue: &b, alpha: &a)
        return (UInt32((r * 255).rounded()) << 16) | (UInt32((g * 255).rounded()) << 8) | UInt32((b * 255).rounded())
    }
}
