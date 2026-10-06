import XCTest
@testable import HivePulse

private final class MockSharingService: SharingServiceProtocol {
    var sharesResult: Result<[ShareOut], Error> = .success([])
    var inviteResult: Result<ShareOut, Error> = .success(makeShare(id: "s-new"))
    var incomingResult: Result<[IncomingShareOut], Error> = .success([])
    var acceptError: Error?
    var declineError: Error?
    var removeError: Error?

    private(set) var invitedEmails: [String] = []
    private(set) var accepted: [String] = []
    private(set) var declined: [String] = []
    private(set) var removed: [String] = []

    func shares(for target: ShareTargetKind) async throws -> [ShareOut] { try sharesResult.get() }

    func invite(email: String, to target: ShareTargetKind) async throws -> ShareOut {
        invitedEmails.append(email)
        return try inviteResult.get()
    }

    func incoming() async throws -> [IncomingShareOut] { try incomingResult.get() }

    func accept(_ id: String) async throws {
        if let acceptError { throw acceptError }
        accepted.append(id)
    }

    func decline(_ id: String) async throws {
        if let declineError { throw declineError }
        declined.append(id)
    }

    func remove(_ id: String) async throws {
        if let removeError { throw removeError }
        removed.append(id)
    }
}

private func makeShare(id: String = "s-1", email: String = "bob@example.com", status: String = "pending") -> ShareOut {
    ShareOut(id: id, email: email, status: status,
             target: ShareTarget(type: "apiary", id: "a-1", name: "Garden"),
             collaboratorName: status == "accepted" ? "Bob" : nil, createdAt: Date(), acceptedAt: nil)
}

private func makeInvitation(id: String = "s-1") -> IncomingShareOut {
    IncomingShareOut(id: id, ownerName: "Alice",
                     target: ShareTarget(type: "apiary", id: "a-1", name: "Garden"),
                     apiaryName: nil, createdAt: Date())
}

@MainActor
final class SharingViewModelTests: XCTestCase {

    private var service: MockSharingService!

    override func setUp() {
        super.setUp()
        service = MockSharingService()
    }

    private func makeViewModel() -> SharingViewModel {
        SharingViewModel(target: .apiary("a-1"), service: service)
    }

    func test_loadListsCollaboratorsAndOpenInvitations() async {
        service.sharesResult = .success([makeShare(id: "s-1", status: "accepted"), makeShare(id: "s-2")])
        let vm = makeViewModel()

        await vm.load()

        XCTAssertEqual(vm.shares.map(\.id), ["s-1", "s-2"])
        XCTAssertFalse(vm.isLoading)
        XCTAssertNil(vm.errorMessage)
    }

    func test_aFailedLoadSetsTheMessage() async {
        service.sharesResult = .failure(APIError.server("down"))
        let vm = makeViewModel()

        await vm.load()

        XCTAssertEqual(vm.errorMessage, "down")
    }

    func test_inviteSendsTheTrimmedAddressAndShowsTheNewInvitationFirst() async {
        service.sharesResult = .success([makeShare(id: "s-old")])
        let vm = makeViewModel()
        await vm.load()

        let sent = await vm.invite(email: "  carol@example.com ")

        XCTAssertTrue(sent)
        XCTAssertEqual(service.invitedEmails, ["carol@example.com"])
        XCTAssertEqual(vm.shares.map(\.id), ["s-new", "s-old"])
        XCTAssertTrue(vm.inviteSent)
        XCTAssertFalse(vm.isInviting)
    }

    func test_anObviousTypoNeverReachesTheServer() async {
        let vm = makeViewModel()

        for typo in ["", "bob", "bob@", "@example.com", "bob@example", "bob@example.", "bo b@example.com"] {
            let sent = await vm.invite(email: typo)
            XCTAssertFalse(sent, typo)
        }

        XCTAssertTrue(service.invitedEmails.isEmpty)
        XCTAssertNil(vm.errorMessage)
    }

    func test_theServersReasonIsShownWhenTheInvitationIsRefused() async {
        service.inviteResult = .failure(APIError.conflict("This address has already been invited."))
        let vm = makeViewModel()

        let sent = await vm.invite(email: "bob@example.com")

        XCTAssertFalse(sent)
        XCTAssertEqual(vm.errorMessage, "This address has already been invited.")
        XCTAssertTrue(vm.shares.isEmpty)
        XCTAssertFalse(vm.inviteSent)
    }

    func test_aNewInvitationClearsTheEarlierMessage() async {
        service.inviteResult = .failure(APIError.server("nope"))
        let vm = makeViewModel()
        _ = await vm.invite(email: "bob@example.com")
        service.inviteResult = .success(makeShare())

        _ = await vm.invite(email: "bob@example.com")

        XCTAssertNil(vm.errorMessage)
        XCTAssertTrue(vm.inviteSent)
    }

    func test_removeTakesThePersonOutOfTheList() async {
        let bob = makeShare(id: "s-1", status: "accepted")
        service.sharesResult = .success([bob, makeShare(id: "s-2")])
        let vm = makeViewModel()
        await vm.load()

        await vm.remove(bob)

        XCTAssertEqual(service.removed, ["s-1"])
        XCTAssertEqual(vm.shares.map(\.id), ["s-2"])
    }

    func test_aFailedRemoveKeepsThePersonAndSaysSo() async {
        let bob = makeShare(id: "s-1", status: "accepted")
        service.sharesResult = .success([bob])
        service.removeError = APIError.server("nope")
        let vm = makeViewModel()
        await vm.load()

        await vm.remove(bob)

        XCTAssertEqual(vm.shares.count, 1)
        XCTAssertEqual(vm.errorMessage, "nope")
    }

    func test_theAddressCheckAcceptsRealAddresses() {
        XCTAssertTrue(SharingViewModel.looksLikeAnEmail("bob@example.com"))
        XCTAssertTrue(SharingViewModel.looksLikeAnEmail(" bob.smith+bees@mail.example.org "))
    }
}

@MainActor
final class InvitationsViewModelTests: XCTestCase {

    private var service: MockSharingService!

    override func setUp() {
        super.setUp()
        service = MockSharingService()
    }

    func test_loadShowsWhatIsWaiting() async {
        service.incomingResult = .success([makeInvitation(id: "s-1"), makeInvitation(id: "s-2")])
        let vm = InvitationsViewModel(service: service)

        await vm.load()

        XCTAssertEqual(vm.invitations.map(\.id), ["s-1", "s-2"])
    }

    func test_aFailedLoadLooksLikeNoInvitationsNotLikeAnError() async {
        service.incomingResult = .failure(APIError.server("down"))
        let vm = InvitationsViewModel(service: service)

        await vm.load()

        XCTAssertTrue(vm.invitations.isEmpty)
        XCTAssertNil(vm.errorMessage, "the apiary list is usable without this")
    }

    func test_acceptRemovesTheInvitationAndSaysItWorked() async {
        service.incomingResult = .success([makeInvitation(id: "s-1"), makeInvitation(id: "s-2")])
        let vm = InvitationsViewModel(service: service)
        await vm.load()

        let accepted = await vm.accept(vm.invitations[0])

        XCTAssertTrue(accepted)
        XCTAssertEqual(service.accepted, ["s-1"])
        XCTAssertEqual(vm.invitations.map(\.id), ["s-2"])
    }

    func test_aRefusedAcceptKeepsTheInvitationAndReportsFalse() async {
        service.incomingResult = .success([makeInvitation()])
        service.acceptError = APIError.notFound("This invitation does not exist.")
        let vm = InvitationsViewModel(service: service)
        await vm.load()

        let accepted = await vm.accept(vm.invitations[0])

        XCTAssertFalse(accepted)
        XCTAssertEqual(vm.invitations.count, 1)
        XCTAssertEqual(vm.errorMessage, "This invitation does not exist.")
    }

    func test_declineRemovesTheInvitation() async {
        service.incomingResult = .success([makeInvitation()])
        let vm = InvitationsViewModel(service: service)
        await vm.load()

        await vm.decline(vm.invitations[0])

        XCTAssertEqual(service.declined, ["s-1"])
        XCTAssertTrue(vm.invitations.isEmpty)
    }

    func test_aRefusedDeclineKeepsTheInvitation() async {
        service.incomingResult = .success([makeInvitation()])
        service.declineError = APIError.server("nope")
        let vm = InvitationsViewModel(service: service)
        await vm.load()

        await vm.decline(vm.invitations[0])

        XCTAssertEqual(vm.invitations.count, 1)
        XCTAssertEqual(vm.errorMessage, "nope")
    }
}
