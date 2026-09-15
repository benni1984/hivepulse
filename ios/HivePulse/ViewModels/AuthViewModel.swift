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

    func logout() async {
        if let refresh = KeychainService.shared.refreshToken {
            try? await service.logout(refreshToken: refresh)
        }
        KeychainService.shared.clearAll()
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
