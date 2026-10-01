import Foundation

protocol ApiaryServiceProtocol {
    func list(page: Int) async throws -> PaginatedResponse<ApiaryOut>
    func get(_ id: String) async throws -> ApiaryOut
    func create(name: String, description: String?, latitude: Double?, longitude: Double?, address: String?, isPublic: Bool) async throws -> ApiaryOut
    func update(_ id: String, name: String?, description: String?, latitude: Double?, longitude: Double?, address: String?, isPublic: Bool?) async throws -> ApiaryOut
    func delete(_ id: String) async throws
    func fieldDefinitions(_ apiaryId: String) async throws -> [FieldDefinitionOut]
    func createFieldDefinition(_ apiaryId: String, body: FieldDefinitionCreate) async throws -> FieldDefinitionOut
    func deleteFieldDefinition(_ apiaryId: String, fieldId: String) async throws
    func userFieldDefinitions() async throws -> [FieldDefinitionOut]
}

extension ApiaryServiceProtocol {
    func list() async throws -> PaginatedResponse<ApiaryOut> { try await list(page: 1) }
}

struct ApiaryService: ApiaryServiceProtocol {
    private let client = APIClient.shared
    private let store: OfflineStore

    init(store: OfflineStore = .shared) { self.store = store }

    /// Network first; the cached list is what keeps the app usable at the apiary.
    func list(page: Int = 1) async throws -> PaginatedResponse<ApiaryOut> {
        do {
            let response: PaginatedResponse<ApiaryOut> = try await client.get("apiaries?page=\(page)&per_page=50")
            if page == 1 { store.save(response.items, for: OfflineStore.Key.apiaries) }
            return response
        } catch {
            guard error.isOffline, page == 1,
                  let cached = store.load([ApiaryOut].self, for: OfflineStore.Key.apiaries),
                  !cached.isEmpty
            else { throw error }
            return PaginatedResponse(items: cached, total: cached.count, page: 1, perPage: cached.count, pages: 1)
        }
    }

    func get(_ id: String) async throws -> ApiaryOut {
        do {
            return try await client.get("apiaries/\(id)")
        } catch {
            guard error.isOffline,
                  let cached = store.load([ApiaryOut].self, for: OfflineStore.Key.apiaries)?.first(where: { $0.id == id })
            else { throw error }
            return cached
        }
    }

    func create(name: String, description: String?, latitude: Double?, longitude: Double?, address: String?, isPublic: Bool) async throws -> ApiaryOut {
        let body = ApiaryCreate(name: name, description: description, latitude: latitude, longitude: longitude, address: address, isPublic: isPublic)
        return try await client.post("apiaries", body: body)
    }

    func update(_ id: String, name: String?, description: String?, latitude: Double?, longitude: Double?, address: String?, isPublic: Bool?) async throws -> ApiaryOut {
        let body = ApiaryCreate(name: name ?? "", description: description, latitude: latitude, longitude: longitude, address: address, isPublic: isPublic)
        return try await client.put("apiaries/\(id)", body: body)
    }

    func delete(_ id: String) async throws {
        try await client.delete("apiaries/\(id)")
    }

    func fieldDefinitions(_ apiaryId: String) async throws -> [FieldDefinitionOut] {
        let key = OfflineStore.Key.fieldDefinitions(apiaryId: apiaryId)
        do {
            let definitions: [FieldDefinitionOut] = try await client.get("apiaries/\(apiaryId)/field-definitions")
            store.save(definitions, for: key)
            return definitions
        } catch {
            guard error.isOffline, let cached = store.load([FieldDefinitionOut].self, for: key) else { throw error }
            return cached
        }
    }

    func createFieldDefinition(_ apiaryId: String, body: FieldDefinitionCreate) async throws -> FieldDefinitionOut {
        try await client.post("apiaries/\(apiaryId)/field-definitions", body: body)
    }

    func deleteFieldDefinition(_ apiaryId: String, fieldId: String) async throws {
        try await client.delete("apiaries/\(apiaryId)/field-definitions/\(fieldId)")
    }

    func userFieldDefinitions() async throws -> [FieldDefinitionOut] {
        let key = OfflineStore.Key.fieldDefinitions(apiaryId: nil)
        do {
            let definitions: [FieldDefinitionOut] = try await client.get("field-definitions")
            store.save(definitions, for: key)
            return definitions
        } catch {
            guard error.isOffline, let cached = store.load([FieldDefinitionOut].self, for: key) else { throw error }
            return cached
        }
    }
}
