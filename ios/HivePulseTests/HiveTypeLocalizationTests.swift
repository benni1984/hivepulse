import XCTest
@testable import HivePulse

/// Same class of bug as `InspectionFormLocalizationTests`, one form further along: the hive type
/// picker rendered the stored value with `capitalized`, so a German user chose between
/// "Langstroth", "Dadant", "Top Bar", "Warre" and "Other" in an otherwise German form. The web
/// app was worse and showed `top_bar` verbatim.
final class HiveTypeLocalizationTests: XCTestCase {

    private let hiveTypes = ["langstroth", "dadant", "top_bar", "warre", "other"]

    private func bundle(_ locale: String) throws -> Bundle {
        let main = Bundle(for: AuthViewModel.self)
        let path = try XCTUnwrap(main.path(forResource: locale, ofType: "lproj"),
                                "\(locale).lproj is missing from the bundle")
        return try XCTUnwrap(Bundle(path: path))
    }

    func test_everyHiveType_isTranslatedInEveryLocale() throws {
        for locale in ["en", "de", "fr", "es"] {
            let b = try bundle(locale)
            for type in hiveTypes {
                let key = "hiveType.\(type)"
                let value = b.localizedString(forKey: key, value: "@@missing@@", table: nil)
                XCTAssertNotEqual(value, "@@missing@@", "\(key) is not translated in \(locale)")
                XCTAssertFalse(value.isEmpty, "\(key) is empty in \(locale)")
                XCTAssertFalse(value.contains("_"), "\(key) in \(locale) still looks like a raw value: \(value)")
            }
        }
    }

    func test_theDescriptiveOnes_areTranslated_theNamesAreNot() throws {
        // Langstroth, Dadant and Warré are the people who designed those hives.
        for locale in ["en", "de", "fr", "es"] {
            let b = try bundle(locale)
            XCTAssertEqual(b.localizedString(forKey: "hiveType.langstroth", value: nil, table: nil), "Langstroth")
            XCTAssertEqual(b.localizedString(forKey: "hiveType.dadant", value: nil, table: nil), "Dadant")
            XCTAssertEqual(b.localizedString(forKey: "hiveType.warre", value: nil, table: nil), "Warré")
        }

        let de = try bundle("de")
        XCTAssertEqual(de.localizedString(forKey: "hiveType.top_bar", value: nil, table: nil), "Oberträgerbeute")
        XCTAssertEqual(de.localizedString(forKey: "hiveType.other", value: nil, table: nil), "Andere")

        let en = try bundle("en")
        XCTAssertNotEqual(de.localizedString(forKey: "hiveType.other", value: nil, table: nil),
                          en.localizedString(forKey: "hiveType.other", value: nil, table: nil))
    }
}
