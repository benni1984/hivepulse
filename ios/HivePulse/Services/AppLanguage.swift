import Foundation
import ObjectiveC

/// Lets the app speak a language other than the phone's, chosen in Settings.
///
/// Until this existed, the language picker only told the server which language to write
/// emails in. The interface itself followed the phone and nothing else, so somebody with an
/// English phone could not read HivePulse in German.
///
/// iOS offers no supported way to switch an app's language while it runs. Every string here
/// goes through `NSLocalizedString`, which asks `Bundle.main`, so the lookup is pointed at the
/// chosen language's `.lproj` instead. The views have to be rebuilt afterwards; the app root
/// does that by keying itself on the stored choice.
///
/// Only an explicit choice counts. The profile's locale is deliberately **not** applied
/// automatically: the UI tests and the store screenshots launch the app with
/// `-AppleLanguages`, and a profile that says "en" would silently override them.
enum AppLanguage {
    static let key = "appLanguageOverride"
    static let supported = ["en", "de", "fr", "es"]

    /// Call once at launch, before any view reads a string.
    static func applyStored(defaults: UserDefaults = .standard) {
        apply(defaults.string(forKey: key))
    }

    /// The beekeeper's choice from Settings. Unknown codes are ignored rather than stored,
    /// so a stray value can never leave the app looking for a folder that does not exist.
    static func choose(_ code: String, defaults: UserDefaults = .standard) {
        guard supported.contains(code) else { return }
        // Apply first: storing the choice is what makes the app root rebuild its views, and
        // they must read the new language when they do.
        apply(code)
        defaults.set(code, forKey: key)
    }

    /// Back to following the phone.
    static func reset(defaults: UserDefaults = .standard) {
        apply(nil)
        defaults.removeObject(forKey: key)
    }

    /// The `.lproj` bundle for a language, or nil when this build does not carry it.
    static func languageBundle(for code: String, in bundle: Bundle = .main) -> Bundle? {
        guard supported.contains(code),
              let path = bundle.path(forResource: code, ofType: "lproj") else { return nil }
        return Bundle(path: path)
    }

    static func apply(_ code: String?) {
        installOverride()
        let target = code.flatMap { languageBundle(for: $0) }
        objc_setAssociatedObject(Bundle.main, &associationKey, target, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }

    // MARK: - Redirecting Bundle.main

    private static var associationKey: UInt8 = 0
    private static var installed = false

    /// Swaps Bundle.main's class for a subclass that consults the chosen language first.
    /// Done once; with nothing chosen the subclass behaves exactly like Bundle.
    private static func installOverride() {
        guard !installed else { return }
        installed = true
        object_setClass(Bundle.main, OverridingBundle.self)
    }

    private final class OverridingBundle: Bundle {
        override func localizedString(forKey key: String, value: String?, table tableName: String?) -> String {
            if let target = objc_getAssociatedObject(self, &AppLanguage.associationKey) as? Bundle {
                return target.localizedString(forKey: key, value: value, table: tableName)
            }
            return super.localizedString(forKey: key, value: value, table: tableName)
        }
    }
}
