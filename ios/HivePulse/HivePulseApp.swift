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

    init() {
        #if DEBUG
        let args = ProcessInfo.processInfo.arguments
        if args.contains("-resetKeychain") {
            KeychainService.shared.clearAll()
        }
        if args.contains("-mockApiaryWithHive") {
            KeychainService.shared.clearAll()
            KeychainService.shared.accessToken = "ui-test-token"
            KeychainService.shared.refreshToken = "ui-test-refresh"
            MockURLProtocol.configure(MockURLProtocol.apiaryWithHiveHandlers)
            APIClient.shared = .forUITesting()
        } else if args.contains("-mockAuthenticatedSupporter") {
            KeychainService.shared.clearAll()
            KeychainService.shared.accessToken = "ui-test-token"
            KeychainService.shared.refreshToken = "ui-test-refresh"
            MockURLProtocol.configure(MockURLProtocol.authenticatedSupporterHandlers)
            APIClient.shared = .forUITesting()
        } else if args.contains("-mockAuthenticated") {
            KeychainService.shared.clearAll()
            KeychainService.shared.accessToken = "ui-test-token"
            KeychainService.shared.refreshToken = "ui-test-refresh"
            MockURLProtocol.configure(MockURLProtocol.authenticatedHandlers)
            APIClient.shared = .forUITesting()
        } else if args.contains("-mockServer") {
            MockURLProtocol.configure(MockURLProtocol.unauthenticatedHandlers)
            APIClient.shared = .forUITesting()
        }
        #endif
    }

    var body: some Scene {
        WindowGroup {
            if authVM.isAuthenticated {
                MainTabView()
                    .environmentObject(authVM)
                    .task {
                        await authVM.loadProfile()
                        await requestPushPermission()
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
                        Label(NSLocalizedString("tab.hornets", comment: ""), systemImage: "ant")
                    }
                }
                .tint(.orange)
            }
        }
    }

    // MARK: - Push permission

    private func requestPushPermission() async {
        let center = UNUserNotificationCenter.current()
        let granted = (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
        if granted {
            await MainActor.run {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }
}
