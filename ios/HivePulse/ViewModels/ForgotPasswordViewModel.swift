import Foundation

@MainActor
final class ForgotPasswordViewModel: ObservableObject {
    @Published var email: String
    @Published var isSending = false
    @Published var sent = false
    @Published var isOffline = false

    private let service: any PasswordResetRequesting

    init(email: String = "", service: any PasswordResetRequesting = AuthService()) {
        self.email = email
        self.service = service
    }

    var canSubmit: Bool {
        !isSending && email.trimmingCharacters(in: .whitespacesAndNewlines).contains("@")
    }

    /// Any server answer shows the same neutral confirmation (like the web), so the screen never reveals
    /// whether an address is registered. Only a missing connection is surfaced as an error.
    func submit() async {
        guard canSubmit else { return }
        isSending = true
        isOffline = false
        defer { isSending = false }
        do {
            try await service.requestPasswordReset(email: email.trimmingCharacters(in: .whitespacesAndNewlines))
            sent = true
        } catch APIError.network(_) {
            isOffline = true
        } catch {
            sent = true
        }
    }
}
