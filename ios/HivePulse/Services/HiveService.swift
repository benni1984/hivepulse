import Foundation

protocol HiveServiceProtocol {
    func listForApiary(_ apiaryId: String, page: Int) async throws -> PaginatedResponse<HiveOut>
    func get(_ id: String) async throws -> HiveOut
    func initialize(request: HiveInitializeRequest) async throws -> HiveOut
    func create(apiaryId: String, request: HiveCreateRequest) async throws -> HiveOut
    func update(_ id: String, request: HiveUpdateRequest) async throws -> HiveOut
    func delete(_ id: String) async throws
    func resolveQR(token: String) async throws -> QRScanResult
    func qrImageData(hiveId: String) async throws -> Data
}

extension HiveServiceProtocol {
    func listForApiary(_ apiaryId: String) async throws -> PaginatedResponse<HiveOut> {
        try await listForApiary(apiaryId, page: 1)
    }
}

struct HiveService: HiveServiceProtocol {
    private let client = APIClient.shared
    private let store: OfflineStore

    init(store: OfflineStore = .shared) { self.store = store }

    func listForApiary(_ apiaryId: String, page: Int = 1) async throws -> PaginatedResponse<HiveOut> {
        do {
            let response: PaginatedResponse<HiveOut> = try await client.get("apiaries/\(apiaryId)/hives?page=\(page)&per_page=50")
            if page == 1 {
                store.save(response.items, for: OfflineStore.Key.hives(apiaryId: apiaryId))
                store.rememberHives(response.items)
            }
            return response
        } catch {
            guard error.isOffline, page == 1,
                  let cached = store.load([HiveOut].self, for: OfflineStore.Key.hives(apiaryId: apiaryId)),
                  !cached.isEmpty
            else { throw error }
            return PaginatedResponse(items: cached, total: cached.count, page: 1, perPage: cached.count, pages: 1)
        }
    }

    func get(_ id: String) async throws -> HiveOut {
        do {
            let hive: HiveOut = try await client.get("hives/\(id)")
            store.rememberHives([hive])
            return hive
        } catch {
            guard error.isOffline, let cached = store.hive(id: id) else { throw error }
            return cached
        }
    }

    func initialize(request: HiveInitializeRequest) async throws -> HiveOut {
        try await client.post("hives/initialize", body: request)
    }

    func create(apiaryId: String, request: HiveCreateRequest) async throws -> HiveOut {
        try await client.post("apiaries/\(apiaryId)/hives", body: request)
    }

    func update(_ id: String, request: HiveUpdateRequest) async throws -> HiveOut {
        try await client.put("hives/\(id)", body: request)
    }

    func delete(_ id: String) async throws {
        try await client.delete("hives/\(id)")
    }

    /// Scanning a hive QR code works offline as long as that hive was loaded before.
    func resolveQR(token: String) async throws -> QRScanResult {
        // getRawData, not get(): `get` is generic over Decodable, so `Data` there decodes a base64
        // *string* — against the real backend that threw "isn't in the correct format" for every scan.
        let data: Data
        do {
            data = try await client.getRawData("hives/by-qr/\(token)")
        } catch {
            guard error.isOffline, let cached = store.hive(qrToken: token) else { throw error }
            return .linked(cached)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .hivePulseBackend
        if let unlinked = try? decoder.decode(QRUnlinkedResponse.self, from: data), unlinked.status == "unlinked" {
            return .unlinked(token: unlinked.token)
        }
        let hive = try decoder.decode(HiveOut.self, from: data)
        store.rememberHives([hive])
        return .linked(hive)
    }

    func qrImageData(hiveId: String) async throws -> Data {
        try await client.getRawData("hives/\(hiveId)/qr")
    }
}
