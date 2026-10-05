import AuthenticationServices
import SwiftUI

/// Apple's own sign-in button, wired to the backend.
///
/// The button itself must be Apple's — the system draws it, and the App Store rejects
/// imitations. All this adds is what happens afterwards.
struct AppleSignInButton: View {
    @EnvironmentObject var authVM: AuthViewModel

    var body: some View {
        SignInWithAppleButton(.continue) { request in
            // The name arrives only because it is asked for here, and only the first time.
            request.requestedScopes = [.fullName, .email]
        } onCompletion: { result in
            switch result {
            case .success(let authorization):
                handle(authorization)
            case .failure(let error):
                // Closing the sheet is a decision, not a failure; saying "sign-in failed"
                // to somebody who changed their mind is noise.
                if (error as? ASAuthorizationError)?.code == .canceled { return }
                authVM.errorMessage = error.localizedDescription
            }
        }
        .signInWithAppleButtonStyle(.black)
        .frame(height: 48)
        .accessibilityIdentifier("appleSignInButton")
    }

    private func handle(_ authorization: ASAuthorization) {
        guard
            let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
            let tokenData = credential.identityToken,
            let token = String(data: tokenData, encoding: .utf8)
        else {
            authVM.errorMessage = NSLocalizedString("error.appleSignIn", comment: "")
            return
        }
        let name = Self.displayName(from: credential.fullName)
        Task { await authVM.signInWithApple(identityToken: token, fullName: name) }
    }

    /// Apple hands the name over in pieces, and only during the very first authorization for
    /// this app — never again, and never inside the token. Whatever is not passed on now is
    /// lost for good, which is why an empty result becomes nil rather than an empty name.
    static func displayName(from components: PersonNameComponents?) -> String? {
        guard let components else { return nil }
        let formatted = PersonNameComponentsFormatter
            .localizedString(from: components, style: .default)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return formatted.isEmpty ? nil : formatted
    }
}
