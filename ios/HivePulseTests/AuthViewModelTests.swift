import XCTest
@testable import HivePulse

@MainActor
final class AuthViewModelTests: XCTestCase {

    private var svc: MockAuthService!
    private var vm: AuthViewModel!

    override func setUp() {
        super.setUp()
        KeychainService.shared.clearAll()
        svc = MockAuthService()
        vm = AuthViewModel(service: svc)
    }

    override func tearDown() {
        KeychainService.shared.clearAll()
        super.tearDown()
    }

    func test_login_success_setsAuthenticated() async {
        await vm.login(email: "a@b.com", password: "pass")
        XCTAssertTrue(vm.isAuthenticated)
        XCTAssertNil(vm.errorMessage)
    }

    func test_login_failure_setsErrorMessage() async {
        svc.loginResult = .failure(NSError(domain: "test", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Invalid credentials"]))
        await vm.login(email: "a@b.com", password: "wrong")
        XCTAssertFalse(vm.isAuthenticated)
        XCTAssertEqual(vm.errorMessage, "Invalid credentials")
    }

    func test_register_success_setsAuthenticated() async {
        await vm.register(email: "a@b.com", password: "pass", name: "Alice", locale: "en")
        XCTAssertTrue(vm.isAuthenticated)
        XCTAssertNil(vm.errorMessage)
    }

    func test_register_failure_setsErrorMessage() async {
        svc.registerResult = .failure(NSError(domain: "test", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Email already taken"]))
        await vm.register(email: "a@b.com", password: "pass", name: "Alice", locale: "en")
        XCTAssertEqual(vm.errorMessage, "Email already taken")
    }

    func test_logout_clearsAuthentication() async {
        await vm.login(email: "a@b.com", password: "pass")
        XCTAssertTrue(vm.isAuthenticated)
        await vm.logout()
        XCTAssertFalse(vm.isAuthenticated)
        XCTAssertNil(vm.currentUser)
    }

    func test_loadProfile_populatesCurrentUser() async {
        let user = makeUser(id: "u-42", name: "Alice")
        svc.getMeResult = .success(user)
        await vm.loadProfile()
        XCTAssertEqual(vm.currentUser?.id, "u-42")
        XCTAssertEqual(vm.currentUser?.name, "Alice")
    }

    func test_updateProfile_updatesCurrentUser() async {
        let updated = makeUser(name: "New Name")
        svc.updateMeResult = .success(updated)
        await vm.updateProfile(name: "New Name", locale: "fr")
        XCTAssertEqual(vm.currentUser?.name, "New Name")
    }

    func test_updateProfile_failure_setsErrorMessage() async {
        svc.updateMeResult = .failure(NSError(domain: "test", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Update failed"]))
        await vm.updateProfile(name: "Bad", locale: "en")
        XCTAssertEqual(vm.errorMessage, "Update failed")
    }

    func test_isAuthenticated_falseWhenNoToken() {
        KeychainService.shared.clearAll()
        let freshVM = AuthViewModel(service: svc)
        XCTAssertFalse(freshVM.isAuthenticated)
    }

    func test_isAuthenticated_trueWhenTokenPresent() {
        KeychainService.shared.accessToken = "existing-token"
        let freshVM = AuthViewModel(service: svc)
        XCTAssertTrue(freshVM.isAuthenticated)
    }

    func test_changePassword_success_updatesCurrentUser() async {
        let updated = makeUser(id: "u-42", name: "Alice")
        svc.changePasswordResult = .success(updated)
        await vm.changePassword(currentPassword: "oldpass", newPassword: "newpass1")
        XCTAssertNil(vm.errorMessage)
        XCTAssertEqual(vm.currentUser?.id, "u-42")
    }

    func test_changePassword_failure_setsErrorMessage() async {
        svc.changePasswordResult = .failure(NSError(domain: "test", code: 400,
            userInfo: [NSLocalizedDescriptionKey: "Current password is incorrect"]))
        await vm.changePassword(currentPassword: "wrong", newPassword: "newpass1")
        XCTAssertEqual(vm.errorMessage, "Current password is incorrect")
    }

    func test_deleteAccount_success_clearsAuthentication() async {
        await vm.login(email: "a@b.com", password: "pass")
        XCTAssertTrue(vm.isAuthenticated)
        await vm.deleteAccount()
        XCTAssertFalse(vm.isAuthenticated)
        XCTAssertNil(vm.currentUser)
        XCTAssertNil(KeychainService.shared.accessToken)
    }

    func test_deleteAccount_failure_keepsUserAuthenticated() async {
        await vm.login(email: "a@b.com", password: "pass")
        XCTAssertTrue(vm.isAuthenticated)
        svc.deleteMeError = NSError(domain: "test", code: 500,
            userInfo: [NSLocalizedDescriptionKey: "Server error"])
        await vm.deleteAccount()
        XCTAssertEqual(vm.errorMessage, "Server error")
        // Server error must not log the user out
        XCTAssertTrue(vm.isAuthenticated)
    }

    // MARK: - Reminder settings

    func test_loadReminderSettings_populatesReminderSettings() async {
        let settings = makeReminderSettings(enabled: true, intervalDays: 14, seasonStart: 3, seasonEnd: 9)
        svc.getReminderResult = .success(settings)
        await vm.loadReminderSettings()
        XCTAssertNotNil(vm.reminderSettings)
        XCTAssertEqual(vm.reminderSettings?.reminderEnabled, true)
        XCTAssertEqual(vm.reminderSettings?.reminderIntervalDays, 14)
        XCTAssertEqual(vm.reminderSettings?.reminderSeasonStart, 3)
        XCTAssertEqual(vm.reminderSettings?.reminderSeasonEnd, 9)
    }

    func test_loadReminderSettings_failure_doesNotSetErrorMessage() async {
        svc.getReminderResult = .failure(NSError(domain: "test", code: 500,
            userInfo: [NSLocalizedDescriptionKey: "Server error"]))
        await vm.loadReminderSettings()
        // loadReminderSettings is best-effort — should not surface error to UI
        XCTAssertNil(vm.reminderSettings)
        XCTAssertNil(vm.errorMessage)
    }

    func test_updateReminderSettings_updatesPublishedSettings() async {
        let updated = makeReminderSettings(enabled: false, intervalDays: 30)
        svc.updateReminderResult = .success(updated)
        let body = ReminderSettingsUpdate(reminderEnabled: false, reminderIntervalDays: 30,
                                          reminderSeasonStart: nil, reminderSeasonEnd: nil)
        await vm.updateReminderSettings(body)
        XCTAssertNil(vm.errorMessage)
        XCTAssertEqual(vm.reminderSettings?.reminderEnabled, false)
        XCTAssertEqual(vm.reminderSettings?.reminderIntervalDays, 30)
    }

    func test_updateReminderSettings_failure_setsErrorMessage() async {
        svc.updateReminderResult = .failure(NSError(domain: "test", code: 500,
            userInfo: [NSLocalizedDescriptionKey: "Update failed"]))
        let body = ReminderSettingsUpdate(reminderEnabled: true, reminderIntervalDays: 7,
                                          reminderSeasonStart: nil, reminderSeasonEnd: nil)
        await vm.updateReminderSettings(body)
        XCTAssertEqual(vm.errorMessage, "Update failed")
    }

    func test_registerAPNsToken_success_doesNotSetError() async {
        let tokenData = Data([0xAB, 0xCD, 0xEF])
        await vm.registerAPNsToken(tokenData)
        XCTAssertNil(vm.errorMessage)
    }

    func test_registerAPNsToken_failure_isSilent() async {
        svc.registerPushTokenError = NSError(domain: "test", code: 500,
            userInfo: [NSLocalizedDescriptionKey: "Token registration failed"])
        let tokenData = Data([0x01, 0x02])
        await vm.registerAPNsToken(tokenData)
        // Should be silent — push token registration is best-effort
        XCTAssertNil(vm.errorMessage)
    }
}
