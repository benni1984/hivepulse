import XCTest
@testable import HivePulse

/// Signing in with Apple.
///
/// The decisions worth testing are the ones around Apple's framework, not inside it: what
/// reaches the server, what the user is told when it fails, and whether the button is
/// offered at all.
@MainActor
final class AppleSignInTests: XCTestCase {

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
