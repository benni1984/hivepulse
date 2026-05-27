import UIKit
import UserNotifications

final class AppDelegate: NSObject, UIApplicationDelegate {

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        NotificationCenter.default.post(
            name: .apnsTokenReceived,
            object: nil,
            userInfo: ["token": deviceToken]
        )
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        // APNs unavailable in simulator / CI — silently ignore
    }
}

extension Notification.Name {
    static let apnsTokenReceived = Notification.Name("apnsTokenReceived")
}
