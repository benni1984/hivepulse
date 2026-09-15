import XCTest
@testable import HivePulse

@MainActor
final class GuidedTourTests: XCTestCase {

    private var suiteName: String!
    private var defaults: UserDefaults!

    override func setUp() {
        super.setUp()
        KeychainService.shared.clearAll()
        suiteName = "GuidedTourTests-\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suiteName)
    }

    override func tearDown() {
        defaults.removePersistentDomain(forName: suiteName)
        KeychainService.shared.clearAll()
        super.tearDown()
    }

    private func makeVM(tourSeen: Bool = false) -> AuthViewModel {
        let store = OnboardingStore(defaults: defaults)
        store.hasSeenGuidedTour = tourSeen
        return AuthViewModel(service: MockAuthService(), onboarding: store)
    }

    func test_onboardingStore_persistsSeenFlag() {
        let store = OnboardingStore(defaults: defaults)
        XCTAssertFalse(store.hasSeenGuidedTour)

        store.hasSeenGuidedTour = true

        XCTAssertTrue(OnboardingStore(defaults: defaults).hasSeenGuidedTour)
    }

    func test_firstLogin_showsGuidedTour() async {
        let vm = makeVM()

        await vm.login(email: "a@b.com", password: "pass")

        XCTAssertTrue(vm.isAuthenticated)
        XCTAssertTrue(vm.showGuidedTour)
    }

    func test_firstRegistration_showsGuidedTour() async {
        let vm = makeVM()

        await vm.register(email: "a@b.com", password: "Password1", name: "Alice", locale: "en")

        XCTAssertTrue(vm.showGuidedTour)
    }

    func test_loginAfterTourWasSeen_doesNotShowIt() async {
        let vm = makeVM(tourSeen: true)

        await vm.login(email: "a@b.com", password: "pass")

        XCTAssertTrue(vm.isAuthenticated)
        XCTAssertFalse(vm.showGuidedTour)
    }

    func test_finishGuidedTour_marksSeenAndHidesIt() async {
        let vm = makeVM()
        await vm.login(email: "a@b.com", password: "pass")

        vm.finishGuidedTour()

        XCTAssertFalse(vm.showGuidedTour)
        XCTAssertTrue(OnboardingStore(defaults: defaults).hasSeenGuidedTour)
    }

    func test_failedLogin_doesNotShowGuidedTour() async {
        let svc = MockAuthService()
        svc.loginResult = .failure(NSError(domain: "test", code: 1))
        let vm = AuthViewModel(service: svc, onboarding: OnboardingStore(defaults: defaults))

        await vm.login(email: "a@b.com", password: "wrong")

        XCTAssertFalse(vm.showGuidedTour)
    }

    func test_logout_hidesGuidedTour() async {
        let vm = makeVM()
        await vm.login(email: "a@b.com", password: "pass")

        await vm.logout()

        XCTAssertFalse(vm.showGuidedTour)
        XCTAssertFalse(OnboardingStore(defaults: defaults).hasSeenGuidedTour)
    }

    func test_replayGuidedTour_showsItAgain() {
        let vm = makeVM(tourSeen: true)

        vm.replayGuidedTour()

        XCTAssertTrue(vm.showGuidedTour)
    }
}
