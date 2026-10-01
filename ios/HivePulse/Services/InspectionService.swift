import Foundation

protocol InspectionServiceProtocol {
    func list(hiveId: String, page: Int) async throws -> PaginatedResponse<InspectionOut>
    func get(_ id: String) async throws -> InspectionOut
    func create(hiveId: String, request: InspectionCreateRequest) async throws -> InspectionOut
    func update(_ id: String, request: InspectionCreateRequest) async throws -> InspectionOut
    func delete(_ id: String) async throws
}

/// Talks to the API directly. The upload queue uses this one — going through
/// `InspectionService` would put a queued entry back into the queue.
struct InspectionAPIService: InspectionServiceProtocol {
    private let client = APIClient.shared

    func list(hiveId: String, page: Int = 1) async throws -> PaginatedResponse<InspectionOut> {
        try await client.get("hives/\(hiveId)/inspections?page=\(page)&per_page=20")
    }

    func get(_ id: String) async throws -> InspectionOut {
        try await client.get("inspections/\(id)")
    }

    func create(hiveId: String, request: InspectionCreateRequest) async throws -> InspectionOut {
        try await client.post("hives/\(hiveId)/inspections", body: request)
    }

    func update(_ id: String, request: InspectionCreateRequest) async throws -> InspectionOut {
        try await client.put("inspections/\(id)", body: request)
    }

    func delete(_ id: String) async throws {
        try await client.delete("inspections/\(id)")
    }
}

/// What the app uses: reads fall back to the local copy when there is no connection, and
/// recording a visit always goes through the queue so it is never lost at the apiary.
struct InspectionService: InspectionServiceProtocol {
    private let api: InspectionServiceProtocol
    private let store: OfflineStore
    private let queue: OfflineInspectionQueue

    init(api: InspectionServiceProtocol = InspectionAPIService(),
         store: OfflineStore = .shared,
         queue: OfflineInspectionQueue = .shared) {
        self.api = api
        self.store = store
        self.queue = queue
    }

    func list(hiveId: String, page: Int = 1) async throws -> PaginatedResponse<InspectionOut> {
        let pending = page == 1 ? await queue.pending(hiveId: hiveId) : []
        do {
            let response = try await api.list(hiveId: hiveId, page: page)
            store.save(response.items, for: OfflineStore.Key.inspections(hiveId: hiveId))
            return PaginatedResponse(
                items: pending + response.items,
                total: response.total + pending.count,
                page: response.page,
                perPage: response.perPage,
                pages: response.pages
            )
        } catch {
            guard error.isOffline else { throw error }
            let cached = store.load([InspectionOut].self, for: OfflineStore.Key.inspections(hiveId: hiveId)) ?? []
            if cached.isEmpty && pending.isEmpty { throw error }
            let items = pending + cached
            return PaginatedResponse(items: items, total: items.count, page: 1, perPage: items.count, pages: 1)
        }
    }

    func get(_ id: String) async throws -> InspectionOut {
        try await api.get(id)
    }

    /// Never fails for a missing connection: the visit is queued and uploaded later.
    func create(hiveId: String, request: InspectionCreateRequest) async throws -> InspectionOut {
        try await queue.submit(hiveId: hiveId, request: request)
    }

    func update(_ id: String, request: InspectionCreateRequest) async throws -> InspectionOut {
        try await api.update(id, request: request)
    }

    func delete(_ id: String) async throws {
        try await api.delete(id)
    }
}
