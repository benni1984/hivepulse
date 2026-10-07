import XCTest
@testable import HivePulse

/// The language picker used to change the profile and nothing else: the interface followed the
/// phone, so somebody with an English phone could not read HivePulse in German.
final class AppLanguageTests: XCTestCase {

    private var defaults: UserDefaults!
    private let suite = "AppLanguageTests"

    override func setUp() {
        super.setUp()
        defaults = UserDefaults(suiteName: suite)
        defaults.removePersistentDomain(forName: suite)
    }

    override func tearDown() {
        // Bundle.main is process-wide; leaving a language applied would leak into every test
        // that runs afterwards.
        AppLanguage.apply(nil)
        defaults.removePersistentDomain(forName: suite)
        super.tearDown()
    }

    // MARK: - What the picker shows

    func test_thePickerStartsOnTheChosenLanguage() {
        AppLanguage.choose("fr", defaults: defaults)

        XCTAssertEqual(AppLanguage.effective(profileLocale: "en", defaults: defaults, phoneLanguages: ["de"]), "fr")
    }

    func test_withoutAChoiceThePickerFollowsThePhoneNotTheProfile() {
        // A German phone, and an account that still says English because nobody ever picked a language.
        XCTAssertEqual(AppLanguage.effective(profileLocale: "en", defaults: defaults, phoneLanguages: ["de-DE", "en-US"]), "de")
    }

    func test_aPhoneLanguageTheAppDoesNotHaveFallsBackToTheProfile() {
        XCTAssertEqual(AppLanguage.effective(profileLocale: "es", defaults: defaults, phoneLanguages: ["it-IT"]), "es")
        XCTAssertEqual(AppLanguage.effective(profileLocale: nil, defaults: defaults, phoneLanguages: ["it-IT"]), "en")
    }

    // MARK: - What is stored

    func test_aChoiceIsRemembered() {
        AppLanguage.choose("de", defaults: defaults)

        XCTAssertEqual(defaults.string(forKey: AppLanguage.key), "de")
    }

    func test_anUnknownLanguageIsNeitherStoredNorApplied() {
        AppLanguage.choose("tlh", defaults: defaults)

        // Otherwise the app would look for a folder that does not exist on every launch.
        XCTAssertNil(defaults.string(forKey: AppLanguage.key))
    }

    func test_resetGoesBackToFollowingThePhone() {
        AppLanguage.choose("fr", defaults: defaults)

        AppLanguage.reset(defaults: defaults)

        XCTAssertNil(defaults.string(forKey: AppLanguage.key))
    }

    func test_theStoredChoiceIsAppliedAtLaunch() throws {
        defaults.set("de", forKey: AppLanguage.key)
        let german = try XCTUnwrap(AppLanguage.languageBundle(for: "de", in: appBundle))

        AppLanguage.applyStored(defaults: defaults)

        XCTAssertEqual(
            NSLocalizedString("action.login", comment: ""),
            german.localizedString(forKey: "action.login", value: nil, table: nil)
        )
    }

    // MARK: - What it does to the strings

    func test_everySupportedLanguageHasItsFolderInTheBuild() {
        for code in AppLanguage.supported {
            XCTAssertNotNil(AppLanguage.languageBundle(for: code, in: appBundle),
                            "\(code).lproj is missing — choosing it would show English")
        }
    }

    func test_choosingGermanChangesWhatTheAppSays() throws {
        let german = try XCTUnwrap(AppLanguage.languageBundle(for: "de", in: appBundle))
        let english = try XCTUnwrap(AppLanguage.languageBundle(for: "en", in: appBundle))
        let germanLogin = german.localizedString(forKey: "action.login", value: nil, table: nil)
        let englishLogin = english.localizedString(forKey: "action.login", value: nil, table: nil)
        try XCTSkipIf(germanLogin == englishLogin, "the test needs two languages that differ")

        AppLanguage.choose("de", defaults: defaults)
        XCTAssertEqual(NSLocalizedString("action.login", comment: ""), germanLogin)

        AppLanguage.choose("en", defaults: defaults)
        XCTAssertEqual(NSLocalizedString("action.login", comment: ""), englishLogin)
    }

    func test_resettingRestoresTheLookup() throws {
        let german = try XCTUnwrap(AppLanguage.languageBundle(for: "de", in: appBundle))
        let germanLogin = german.localizedString(forKey: "action.login", value: nil, table: nil)
        let before = NSLocalizedString("action.login", comment: "")
        try XCTSkipIf(before == germanLogin, "the phone is already German; nothing to tell apart")

        AppLanguage.choose("de", defaults: defaults)
        AppLanguage.reset(defaults: defaults)

        XCTAssertEqual(NSLocalizedString("action.login", comment: ""), before)
    }

    /// The app's own bundle, which is where the .lproj folders live.
    private var appBundle: Bundle { Bundle(for: AuthViewModel.self) }
}
