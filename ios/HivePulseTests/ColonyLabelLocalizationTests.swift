import XCTest
@testable import HivePulse

/// The third screen in this family, after `InspectionFormLocalizationTests` and
/// `HiveTypeLocalizationTests`: the inspection detail rendered the stored value with
/// `.capitalized`, so a German beekeeper read "Calm" and "White" in an otherwise German form.
/// The keys had been translated the whole time — nothing looked them up, which is precisely
/// what `check_i18n.py` cannot see: the strings are present, they are simply unused.
final class ColonyLabelLocalizationTests: XCTestCase {

    private let moods = ["calm", "nervous", "aggressive"]
    private let queenColors = ["white", "yellow", "red", "green", "blue"]
    private let locales = ["en", "de", "fr", "es", "pl"]

    private func bundle(_ locale: String) throws -> Bundle {
        let main = Bundle(for: AuthViewModel.self)
        let path = try XCTUnwrap(main.path(forResource: locale, ofType: "lproj"),
                                 "\(locale).lproj is missing from the bundle")
        return try XCTUnwrap(Bundle(path: path))
    }

    func test_everyMood_isTranslatedInEveryLocale() throws {
        try assertTranslated(keys: moods.map { "mood.\($0)" })
    }

    func test_everyQueenColor_isTranslatedInEveryLocale() throws {
        try assertTranslated(keys: queenColors.map { "queenColor.\($0)" })
    }

    func test_theGermanLabelsAreNotStillEnglish() throws {
        // The bug was invisible to a key-parity check, so assert on the words themselves.
        let german = try bundle("de")
        XCTAssertEqual(german.localizedString(forKey: "mood.calm", value: nil, table: nil), "Ruhig")
        XCTAssertEqual(german.localizedString(forKey: "queenColor.white", value: nil, table: nil), "Weiß")
    }

    func test_thePolishLabelsAreNotStillEnglish() throws {
        let polish = try bundle("pl")
        XCTAssertEqual(polish.localizedString(forKey: "mood.calm", value: nil, table: nil), "Spokojna")
        XCTAssertEqual(polish.localizedString(forKey: "queenColor.white", value: nil, table: nil), "Biały")
    }

    private func assertTranslated(keys: [String]) throws {
        for locale in locales {
            let bundle = try bundle(locale)
            for key in keys {
                let value = bundle.localizedString(forKey: key, value: "@@missing@@", table: nil)
                XCTAssertNotEqual(value, "@@missing@@", "\(key) is missing from \(locale).lproj")
                XCTAssertFalse(value.isEmpty, "\(key) is empty in \(locale).lproj")
            }
        }
    }
}
