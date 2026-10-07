import Foundation

protocol CalendarServiceProtocol {
    func region() async throws -> RegionOut
    func updateRegion(_ request: RegionUpdateRequest) async throws -> RegionOut
    func calendar(from: String, days: Int, language: String) async throws -> CalendarOut
}

struct CalendarService: CalendarServiceProtocol {
    private let client = APIClient.shared

    func region() async throws -> RegionOut {
        try await client.get("users/me/region")
    }

    func updateRegion(_ request: RegionUpdateRequest) async throws -> RegionOut {
        try await client.put("users/me/region", body: request)
    }

    func calendar(from: String, days: Int, language: String) async throws -> CalendarOut {
        try await client.get("calendar?from=\(from)&days=\(days)&lang=\(language)")
    }
}
