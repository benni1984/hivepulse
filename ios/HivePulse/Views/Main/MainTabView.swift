import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject private var apiaryVM = ApiaryViewModel()

    var body: some View {
        TabView {
            NavigationStack {
                ApiaryListView()
                    .environmentObject(apiaryVM)
            }
            .tabItem {
                Label(NSLocalizedString("tab.apiaries", comment: ""), systemImage: "map")
            }

            NavigationStack {
                QRScanEntryView()
                    .environmentObject(apiaryVM)
            }
            .tabItem {
                Label(NSLocalizedString("tab.scan", comment: ""), systemImage: "qrcode.viewfinder")
            }

            NavigationStack {
                MembersView()
                    .environmentObject(authVM)
            }
            .tabItem {
                Label(NSLocalizedString("tab.members", comment: ""), systemImage: "person.3")
            }

            NavigationStack {
                SettingsView()
                    .environmentObject(authVM)
            }
            .tabItem {
                Label(NSLocalizedString("tab.settings", comment: ""), systemImage: "gear")
            }

            HornetView()
            .tabItem {
                Label(NSLocalizedString("tab.hornets", comment: ""), systemImage: "ant")
            }
        }
        .tint(.orange)
        .task { await apiaryVM.load() }
    }
}
