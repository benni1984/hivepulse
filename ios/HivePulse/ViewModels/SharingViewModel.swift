import Foundation

/// The owner's view of who works on one apiary or hive, and the invitations still open.
@MainActor
final class SharingViewModel: ObservableObject {
    @Published var shares: [ShareOut] = []
    @Published var isLoading = false
    @Published var isInviting = false
    @Published var errorMessage: String?
    /// Set after an invitation went out, so the screen can say so.
    @Published var inviteSent = false

    let target: ShareTargetKind
    private let service: any SharingServiceProtocol

    init(target: ShareTargetKind, service: any SharingServiceProtocol = SharingService()) {
        self.target = target
        self.service = service
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            shares = try await service.shares(for: target)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Whether the address is worth sending: the server checks properly, this only spares an obvious typo a round trip.
    static func looksLikeAnEmail(_ text: String) -> Bool {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let at = trimmed.firstIndex(of: "@") else { return false }
        let domain = trimmed[trimmed.index(after: at)...]
        return trimmed.first != "@" && domain.contains(".") && !domain.hasSuffix(".") && !trimmed.contains(" ")
    }

    func invite(email: String) async -> Bool {
        let address = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard Self.looksLikeAnEmail(address), !isInviting else { return false }
        isInviting = true
        errorMessage = nil
        inviteSent = false
        defer { isInviting = false }
        do {
            let share = try await service.invite(email: address, to: target)
            shares.insert(share, at: 0)
            inviteSent = true
            return true
        } catch {
            // The server words the reason (already invited, your own address, …) in the user's language.
            errorMessage = error.localizedDescription
            return false
        }
    }

    func remove(_ share: ShareOut) async {
        errorMessage = nil
        do {
            try await service.remove(share.id)
            shares.removeAll { $0.id == share.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

/// Invitations addressed to the signed-in person, with accept and decline.
@MainActor
final class InvitationsViewModel: ObservableObject {
    @Published var invitations: [IncomingShareOut] = []
    @Published var errorMessage: String?

    private let service: any SharingServiceProtocol

    init(service: any SharingServiceProtocol = SharingService()) {
        self.service = service
    }

    func load() async {
        // The list of apiaries is usable without this; a failure here must not look like an error on it.
        invitations = (try? await service.incoming()) ?? []
    }

    /// Returns true when the invitation was accepted, so the caller can reload what became visible.
    func accept(_ invitation: IncomingShareOut) async -> Bool {
        errorMessage = nil
        do {
            try await service.accept(invitation.id)
            invitations.removeAll { $0.id == invitation.id }
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    /// Takes an invitation from the link in its email (or the bare token). True when the server accepted it.
    func redeem(_ pasted: String) async -> Bool {
        errorMessage = nil
        guard let token = InvitationLink.token(from: pasted) else {
            errorMessage = NSLocalizedString("invitation.invalidLink", comment: "")
            return false
        }
        do {
            _ = try await service.acceptByToken(token)
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func decline(_ invitation: IncomingShareOut) async {
        errorMessage = nil
        do {
            try await service.decline(invitation.id)
            invitations.removeAll { $0.id == invitation.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
