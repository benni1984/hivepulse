import Foundation

protocol MoveServiceProtocol {
    func move(_ request: MoveCreateRequest) async throws -> MoveResult
    func moves(forHive hiveId: String) async throws -> [HiveMoveOut]
    func overview(from: String?, to: String?) async throws -> [HiveMoveOut]
}

/// Moving hives needs a connection: unlike an inspection, a move is not queued while offline.
struct MoveService: MoveServiceProtocol {
    private let client = APIClient.shared

    func move(_ request: MoveCreateRequest) async throws -> MoveResult {
        try await client.post("hives/move", body: request)
    }

    func moves(forHive hiveId: String) async throws -> [HiveMoveOut] {
        try await client.get("hives/" + hiveId + "/moves")
    }

    func overview(from: String?, to: String?) async throws -> [HiveMoveOut] {
        var query: [String] = []
        if let from, !from.isEmpty { query.append("from=" + from) }
        if let to, !to.isEmpty { query.append("to=" + to) }
        let suffix = query.isEmpty ? "" : "?" + query.joined(separator: "&")
        return try await client.get("hives/moves/overview" + suffix)
    }
}
