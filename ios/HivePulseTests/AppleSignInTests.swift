import XCTest
@testable import HivePulse

/// Signing in with Apple.
///
/// The decisions worth testing are the ones around Apple's framework, not inside it: what
/// reaches the server, what the user is told when it fails, and whether the button is
/// offered at all.
@MainActor
final class AppleSignInTests: XCTestCase {

    // A successful sign-in writes its token to the real keychain, and the next view model
    // reads it back in init — so without this, every test after a success starts out signed
    // in, and "a refused token leaves nobody signed in" fails for a reason that has nothing
    // to do with the token. AuthViewModelTests does the same.
    override func setUp() {
        super.setUp()
        KeychainService.shared.clearAll()
    }

    override func tearDown() {
        KeychainService.shared.clearAll()
        super.tearDown()
    }

    private func makeViewModel() -> (AuthViewModel, MockAuthService) {
        // The same shape the rest of the suite uses: default onboarding store, mock service.
        let service = MockAuthService()
        return (AuthViewModel(service: service), service)
    }

    private func tokenResponse() -> TokenResponse {
        // makeUser is the suite's own helper; building a UserOut by hand here would mean
        // repeating a field order that is easy to get wrong and only CI would catch.
        TokenResponse(accessToken: "access", refreshToken: "refresh", user: makeUser())
    }

    // MARK: - Signing in

    func test_aSuccessfulSignInAuthenticates() async {
        let (viewModel, service) = makeViewModel()
        service.socialResult = .success(tokenResponse())

        await viewModel.signInWithApple(identityToken: "a.token", fullName: "Ada Imkerin")

        XCTAssertTrue(viewModel.isAuthenticated)
        XCTAssertNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isLoading)
    }

    func test_theNameIsPassedOnBecauseAppleSendsItOnlyOnce() async {
        let (viewModel, service) = makeViewModel()
        service.socialResult = .success(tokenResponse())

        await viewModel.signInWithApple(identityToken: "a.token", fullName: "Grete Imkerin")

        // Apple delivers the name in the first authorization and never again. Dropping it
        // here means never learning what to call this person.
        XCTAssertEqual(service.lastSocialName, "Grete Imkerin")
    }

    func test_aRefusedTokenLeavesTheUserSignedOutAndSaysSo() async {
        let (viewModel, service) = makeViewModel()
        service.socialResult = .failure(APIError.unauthorized)

        await viewModel.signInWithApple(identityToken: "forged", fullName: nil)

        XCTAssertFalse(viewModel.isAuthenticated)
        XCTAssertNotNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isLoading, "the spinner must stop even when the server says no")
    }

    // MARK: - Whether to offer the button at all

    func test_theButtonIsOfferedWhenTheServerAcceptsApple() async {
        let (viewModel, service) = makeViewModel()
        service.providersResult = .success(
            SignInProviders(google: nil, apple: SignInProvider(clientId: "com.hivepulse.app"))
        )

        await viewModel.loadSignInProviders()

        XCTAssertTrue(viewModel.appleSignInAvailable)
    }

    func test_theButtonStaysHiddenWhenTheServerDoesNotAcceptApple() async {
        let (viewModel, service) = makeViewModel()
        service.providersResult = .success(SignInProviders(google: nil, apple: nil))

        await viewModel.loadSignInProviders()

        // Offering a sign-in the server would refuse on arrival is worse than offering none.
        XCTAssertFalse(viewModel.appleSignInAvailable)
    }

    func test_aServerThatCannotBeAskedHidesTheButtonAndSaysNothing() async {
        let (viewModel, service) = makeViewModel()
        service.providersResult = .failure(APIError.unauthorized)

        await viewModel.loadSignInProviders()

        XCTAssertFalse(viewModel.appleSignInAvailable)
        // No error banner: the password form is still there, and nothing has gone wrong yet.
        XCTAssertNil(viewModel.errorMessage)
    }

    // MARK: - The name Apple hands over

    func test_theNameIsAssembledFromApplesPieces() {
        var components = PersonNameComponents()
        components.givenName = "Ada"
        components.familyName = "Imkerin"

        XCTAssertEqual(AppleSignInButton.displayName(from: components), "Ada Imkerin")
    }

    func test_noNameIsNilRatherThanEmpty() {
        // Every sign-in after the first carries no name at all. An empty string would
        // overwrite a perfectly good name with nothing.
        XCTAssertNil(AppleSignInButton.displayName(from: nil))
        XCTAssertNil(AppleSignInButton.displayName(from: PersonNameComponents()))
    }

    // MARK: - "Not yet known" is not "none"

    func test_beforeTheServerAnswersTheProvidersAreNotYetKnown() {
        let (viewModel, _) = makeViewModel()

        // The email form used to appear at once and fold away the moment a provider turned up:
        // a flicker at every start.
        XCTAssertFalse(viewModel.providersLoaded)
    }

    func test_anAnswerWithAProviderMarksTheLookupDone() async {
        let (viewModel, service) = makeViewModel()
        service.providersResult = .success(
            SignInProviders(google: nil, apple: SignInProvider(clientId: "com.hivepulse.app"))
        )

        await viewModel.loadSignInProviders()

        XCTAssertTrue(viewModel.providersLoaded)
        XCTAssertTrue(viewModel.appleSignInAvailable)
    }

    func test_anAnswerWithoutAProviderAlsoMarksItDoneSoTheFormCanAppear() async {
        let (viewModel, service) = makeViewModel()
        service.providersResult = .success(SignInProviders(google: nil, apple: nil))

        await viewModel.loadSignInProviders()

        XCTAssertTrue(viewModel.providersLoaded)
        XCTAssertFalse(viewModel.appleSignInAvailable)
    }

    func test_aFailedLookupAlsoMarksItDone() async {
        let (viewModel, service) = makeViewModel()
        service.providersResult = .failure(APIError.unauthorized)

        await viewModel.loadSignInProviders()

        // A server that cannot be asked must not hide the only way in.
        XCTAssertTrue(viewModel.providersLoaded)
        XCTAssertFalse(viewModel.appleSignInAvailable)
    }

    func test_aServerThatNeverAnswersStopsBlockingTheFormAfterTheWait() async {
        let (viewModel, service) = makeViewModel()
        service.providersDelayNanos = 5_000_000_000   // five seconds, against a wait of 50 ms
        service.providersResult = .success(
            SignInProviders(google: nil, apple: SignInProvider(clientId: "com.hivepulse.app"))
        )

        let started = Date()
        await viewModel.loadSignInProviders(timeout: 50_000_000)

        XCTAssertTrue(viewModel.providersLoaded)
        // The slow answer must not have been waited for, and must not have been used.
        XCTAssertLessThan(Date().timeIntervalSince(started), 2)
        XCTAssertFalse(viewModel.appleSignInAvailable)
    }

    // MARK: - Google, for the sake of one account across two phones

    func test_aGoogleSignInAuthenticates() async {
        let (viewModel, service) = makeViewModel()
        service.socialResult = .success(tokenResponse())

        await viewModel.signInWithGoogle(identityToken: "g.token")

        XCTAssertTrue(viewModel.isAuthenticated)
        XCTAssertNil(viewModel.errorMessage)
    }

    func test_aRefusedGoogleTokenSaysSo() async {
        let (viewModel, service) = makeViewModel()
        service.socialResult = .failure(APIError.unauthorized)

        await viewModel.signInWithGoogle(identityToken: "forged")

        XCTAssertFalse(viewModel.isAuthenticated)
        XCTAssertNotNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isLoading)
    }

    func test_bothButtonsFollowWhatTheServerAccepts() async {
        let (viewModel, service) = makeViewModel()
        service.providersResult = .success(SignInProviders(
            google: SignInProvider(clientId: "web-id"),
            apple: SignInProvider(clientId: "com.hivepulse.app")
        ))

        await viewModel.loadSignInProviders()

        XCTAssertTrue(viewModel.appleSignInAvailable)
        XCTAssertTrue(viewModel.googleSignInAvailable)
    }

    func test_onlyTheProviderTheServerAcceptsIsOffered() async {
        let (viewModel, service) = makeViewModel()
        service.providersResult = .success(
            SignInProviders(google: nil, apple: SignInProvider(clientId: "com.hivepulse.app"))
        )

        await viewModel.loadSignInProviders()

        XCTAssertTrue(viewModel.appleSignInAvailable)
        XCTAssertFalse(viewModel.googleSignInAvailable)
    }

}
