import Foundation

/// What is being shared: a whole apiary, or one hive.
enum ShareTargetKind {
    case apiary(String)
    case hive(String)

    var query: String {
        switch self {
        case .apiary(let id): return "apiary_id=" + id
        case .hive(let id): return "hive_id=" + id
        }
    }
}

protocol SharingServiceProtocol {
    func shares(for target: ShareTargetKind) async throws -> [ShareOut]
    func invite(email: String, to target: ShareTargetKind) async throws -> ShareOut
    func incoming() async throws -> [IncomingShareOut]
    func accept(_ id: String) async throws
    func decline(_ id: String) async throws
    /// For an invitation that went to an address without an account: the token comes from the email's link.
    func acceptByToken(_ token: String) async throws -> IncomingShareOut
    /// The owner removes a collaborator or withdraws an invitation, or a collaborator leaves.
    func remove(_ id: String) async throws
}

private struct SharingEmptyBody: Encodable {}

struct SharingService: SharingServiceProtocol {
    private let client = APIClient.shared

    func shares(for target: ShareTargetKind) async throws -> [ShareOut] {
        try await client.get("shares?" + target.query)
    }

    func invite(email: String, to target: ShareTargetKind) async throws -> ShareOut {
        let body: ShareCreateRequest
        switch target {
        case .apiary(let id): body = ShareCreateRequest(email: email, apiaryId: id, hiveId: nil)
        case .hive(let id): body = ShareCreateRequest(email: email, apiaryId: nil, hiveId: id)
        }
        return try await client.post("shares", body: body)
    }

    func incoming() async throws -> [IncomingShareOut] {
        try await client.get("shares/incoming")
    }

    func accept(_ id: String) async throws {
        try await client.postVoid("shares/" + id + "/accept", body: SharingEmptyBody())
    }

    func decline(_ id: String) async throws {
        try await client.postVoid("shares/" + id + "/decline", body: SharingEmptyBody())
    }

    func acceptByToken(_ token: String) async throws -> IncomingShareOut {
        try await client.post("shares/accept-by-token", body: ShareTokenRequest(token: token))
    }

    func remove(_ id: String) async throws {
        try await client.delete("shares/" + id)
    }
}
