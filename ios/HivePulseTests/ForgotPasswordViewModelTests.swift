import XCTest
@testable import HivePulse

final class MockPasswordResetService: PasswordResetRequesting {
    var error: Error?
    private(set) var requestedEmails: [String] = []

    func requestPasswordReset(email: String) async throws {
        requestedEmails.append(email)
        if let error { throw error }
    }
}

@MainActor
final class ForgotPasswordViewModelTests: XCTestCase {

    private var svc: MockPasswordResetService!

    override func setUp() {
        super.setUp()
        svc = MockPasswordResetService()
    }

    func test_submit_trimsEmailAndShowsConfirmation() async {
        let vm = ForgotPasswordViewModel(email: "  bee@example.com ", service: svc)

        await vm.submit()

        XCTAssertEqual(svc.requestedEmails, ["bee@example.com"])
        XCTAssertTrue(vm.sent)
        XCTAssertFalse(vm.isOffline)
        XCTAssertFalse(vm.isSending)
    }

    func test_submit_serverErrorStillShowsNeutralConfirmation() async {
        svc.error = APIError.server("Internal error")
        let vm = ForgotPasswordViewModel(email: "bee@example.com", service: svc)

        await vm.submit()

        XCTAssertTrue(vm.sent)
        XCTAssertFalse(vm.isOffline)
    }

    func test_submit_networkErrorShowsOfflineAndDoesNotClaimSent() async {
        svc.error = APIError.network(URLError(.notConnectedToInternet))
        let vm = ForgotPasswordViewModel(email: "bee@example.com", service: svc)

        await vm.submit()

        XCTAssertTrue(vm.isOffline)
        XCTAssertFalse(vm.sent)
        XCTAssertFalse(vm.isSending)
    }

    func test_submit_withoutValidEmailDoesNothing() async {
        let vm = ForgotPasswordViewModel(email: "   ", service: svc)

        XCTAssertFalse(vm.canSubmit)
        await vm.submit()

        XCTAssertTrue(svc.requestedEmails.isEmpty)
        XCTAssertFalse(vm.sent)
    }
}
