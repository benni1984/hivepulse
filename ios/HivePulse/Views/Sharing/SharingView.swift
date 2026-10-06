import SwiftUI

/// Who works on an apiary or a hive together with its owner, and the form to invite somebody.
/// Reached from the toolbar of the owner only: a collaborator cannot invite, list or remove anybody.
struct SharingView: View {
    @StateObject private var vm: SharingViewModel
    private let isHive: Bool
    @State private var email = ""
    @State private var shareToRemove: ShareOut?

    init(target: ShareTargetKind, isHive: Bool) {
        _vm = StateObject(wrappedValue: SharingViewModel(target: target))
        self.isHive = isHive
    }

    var body: some View {
        List {
            Section {
                TextField(NSLocalizedString("sharing.emailLabel", comment: ""), text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .accessibilityIdentifier("shareEmailField")
                Button {
                    Task { if await vm.invite(email: email) { email = "" } }
                } label: {
                    HStack {
                        if vm.isInviting { ProgressView() }
                        Text(NSLocalizedString("sharing.invite", comment: ""))
                    }
                }
                .disabled(vm.isInviting || !SharingViewModel.looksLikeAnEmail(email))
                .accessibilityIdentifier("inviteButton")
            } footer: {
                Text(NSLocalizedString(isHive ? "sharing.introHive" : "sharing.introApiary", comment: ""))
            }

            if vm.inviteSent {
                Section {
                    Label(NSLocalizedString("sharing.inviteSent", comment: ""), systemImage: "paperplane")
                        .foregroundColor(.hpGreen)
                }
            }

            Section {
                if vm.shares.isEmpty && !vm.isLoading {
                    Text(NSLocalizedString("sharing.empty", comment: "")).foregroundColor(.secondary)
                }
                ForEach(vm.shares) { share in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(share.collaboratorName ?? share.email)
                            .font(.dmSans(16, weight: .bold, relativeTo: .headline))
                        if share.collaboratorName != nil {
                            Text(share.email).font(.caption).foregroundColor(.secondary)
                        }
                        Text(NSLocalizedString(share.status == "accepted" ? "sharing.accepted" : "sharing.pending", comment: ""))
                            .font(.caption)
                            .foregroundColor(share.status == "accepted" ? .hpGreen : .secondary)
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        Button(role: .destructive) {
                            shareToRemove = share
                        } label: {
                            Label(NSLocalizedString(share.status == "accepted" ? "sharing.revoke" : "sharing.withdraw", comment: ""),
                                  systemImage: "person.badge.minus")
                        }
                    }
                }
            } header: {
                Text(NSLocalizedString("sharing.title", comment: ""))
            }
        }
        .navigationTitle(NSLocalizedString("sharing.title", comment: ""))
        .hpScreenBackground()
        .task { await vm.load() }
        .refreshable { await vm.load() }
        .confirmationDialog(
            NSLocalizedString(shareToRemove?.status == "accepted" ? "sharing.confirmRevoke" : "sharing.confirmWithdraw", comment: ""),
            isPresented: Binding(get: { shareToRemove != nil }, set: { if !$0 { shareToRemove = nil } }),
            titleVisibility: .visible
        ) {
            Button(NSLocalizedString("action.delete", comment: ""), role: .destructive) {
                if let share = shareToRemove { Task { await vm.remove(share) } }
                shareToRemove = nil
            }
            Button(NSLocalizedString("action.cancel", comment: ""), role: .cancel) { shareToRemove = nil }
        }
        .alert(NSLocalizedString("alert.error", comment: ""), isPresented: Binding(
            get: { vm.errorMessage != nil },
            set: { if !$0 { vm.errorMessage = nil } }
        )) {
            Button("OK", role: .cancel) { vm.errorMessage = nil }
        } message: {
            Text(vm.errorMessage ?? "")
        }
    }
}

/// Invitations waiting for the signed-in person, shown at the top of the apiary list.
struct InvitationsSection: View {
    @ObservedObject var vm: InvitationsViewModel
    /// Called after an invitation was accepted, so the list can show what just became visible.
    let onAccepted: () async -> Void

    var body: some View {
        ForEach(vm.invitations) { invitation in
            VStack(alignment: .leading, spacing: 10) {
                Text(text(for: invitation))
                    .font(.dmSans(15, relativeTo: .body))
                HStack(spacing: 12) {
                    Button(NSLocalizedString("invitation.accept", comment: "")) {
                        Task { if await vm.accept(invitation) { await onAccepted() } }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.hpAmber)
                    .accessibilityIdentifier("acceptInvitationButton")
                    Button(NSLocalizedString("invitation.decline", comment: ""), role: .cancel) {
                        Task { await vm.decline(invitation) }
                    }
                    .buttonStyle(.bordered)
                }
            }
            .padding(.vertical, 4)
        }
    }

    private func text(for invitation: IncomingShareOut) -> String {
        if invitation.target.type == "apiary" {
            return String(format: NSLocalizedString("invitation.apiary", comment: ""),
                          invitation.ownerName, invitation.target.name)
        }
        return String(format: NSLocalizedString("invitation.hive", comment: ""),
                      invitation.ownerName, invitation.target.name, invitation.apiaryName ?? "")
    }
}
