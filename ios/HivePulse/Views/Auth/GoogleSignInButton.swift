import GoogleSignIn
import SwiftUI

/// Sign in with Google on the iPhone.
///
/// Here for account continuity rather than choice: somebody who signed in with Google on an
/// Android phone has to reach the *same* account on an iPhone. Offering only Apple would
/// hand them a second, empty one as soon as they hid their address behind Apple's relay.
struct GoogleSignInButton: View {
    @EnvironmentObject var authVM: AuthViewModel

    var body: some View {
        Button(action: signIn) {
            HStack(spacing: 10) {
                Image(systemName: "g.circle.fill")
                    .font(.system(size: 18))
                Text(NSLocalizedString("action.continueWithGoogle", comment: ""))
                    .font(.dmSans(16, weight: .medium, relativeTo: .body))
            }
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .foregroundColor(.hpStone900)
            .background(Color.white)
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(Color.hpStone200, lineWidth: 1)
            )
        }
        .accessibilityIdentifier("googleSignInButton")
    }

    private func signIn() {
        guard let presenter = Self.topViewController() else {
            authVM.errorMessage = NSLocalizedString("error.googleSignIn", comment: "")
            return
        }
        Task {
            do {
                let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presenter)
                guard let token = result.user.idToken?.tokenString else {
                    authVM.errorMessage = NSLocalizedString("error.googleSignIn", comment: "")
                    return
                }
                await authVM.signInWithGoogle(identityToken: token)
            } catch {
                // Dismissing Google's sheet is a decision, not a failure worth a banner.
                if (error as NSError).code == GIDSignInError.canceled.rawValue { return }
                authVM.errorMessage = error.localizedDescription
            }
        }
    }

    /// Google needs a view controller to present from, and SwiftUI has none to offer.
    static func topViewController() -> UIViewController? {
        let scene = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }
        var top = scene?.windows.first { $0.isKeyWindow }?.rootViewController
        while let presented = top?.presentedViewController {
            top = presented
        }
        return top
    }
}
