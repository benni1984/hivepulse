import SwiftUI
import UIKit

// MARK: - Palette
//
// Design tokens from hivepulse-redesign/bundle.html — the same values Android uses in ui/theme/Color.kt.

extension Color {
    static let hpAmber      = Color(hex: 0xF59E0B)   // primary CTA, active states, "Pulse" wordmark
    static let hpAmberDark  = Color(hex: 0xD97706)   // pressed state; amber text/icons on light backgrounds
    static let hpAmberLight = Color(hex: 0xFDE68A)
    static let hpForest     = Color(hex: 0x0F2D1C)   // tab bar background
    static let hpGreen      = Color(hex: 0x16A34A)
    static let hpStone50    = Color(hex: 0xFAFAF9)   // page background
    static let hpStone100   = Color(hex: 0xF5F5F4)
    static let hpStone200   = Color(hex: 0xE7E5E4)   // card borders
    static let hpStone500   = Color(hex: 0x78716C)   // secondary text
    static let hpStone900   = Color(hex: 0x1C1917)   // primary text
    static let hpRed        = Color(hex: 0xEF4444)

    init(hex: UInt32, opacity: Double = 1) {
        self.init(
            .sRGB,
            red:   Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue:  Double(hex & 0xFF) / 255,
            opacity: opacity
        )
    }
}

// MARK: - Typography (DM Sans, bundled in Resources/Fonts and registered via UIAppFonts)

enum HPFontWeight: String, CaseIterable {
    case regular   = "DMSans-Regular"
    case medium    = "DMSans-Medium"
    case bold      = "DMSans-Bold"
    case extraBold = "DMSans-ExtraBold"

    var postScriptName: String { rawValue }

    var uiWeight: UIFont.Weight {
        switch self {
        case .regular:   return .regular
        case .medium:    return .medium
        case .bold:      return .bold
        case .extraBold: return .heavy
        }
    }
}

extension Font {
    /// DM Sans that still scales with Dynamic Type relative to `style`.
    static func dmSans(_ size: CGFloat, weight: HPFontWeight = .regular, relativeTo style: Font.TextStyle = .body) -> Font {
        .custom(weight.postScriptName, size: size, relativeTo: style)
    }
}

// MARK: - UIKit appearance (navigation + tab bars)

enum HivePulseAppearance {
    static func apply() {
        let nav = UINavigationBarAppearance()
        nav.configureWithOpaqueBackground()
        nav.backgroundColor = UIColor(Color.hpStone50)
        nav.shadowColor = UIColor(Color.hpStone200)
        nav.largeTitleTextAttributes = [
            .font: uiFont(.extraBold, 32),
            .foregroundColor: UIColor(Color.hpStone900),
        ]
        nav.titleTextAttributes = [
            .font: uiFont(.bold, 17),
            .foregroundColor: UIColor(Color.hpStone900),
        ]
        UINavigationBar.appearance().standardAppearance = nav
        UINavigationBar.appearance().compactAppearance = nav
        UINavigationBar.appearance().scrollEdgeAppearance = nav

        let tab = UITabBarAppearance()
        tab.configureWithOpaqueBackground()
        tab.backgroundColor = UIColor(Color.hpForest)
        tab.shadowColor = .clear
        let unselected = UIColor.white.withAlphaComponent(0.7)
        let selected = UIColor(Color.hpAmber)
        for item in [tab.stackedLayoutAppearance, tab.inlineLayoutAppearance, tab.compactInlineLayoutAppearance] {
            item.normal.iconColor = unselected
            item.normal.titleTextAttributes = [.foregroundColor: unselected, .font: uiFont(.medium, 10)]
            item.selected.iconColor = selected
            item.selected.titleTextAttributes = [.foregroundColor: selected, .font: uiFont(.bold, 10)]
        }
        UITabBar.appearance().standardAppearance = tab
        UITabBar.appearance().scrollEdgeAppearance = tab
    }

    static func uiFont(_ weight: HPFontWeight, _ size: CGFloat) -> UIFont {
        UIFont(name: weight.postScriptName, size: size) ?? .systemFont(ofSize: size, weight: weight.uiWeight)
    }
}
