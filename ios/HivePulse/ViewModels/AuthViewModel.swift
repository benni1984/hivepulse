import Foundation
import SwiftUI

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: UserOut?
    @Published var reminderSettings: ReminderSettingsOut?
    @Published var isLoading = false
    @Published var errorMessage: String?
    /// Shown once after the first successful sign-in or registration on this device (and on demand from Settings).
    @Published var showGuidedTour = false
    /// Whether the server accepts Sign in with Apple. The button stays hidden until it says
    /// yes, so it can never offer a sign-in that would be refused on arrival.
    @Published var appleSignInAvailable = false
    /// Google on the iPhone is about account continuity: somebody who signed in with Google
    /// on Android must reach the same account here. Without it, hiding their address behind
    /// Apple's relay would hand them a second, empty one.
    @Published var googleSignInAvailable = false
    /// False until the server has answered, or the wait ran out. "Not yet known" must not look
    /// like "none": the email form used to appear at once and fold away behind its link the
    /// moment a provider turned up, which showed as a flicker at every start.
    @Published var providersLoaded = false

    private let service: any AuthServiceProtocol
    private let onboarding: OnboardingStore

    init(service: any AuthServiceProtocol = AuthService(), onboarding: OnboardingStore = OnboardingStore()) {
        self.service = service
        self.onboarding = onboarding
        isAuthenticated = KeychainService.shared.accessToken != nil
    }

    func login(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let resp = try await service.login(email: email, password: password)
            store(resp)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func register(email: String, password: String, name: String, locale: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let resp = try await service.register(email: email, password: password, name: name, locale: locale)
            store(resp)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    /// Signs in with the identity token Apple handed the app.
    ///
    /// Takes the token and the name rather than Apple's credential object, so the decision
    /// this method makes can be tested without the framework that produces one.
    ///
    /// `fullName` arrives only on the very first authorization for this app — never again,
    /// and never inside the token. Passing it on is the only chance to learn what to call
    /// somebody.
    ///
    /// `authorizationCode` is Apple's one-time code from the same authorization. The server
    /// keeps the token it buys with it, so it can revoke it when the account is deleted.
    func signInWithApple(identityToken: String, fullName: String?,
                         authorizationCode: String? = nil) async {
        isLoading = true
        errorMessage = nil
        do {
            let resp = try await service.signInWithApple(
                idToken: identityToken, name: fullName, authorizationCode: authorizationCode)
            store(resp)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    /// Signs in with the identity token Google handed the app.
    ///
    /// No name is passed: Google puts it inside the token, so the server reads it there and
    /// the client has nothing to hand over. Apple is the exception, not the rule.
    func signInWithGoogle(identityToken: String) async {
        isLoading = true
        errorMessage = nil
        do {
            store(try await service.signInWithGoogle(idToken: identityToken))
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    /// Asks the server which sign-ins it accepts. Failure is silence: the password form is
    /// still there, and a button that cannot work is worse than no button.
    ///
    /// Bounded, because the login form waits for this: a server that never answers must not
    /// leave the only way in hidden. Whichever finishes first wins, the answer or the clock.
    func loadSignInProviders(timeout: UInt64 = 4_000_000_000) async {
        let service = self.service
        let providers: SignInProviders? = await withTaskGroup(of: SignInProviders?.self) { group in
            group.addTask { try? await service.signInProviders() }
            group.addTask {
                try? await Task.sleep(nanoseconds: timeout)
                return nil
            }
            let first = await group.next() ?? nil
            group.cancelAll()
            return first
        }
        appleSignInAvailable = providers?.apple != nil
        googleSignInAvailable = providers?.google != nil
        providersLoaded = true
    }

    func logout() async {
        if let refresh = KeychainService.shared.refreshToken {
            try? await service.logout(refreshToken: refresh)
        }
        KeychainService.shared.clearAll()
        // The next account on this device must not see the previous one's hives, and a
        // queued inspection could no longer be uploaded with the signed-out session.
        await OfflineInspectionQueue.shared.clear()
        OfflineStore.shared.clear()
        currentUser = nil
        isAuthenticated = false
        showGuidedTour = false
    }

    func loadProfile() async {
        do {
            currentUser = try await service.getMe()
        } catch {}
    }

    func updateProfile(name: String, locale: String) async {
        isLoading = true
        do {
            currentUser = try await service.updateMe(name: name, locale: locale)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func changePassword(currentPassword: String, newPassword: String) async {
        isLoading = true
        errorMessage = nil
        do {
            currentUser = try await service.changePassword(currentPassword: currentPassword, newPassword: newPassword)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func deleteAccount() async {
        isLoading = true
        errorMessage = nil
        do {
            try await service.deleteMe()
            KeychainService.shared.clearAll()
            currentUser = nil
            isAuthenticated = false
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func loadReminderSettings() async {
        do {
            reminderSettings = try await service.getReminderSettings()
        } catch {
            // Non-fatal — reminder settings are best-effort
        }
    }

    func updateReminderSettings(_ update: ReminderSettingsUpdate) async {
        isLoading = true
        errorMessage = nil
        do {
            reminderSettings = try await service.updateReminderSettings(update)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func registerAPNsToken(_ tokenData: Data) async {
        let tokenString = tokenData.map { String(format: "%02x", $0) }.joined()
        do {
            try await service.registerPushToken(platform: "ios", token: tokenString)
        } catch {
            // Non-fatal — push token registration is best-effort
        }
    }

    func finishGuidedTour() {
        onboarding.hasSeenGuidedTour = true
        showGuidedTour = false
    }

    func replayGuidedTour() {
        showGuidedTour = true
    }

    private func store(_ resp: TokenResponse) {
        KeychainService.shared.accessToken  = resp.accessToken
        KeychainService.shared.refreshToken = resp.refreshToken
        currentUser = resp.user
        isAuthenticated = true
        showGuidedTour = !onboarding.hasSeenGuidedTour
        UserDefaults.standard.set(resp.user.locale, forKey: "appLocale")
    }
}
