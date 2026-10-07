import SwiftUI

struct ApiaryListView: View {
    @EnvironmentObject var apiaryVM: ApiaryViewModel
    @StateObject private var invitationsVM = InvitationsViewModel()
    @StateObject private var homeVM = HomeSummaryViewModel()
    @State private var showCreate = false
    @State private var showRedeem = false
    @State private var pastedLink = ""

    var body: some View {
        Group {
            if apiaryVM.isLoading && apiaryVM.apiaries.isEmpty {
                ProgressView()
            } else if apiaryVM.apiaries.isEmpty && invitationsVM.invitations.isEmpty {
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
            } else {
                List {
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
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                if apiaryVM.isLoading { ProgressView() }
                // Same order as Android's top bar: statistics, QR batches, moves map, beekeeping year, invitation link.
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
                Button { showRedeem = true } label: { Image(systemName: "envelope.open") }
                    .accessibilityLabel(NSLocalizedString("invitation.redeemTitle", comment: ""))
                    .accessibilityIdentifier("redeemInvitationButton")
            }
        }
        .task {
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
