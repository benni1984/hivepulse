import Foundation

protocol HomeServiceProtocol {
    func home() async throws -> HomeSummary
}

struct HomeService: HomeServiceProtocol {
    private let client = APIClient.shared

    func home() async throws -> HomeSummary {
        try await client.get("home")
    }
}

/// Which treatments to ask for: the open ones or the done ones, optionally of one hive or one apiary.
struct TreatmentFilter {
    var status = "open"
    var hiveId: String?
    var apiaryId: String?

    var query: String {
        var parts = ["status=" + status]
        if let hiveId { parts.append("hive_id=" + hiveId) }
        if let apiaryId { parts.append("apiary_id=" + apiaryId) }
        return parts.joined(separator: "&")
    }
}

protocol TreatmentServiceProtocol {
    func list(_ filter: TreatmentFilter) async throws -> [PlannedTreatmentOut]
    func create(_ request: TreatmentCreateRequest) async throws -> PlannedTreatmentOut
    func markDone(_ id: String) async throws -> PlannedTreatmentOut
    func reopen(_ id: String) async throws -> PlannedTreatmentOut
    func delete(_ id: String) async throws
}

private struct TreatmentEmptyBody: Encodable {}

struct TreatmentService: TreatmentServiceProtocol {
    private let client = APIClient.shared

    func list(_ filter: TreatmentFilter) async throws -> [PlannedTreatmentOut] {
        try await client.get("treatments?" + filter.query)
    }

    func create(_ request: TreatmentCreateRequest) async throws -> PlannedTreatmentOut {
        try await client.post("treatments", body: request)
    }

    func markDone(_ id: String) async throws -> PlannedTreatmentOut {
        try await client.post("treatments/" + id + "/done", body: TreatmentEmptyBody())
    }

    func reopen(_ id: String) async throws -> PlannedTreatmentOut {
        try await client.post("treatments/" + id + "/reopen", body: TreatmentEmptyBody())
    }

    func delete(_ id: String) async throws {
        try await client.delete("treatments/" + id)
    }
}
