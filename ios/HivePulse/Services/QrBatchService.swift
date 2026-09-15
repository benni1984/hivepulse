import Foundation

protocol QrBatchServiceProtocol {
    func list(page: Int) async throws -> PaginatedResponse<QrBatchSummary>
    func get(_ id: String) async throws -> QrBatchOut
    func create(count: Int) async throws -> QrBatchOut
    func pdfData(batchId: String) async throws -> Data
}

extension QrBatchServiceProtocol {
    func list() async throws -> PaginatedResponse<QrBatchSummary> { try await list(page: 1) }
}

struct QrBatchService: QrBatchServiceProtocol {
    private let client = APIClient.shared

    func list(page: Int = 1) async throws -> PaginatedResponse<QrBatchSummary> {
        try await client.get("qr-batches?page=\(page)&per_page=20")
    }

    func get(_ id: String) async throws -> QrBatchOut {
        try await client.get("qr-batches/\(id)")
    }

    func create(count: Int) async throws -> QrBatchOut {
        try await client.post("qr-batches", body: QrBatchCreate(count: count))
    }

    /// Printable A4 PDF, fetched with the Authorization header (the endpoint rejects anonymous requests).
    func pdfData(batchId: String) async throws -> Data {
        try await client.getRawData("qr-batches/\(batchId)/pdf")
    }
}
