import SwiftUI
import UserNotifications

// Setup instructions:
// 1. In Xcode: File > New > Project > App, name "HivePulse", bundle ID "com.hivepulse.app"
// 2. Set minimum deployment to iOS 17
// 3. Delete auto-generated ContentView.swift
// 4. Add all files from this directory to the project (drag into navigator)
// 5. Enable capabilities: Location When In Use, Camera, Push Notifications

@main
struct HivePulseApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var authVM = AuthViewModel()
    /// The language chosen in Settings, or empty to follow the phone. Reading it here is what
    /// rebuilds the views when it changes: they ask for their strings again, now from the new
    /// language.
    @AppStorage(AppLanguage.key) private var languageOverride = ""
    /// The tab the beekeeper is on. It lives here, outside the view that is rebuilt on a language change, so that
    /// saving the profile with a new language does not throw them back to the first tab.
    @State private var selectedTab = 0

    init() {
        // First statement: a crash during setup should still be reported.
        _ = CrashReporting.start()
        HivePulseAppearance.apply()
        // Before any view reads a string.
        AppLanguage.applyStored()
        #if DEBUG
        let args = ProcessInfo.processInfo.arguments
        if args.contains("-resetKeychain") {
            KeychainService.shared.clearAll()
            // A language picked in an earlier run would override the launch arguments.
            AppLanguage.reset()
        }
        if args.contains("-mockApiaryWithHive") {
            KeychainService.shared.clearAll()
            KeychainService.shared.accessToken = "ui-test-token"
            KeychainService.shared.refreshToken = "ui-test-refresh"
            // The extra sets go first: the first matching pattern wins.
            var handlers = MockURLProtocol.apiaryWithHiveHandlers
            if args.contains("-mockHomeSummary") { handlers = MockURLProtocol.homeSummaryHandlers + handlers }
            if args.contains("-mockNewTools") { handlers = MockURLProtocol.newToolsHandlers + handlers }
            MockURLProtocol.configure(handlers)
            APIClient.shared = .forUITesting()
        } else if args.contains("-mockAuthenticatedSupporter") {
            KeychainService.shared.clearAll()
            KeychainService.shared.accessToken = "ui-test-token"
            KeychainService.shared.refreshToken = "ui-test-refresh"
            MockURLProtocol.configure(MockURLProtocol.authenticatedSupporterHandlers)
            APIClient.shared = .forUITesting()
        } else if args.contains("-mockQrBatch") {
            KeychainService.shared.clearAll()
            KeychainService.shared.accessToken = "ui-test-token"
            KeychainService.shared.refreshToken = "ui-test-refresh"
            MockURLProtocol.configure(MockURLProtocol.qrBatchHandlers)
            APIClient.shared = .forUITesting()
        } else if args.contains("-mockAuthenticated") {
            KeychainService.shared.clearAll()
            KeychainService.shared.accessToken = "ui-test-token"
            KeychainService.shared.refreshToken = "ui-test-refresh"
            MockURLProtocol.configure(MockURLProtocol.authenticatedHandlers)
            APIClient.shared = .forUITesting()
        } else if args.contains("-mockApiaryOffline") {
            // Lists load, writing fails like a missing connection does.
            KeychainService.shared.clearAll()
            KeychainService.shared.accessToken = "ui-test-token"
            KeychainService.shared.refreshToken = "ui-test-refresh"
            MockURLProtocol.configure(MockURLProtocol.apiaryWithHiveHandlers)
            MockURLProtocol.failWritesAsOffline = true
            OfflineStore.shared.clear()
            APIClient.shared = .forUITesting()
        } else if args.contains("-mockServer") {
            MockURLProtocol.configure(MockURLProtocol.unauthenticatedHandlers)
            APIClient.shared = .forUITesting()
        }
        #endif
    }

    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            // Stable container so the tour cover survives the login -> tabs switch that happens in the same update.
            ZStack {
                if authVM.isAuthenticated {
                    MainTabView(selection: $selectedTab)
                        // On the view, not the container: keying the container would restart
                        // the .task below and ask for push permission again.
                        .id(languageOverride)
                        .environmentObject(authVM)
                        .task {
                            await authVM.loadProfile()
                            await requestPushPermission()
                            // Inspections recorded at the apiary go up as soon as the app
                            // is open again with a connection.
                            await OfflineInspectionQueue.shared.flush()
                        }
                        .onChange(of: scenePhase) { _, phase in
                            if phase == .active {
                                Task { await OfflineInspectionQueue.shared.flush() }
                            }
                        }
                        .onReceive(NotificationCenter.default.publisher(for: .apnsTokenReceived)) { note in
                            if let tokenData = note.userInfo?["token"] as? Data {
                                Task { await authVM.registerAPNsToken(tokenData) }
                            }
                        }
                } else {
                    // Unauthenticated: HivePulse login + public Hornets tab always visible
                    TabView {
                        NavigationStack {
                            LoginView()
                                .environmentObject(authVM)
                        }
                        .tabItem {
                            Label("HivePulse", systemImage: "hexagon.fill")
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
                    .tint(.hpAmber)
                    .font(.dmSans(17))
                    .id(languageOverride)
                }
            }
            .fullScreenCover(isPresented: $authVM.showGuidedTour) {
                GuidedTourView { authVM.finishGuidedTour() }
            }
        }
    }

    // MARK: - Push permission

    private func requestPushPermission() async {
        #if DEBUG
        // UI tests launch with mock arguments; the system permission alert would appear at a random moment
        // and swallow taps meant for the app.
        if ProcessInfo.processInfo.arguments.contains(where: { $0 == "-resetKeychain" || $0.hasPrefix("-mock") }) {
            return
        }
        #endif
        let center = UNUserNotificationCenter.current()
        let granted = (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
        if granted {
            await MainActor.run {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }
}
