import SwiftUI

struct ApiaryListView: View {
    @EnvironmentObject var apiaryVM: ApiaryViewModel
    @StateObject private var invitationsVM = InvitationsViewModel()
    @StateObject private var homeVM = HomeSummaryViewModel()
    @State private var showCreate = false
    /// Asked once, three days in (#546). `false` until the store has been read in `.task`, so
    /// the card never flashes at somebody who has already answered.
    @State private var askForFeedback = false
    /// One store, not one per call: both the question and the answer read the same preferences,
    /// and two instances would be two chances to disagree about which key holds what.
    private let onboarding = OnboardingStore()
    @State private var showRedeem = false
    @State private var pastedLink = ""

    /// Invitations to an existing account just show up above the list. A link is only needed for one made to an
    /// address that had no account and who signed up with a password; the website takes the link by itself.
    private var redeemInvitationButton: some View {
        Button { showRedeem = true } label: {
            Text(NSLocalizedString("invitation.redeemTitle", comment: ""))
                .font(.dmSans(15, weight: .medium, relativeTo: .subheadline))
                .foregroundColor(.hpAmberDark)
                // A tap target, not a line of prose: this used to be a footnote wedged into a
                // few points between the floating button and the tab bar (#553).
                .padding(.horizontal, 16).padding(.vertical, 14)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("redeemInvitationButton")
    }

    /// Both buttons end it, for good, on this device.
    private func answeredFeedback() {
        onboarding.hasAskedForFeedback = true
        askForFeedback = false
    }

    var body: some View {
        Group {
            if apiaryVM.isLoading && apiaryVM.apiaries.isEmpty {
                ProgressView()
            } else if apiaryVM.apiaries.isEmpty && invitationsVM.invitations.isEmpty {
                VStack(spacing: 8) {
                    if #available(iOS 17, *) {
                        ContentUnavailableView(
                            NSLocalizedString("empty.apiaries.title", comment: ""),
                            systemImage: "map",
                            description: Text(NSLocalizedString("empty.apiaries.description", comment: ""))
                        )
                    } else {
                        VStack(spacing: 12) {
                            Image(systemName: "map").font(.largeTitle).foregroundColor(.secondary)
                            Text(NSLocalizedString("empty.apiaries.title", comment: "")).font(.headline)
                            Text(NSLocalizedString("empty.apiaries.description", comment: "")).font(.subheadline).foregroundColor(.secondary)
                        }
                        .padding()
                    }
                    // Here too, and not only over a full list: somebody who has kept the app for
                    // three days without naming a single colony is exactly who to ask why.
                    if askForFeedback {
                        FeedbackPromptCard(onAnswered: answeredFeedback)
                            .padding(.horizontal)
                    }
                }
            } else {
                List {
                    if askForFeedback {
                        Section { FeedbackPromptCard(onAnswered: answeredFeedback) }
                    }
                    if !invitationsVM.invitations.isEmpty {
                        Section {
                            InvitationsSection(vm: invitationsVM) { await apiaryVM.load() }
                        }
                    }
                    HomeSummarySections(vm: homeVM)
                    ForEach(apiaryVM.apiaries) { apiary in
                        NavigationLink(destination: ApiaryDetailView(apiary: apiary)) {
                            ApiaryRow(apiary: apiary)
                        }
                        // Only the owner deletes: the server would refuse anybody else.
                        .deleteDisabled(!apiary.isOwner)
                    }
                    .onDelete { indices in
                        Task {
                            for i in indices {
                                let apiary = apiaryVM.apiaries[i]
                                guard apiary.hiveCount == 0 else {
                                    apiaryVM.errorMessage = NSLocalizedString("error.apiaryHasHives", comment: "")
                                    return
                                }
                                do {
                                    try await apiaryVM.delete(apiary.id)
                                } catch {
                                    apiaryVM.errorMessage = error.localizedDescription
                                }
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle(NSLocalizedString("screen.apiaries", comment: ""))
        .hpScreenBackground()
        .hpFloatingButton(NSLocalizedString("action.newApiary", comment: ""), identifier: "newApiaryButton") {
            showCreate = true
        }
        // The other way an apiary gets into this list, on the same line as the first one (#553).
        //
        // It was the last row of the list before: a beekeeper with twelve apiaries scrolled past
        // all twelve to reach a rare recovery action, and arrived between the floating button and
        // the tab bar. Here it is reachable without scrolling at all, and the two controls divide
        // the bottom line instead of stacking in it.
        .overlay(alignment: .bottomLeading) {
            redeemInvitationButton.padding(.horizontal, 8).padding(.vertical, 12)
        }
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                if apiaryVM.isLoading { ProgressView() }
                // Same order as Android's top bar: statistics, QR batches, moves map, beekeeping year.
                // Creating an apiary is the amber button at the bottom right, as on Android.
                NavigationLink {
                    OverviewStatsView()
                        .environmentObject(apiaryVM)
                } label: {
                    Image(systemName: "chart.bar")
                }
                .accessibilityLabel(NSLocalizedString("screen.statsOverview", comment: ""))
                // Same place as Android's apiary list top bar — printing QR codes is a field task,
                // not a settings chore, so it must not hide in Settings.
                NavigationLink {
                    QRBatchListView()
                } label: {
                    Image(systemName: "printer")
                }
                .accessibilityLabel(NSLocalizedString("screen.qrBatches", comment: ""))
                .accessibilityIdentifier("qrBatchesButton")
                NavigationLink {
                    MovesOverviewView()
                } label: {
                    Image(systemName: "map")
                }
                .accessibilityLabel(NSLocalizedString("moves.overviewTitle", comment: ""))
                .accessibilityIdentifier("movesOverviewButton")
                NavigationLink {
                    BeekeepingYearView()
                } label: {
                    Image(systemName: "calendar")
                }
                .accessibilityLabel(NSLocalizedString("calendar.title", comment: ""))
                .accessibilityIdentifier("beekeepingYearButton")
            }
        }
        .task {
            askForFeedback = onboarding.shouldAskForFeedback()
            await invitationsVM.load()
            await homeVM.load()
        }
        .refreshable {
            await apiaryVM.load()
            await invitationsVM.load()
            await homeVM.load()
        }
        .sheet(isPresented: $showCreate) {
            ApiaryFormView(mode: .create) { name, desc, lat, lon, addr, isPublic in
                try await apiaryVM.create(name: name, description: desc, latitude: lat, longitude: lon, address: addr, isPublic: isPublic)
                showCreate = false
            }
        }
        .alert(NSLocalizedString("invitation.redeemTitle", comment: ""), isPresented: $showRedeem) {
            TextField(NSLocalizedString("invitation.redeemField", comment: ""), text: $pastedLink)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
            Button(NSLocalizedString("invitation.redeemButton", comment: "")) {
                let pasted = pastedLink
                pastedLink = ""
                Task {
                    if await invitationsVM.redeem(pasted) {
                        await apiaryVM.load()
                        await invitationsVM.load()
                    }
                }
            }
            Button(NSLocalizedString("action.cancel", comment: ""), role: .cancel) { pastedLink = "" }
        } message: {
            Text(NSLocalizedString("invitation.redeemMessage", comment: ""))
        }
        .alert(NSLocalizedString("alert.error", comment: ""), isPresented: Binding(
            get: { invitationsVM.errorMessage != nil },
            set: { if !$0 { invitationsVM.errorMessage = nil } }
        )) {
            Button("OK", role: .cancel) { invitationsVM.errorMessage = nil }
        } message: {
            Text(invitationsVM.errorMessage ?? "")
        }
        .alert(NSLocalizedString("alert.error", comment: ""), isPresented: Binding(
            get: { apiaryVM.errorMessage != nil },
            set: { if !$0 { apiaryVM.errorMessage = nil } }
        )) {
            Button("OK", role: .cancel) { apiaryVM.errorMessage = nil }
        } message: {
            Text(apiaryVM.errorMessage ?? "")
        }
    }
}

private struct ApiaryRow: View {
    let apiary: ApiaryOut
    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: "hexagon.fill")
                .font(.system(size: 22))
                .foregroundColor(.hpAmber)
                .frame(width: 44, height: 44)
                .background(Color.hpAmber.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 3) {
                Text(apiary.name)
                    .font(.dmSans(17, weight: .bold, relativeTo: .headline))
                    .foregroundColor(.hpStone900)
                HStack(spacing: 6) {
                    Text("\(apiary.hiveCount) \(NSLocalizedString("label.hives", comment: ""))")
                    if let addr = apiary.address {
                        Text("·")
                        Text(addr).lineLimit(1)
                    }
                }
                .font(.dmSans(14, relativeTo: .subheadline))
                .foregroundColor(.hpStone500)
                if !apiary.isOwner, let owner = apiary.ownerName {
                    Text(String(format: NSLocalizedString(apiary.access == "partial" ? "label.partialBy" : "label.sharedBy", comment: ""), owner))
                        .font(.dmSans(13, relativeTo: .caption))
                        .foregroundColor(.hpAmberDark)
                }
            }
        }
        .padding(.vertical, 6)
    }
}
