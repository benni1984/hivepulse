import Foundation

/// Custom field definitions in either scope: `apiaryId == nil` means the user's own fields
/// (all apiaries), otherwise fields that only apply inside that apiary.
protocol FieldDefinitionManaging {
    func list(apiaryId: String?) async throws -> [FieldDefinitionOut]
    func create(apiaryId: String?, body: FieldDefinitionCreate) async throws -> FieldDefinitionOut
    func update(apiaryId: String?, id: String, body: FieldDefinitionUpdate) async throws -> FieldDefinitionOut
    func delete(apiaryId: String?, id: String) async throws
}

struct FieldDefinitionService: FieldDefinitionManaging {
    private let client = APIClient.shared

    private func base(_ apiaryId: String?) -> String {
        apiaryId.map { "apiaries/\($0)/field-definitions" } ?? "field-definitions"
    }

    func list(apiaryId: String?) async throws -> [FieldDefinitionOut] {
        try await client.get(base(apiaryId))
    }

    func create(apiaryId: String?, body: FieldDefinitionCreate) async throws -> FieldDefinitionOut {
        try await client.post(base(apiaryId), body: body)
    }

    func update(apiaryId: String?, id: String, body: FieldDefinitionUpdate) async throws -> FieldDefinitionOut {
        try await client.put("\(base(apiaryId))/\(id)", body: body)
    }

    func delete(apiaryId: String?, id: String) async throws {
        try await client.delete("\(base(apiaryId))/\(id)")
    }
}
