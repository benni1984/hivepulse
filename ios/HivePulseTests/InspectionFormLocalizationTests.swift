import XCTest
@testable import HivePulse

/// Regression: the mood and queen-colour pickers rendered the raw API value (`m.capitalized`), so a
/// German user saw "Calm / Nervous / Aggressive" in an otherwise translated form. There were no
/// `mood.*` or `queenColor.*` keys in any locale at all, so nothing could have translated them.
final class InspectionFormLocalizationTests: XCTestCase {

    private let moods = ["calm", "nervous", "aggressive"]
    private let queenColors = ["white", "yellow", "red", "green", "blue"]

    private func bundle(_ locale: String) throws -> Bundle {
        let main = Bundle(for: AuthViewModel.self)
        let path = try XCTUnwrap(main.path(forResource: locale, ofType: "lproj"),
                                "\(locale).lproj is missing from the bundle")
        return try XCTUnwrap(Bundle(path: path))
    }

    func test_pickerValues_areTranslatedInEveryLocale() throws {
        for locale in ["en", "de", "fr", "es"] {
            let b = try bundle(locale)
            for key in moods.map({ "mood.\($0)" }) + queenColors.map({ "queenColor.\($0)" }) {
                let value = b.localizedString(forKey: key, value: "@@missing@@", table: nil)
                XCTAssertNotEqual(value, "@@missing@@", "\(key) is not translated in \(locale)")
                XCTAssertFalse(value.isEmpty, "\(key) is empty in \(locale)")
            }
        }
    }

    func test_germanMoods_areActuallyGerman() throws {
        let de = try bundle("de")
        XCTAssertEqual(de.localizedString(forKey: "mood.calm", value: nil, table: nil), "Ruhig")
        XCTAssertEqual(de.localizedString(forKey: "mood.aggressive", value: nil, table: nil), "Aggressiv")
        XCTAssertEqual(de.localizedString(forKey: "queenColor.white", value: nil, table: nil), "Weiß")
    }

    // MARK: - Weight stepper

    func test_steppedWeight_startsFromZeroWhenEmpty() {
        XCTAssertEqual(InspectionFormView.steppedWeight(from: "", by: 0.5), "0.5")
    }

    func test_steppedWeight_dropsTheDecimalOnWholeNumbers() {
        XCTAssertEqual(InspectionFormView.steppedWeight(from: "1.5", by: 0.5), "2")
    }

    func test_steppedWeight_acceptsACommaDecimalSeparator() {
        XCTAssertEqual(InspectionFormView.steppedWeight(from: "2,5", by: 0.5), "3")
    }

    func test_steppedWeight_neverGoesNegative() {
        XCTAssertEqual(InspectionFormView.steppedWeight(from: "0.5", by: -0.5), "0")
        XCTAssertEqual(InspectionFormView.steppedWeight(from: "0", by: -0.5), "0")
    }
}
