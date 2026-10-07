import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject private var apiaryVM = ApiaryViewModel()
    /// Kept by the app root: choosing a language rebuilds this view, and the beekeeper stays on the tab they were on.
    @Binding var selection: Int

    var body: some View {
        // Same order as Android's bottom bar: apiaries, scan, hornets, members, settings.
        TabView(selection: $selection) {
            NavigationStack {
                ApiaryListView()
                    .environmentObject(apiaryVM)
            }
            .tint(.hpAmberDark)
            .tabItem {
                Label(NSLocalizedString("tab.apiaries", comment: ""), systemImage: "hexagon")
            }
            .tag(0)

            NavigationStack {
                QRScanEntryView()
                    .environmentObject(apiaryVM)
            }
            .tint(.hpAmberDark)
            .tabItem {
                Label(NSLocalizedString("tab.scan", comment: ""), systemImage: "qrcode.viewfinder")
            }
            .tag(1)

            HornetView()
            .tabItem {
                Label {
                    Text(NSLocalizedString("tab.hornets", comment: ""))
                } icon: {
                    Image(uiImage: HornetIcon.tabImage)
                }
            }
            .tag(2)

            NavigationStack {
                MembersView()
                    .environmentObject(authVM)
            }
            .tint(.hpAmberDark)
            .tabItem {
                Label(NSLocalizedString("tab.members", comment: ""), systemImage: "person.3")
            }
            .tag(3)

            NavigationStack {
                SettingsView()
                    .environmentObject(authVM)
            }
            .tint(.hpAmberDark)
            .tabItem {
                Label(NSLocalizedString("tab.settings", comment: ""), systemImage: "gear")
            }
            .tag(4)
        }
        // Amber selection on the forest-green tab bar (see HivePulseAppearance); DM Sans for all content
        .tint(.hpAmber)
        .font(.dmSans(17))
        .task { await apiaryVM.load() }
    }
}
