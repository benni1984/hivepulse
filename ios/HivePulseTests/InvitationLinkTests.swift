import XCTest
@testable import HivePulse

final class InvitationLinkTests: XCTestCase {

    private let token = "q7Zk2m-XfT9wRb3LpN8sVd1Ye5HcUa0JgIoW4tK6xPE"

    func test_theTokenIsFoundInTheWholeLinkFromTheEmail() {
        XCTAssertEqual(InvitationLink.token(from: "https://hivepulse.multihead.de/dashboard/invitations?token=" + token), token)
    }

    func test_theTokenIsFoundWhenTheLinkIsPastedWithTextAroundIt() {
        XCTAssertEqual(InvitationLink.token(from: "Open this: https://x.example/i?token=" + token + " thanks"), token)
    }

    func test_theTokenStopsAtTheNextQueryParameter() {
        XCTAssertEqual(InvitationLink.token(from: "https://x.example/i?token=" + token + "&utm=mail"), token)
    }

    func test_aBareTokenIsAccepted() {
        XCTAssertEqual(InvitationLink.token(from: "  " + token + "\n"), token)
    }

    func test_somethingTooShortOrOddIsNotAToken() {
        XCTAssertNil(InvitationLink.token(from: ""))
        XCTAssertNil(InvitationLink.token(from: "   "))
        XCTAssertNil(InvitationLink.token(from: "hello"))
        XCTAssertNil(InvitationLink.token(from: "https://x.example/i?token=short"))
        XCTAssertNil(InvitationLink.token(from: "https://x.example/page"))
        XCTAssertNil(InvitationLink.token(from: "not a token because it has spaces in it"))
    }
}
