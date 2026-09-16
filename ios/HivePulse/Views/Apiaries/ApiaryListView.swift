import SwiftUI

struct ApiaryListView: View {
    @EnvironmentObject var apiaryVM: ApiaryViewModel
    @State private var showCreate = false

    var body: some View {
        Group {
            if apiaryVM.isLoading && apiaryVM.apiaries.isEmpty {
                ProgressView()
            } else if apiaryVM.apiaries.isEmpty {
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
                    ForEach(apiaryVM.apiaries) { apiary in
                        NavigationLink(destination: ApiaryDetailView(apiary: apiary)) {
                            ApiaryRow(apiary: apiary)
                        }
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
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                if apiaryVM.isLoading { ProgressView() }
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
                Button { showCreate = true } label: { Image(systemName: "plus") }
            }
        }
        .refreshable { await apiaryVM.load() }
        .sheet(isPresented: $showCreate) {
            ApiaryFormView(mode: .create) { name, desc, lat, lon, addr in
                try await apiaryVM.create(name: name, description: desc, latitude: lat, longitude: lon, address: addr)
                showCreate = false
            }
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
            }
        }
        .padding(.vertical, 6)
    }
}
