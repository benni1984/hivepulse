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
            .tint(.hpAmberDark)
            .tabItem {
                Label(NSLocalizedString("tab.apiaries", comment: ""), systemImage: "hexagon")
            }

            NavigationStack {
                QRScanEntryView()
                    .environmentObject(apiaryVM)
            }
            .tint(.hpAmberDark)
            .tabItem {
                Label(NSLocalizedString("tab.scan", comment: ""), systemImage: "qrcode.viewfinder")
            }

            NavigationStack {
                MembersView()
                    .environmentObject(authVM)
            }
            .tint(.hpAmberDark)
            .tabItem {
                Label(NSLocalizedString("tab.members", comment: ""), systemImage: "person.3")
            }

            NavigationStack {
                SettingsView()
                    .environmentObject(authVM)
            }
            .tint(.hpAmberDark)
            .tabItem {
                Label(NSLocalizedString("tab.settings", comment: ""), systemImage: "gear")
            }

            HornetView()
            .tabItem {
                Label {
                    Text(NSLocalizedString("tab.hornets", comment: ""))
                } icon: {
                    Image(uiImage: HornetIcon.tabImage)
                }
            }
        }
        // Amber selection on the forest-green tab bar (see HivePulseAppearance); DM Sans for all content
        .tint(.hpAmber)
        .font(.dmSans(17))
        .task { await apiaryVM.load() }
    }
}
