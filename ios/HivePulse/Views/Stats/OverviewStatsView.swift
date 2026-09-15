import SwiftUI

/// Account-wide statistics — the iOS counterpart of the web "My Statistics" page and Android's overview screen.
struct OverviewStatsView: View {
    @EnvironmentObject var apiaryVM: ApiaryViewModel
    @StateObject private var vm = OverviewStatsViewModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Picker(NSLocalizedString("overview.period", comment: ""), selection: $vm.preset) {
                    ForEach(OverviewStatsViewModel.presets, id: \.self) { Text($0).tag($0) }
                }
                .pickerStyle(.segmented)

                if let error = vm.errorMessage {
                    ErrorBanner(message: error) { vm.errorMessage = nil }
                }

                if let s = vm.stats {
                    HStack(spacing: 10) {
                        HPStatPill(label: NSLocalizedString("overview.apiaries", comment: ""),
                                   value: "\(s.apiaryCount)", systemImage: "house")
                        HPStatPill(label: NSLocalizedString("overview.hives", comment: ""),
                                   value: "\(s.hiveCount)", systemImage: "hexagon")
                        HPStatPill(label: NSLocalizedString("overview.inspections", comment: ""),
                                   value: "\(s.inspectionsTotal)", systemImage: "checkmark.square")
                    }

                    Text(NSLocalizedString("overview.perApiary", comment: ""))
                        .font(.dmSans(17, weight: .bold, relativeTo: .headline))
                        .foregroundColor(.hpStone900)
                        .padding(.top, 8)

                    if s.perApiary.isEmpty {
                        Text(NSLocalizedString("overview.noData", comment: ""))
                            .font(.dmSans(15, relativeTo: .subheadline))
                            .foregroundColor(.hpStone500)
                    } else {
                        ForEach(s.perApiary) { row in
                            if let apiary = apiaryVM.apiaries.first(where: { $0.id == row.apiaryId }) {
                                NavigationLink(destination: ApiaryDetailView(apiary: apiary)) {
                                    OverviewApiaryRow(row: row, showsChevron: true)
                                }
                                .buttonStyle(.plain)
                            } else {
                                OverviewApiaryRow(row: row, showsChevron: false)
                            }
                        }
                    }
                } else if vm.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding(.top, 40)
                }
            }
            .padding()
        }
        .hpScreenBackground()
        .navigationTitle(NSLocalizedString("screen.statsOverview", comment: ""))
        .overlay(alignment: .top) {
            // Refreshing a different period: keep the old numbers visible, show progress on top
            if vm.isLoading && vm.stats != nil {
                ProgressView().padding(.top, 4)
            }
        }
        .task { await vm.load() }
        .onChange(of: vm.preset) { _ in Task { await vm.load() } }
    }
}

private struct OverviewApiaryRow: View {
    let row: ApiaryStatsSummary
    let showsChevron: Bool

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(row.apiaryName)
                    .font(.dmSans(17, weight: .bold, relativeTo: .headline))
                    .foregroundColor(.hpStone900)
                Text(String(format: NSLocalizedString("overview.rowFormat", comment: ""), row.hiveCount, row.inspectionsTotal))
                    .font(.dmSans(14, relativeTo: .subheadline))
                    .foregroundColor(.hpStone500)
            }
            Spacer()
            if showsChevron {
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.hpStone500)
            }
        }
        .hpCard()
    }
}
