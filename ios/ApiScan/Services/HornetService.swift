import Foundation

protocol HornetServiceProtocol {
    func getStats() async throws -> HornetStats
    func submitCatch(_ body: HornetCatchCreate) async throws -> HornetCatchOut
    func getNests() async throws -> HornetNestGeoJSON
    func submitNest(_ body: HornetNestCreate) async throws -> HornetNestOut
    func getSightings(page: Int) async throws -> PaginatedResponse<HornetSightingOut>
    func submitSighting(_ body: HornetSightingCreate) async throws -> HornetSightingOut
    func vote(sightingId: String, vote: String) async throws
    // Traps
    func createTrap(_ body: HornetTrapCreate) async throws -> HornetTrapOut
    func getTrap(accessCode: String) async throws -> HornetTrapOut
    func addTrapCatch(accessCode: String, body: HornetTrapCatchCreate) async throws -> HornetTrapCatchOut
    func getNearbyTraps(lat: Double, lon: Double, radiusM: Int) async throws -> [HornetTrapNearbyOut]
    func getTrapsGeoJSON() async throws -> HornetTrapsGeoJSON
}

struct HornetService: HornetServiceProtocol {
    private let client = APIClient.shared

    func getStats() async throws -> HornetStats {
        try await client.getNoAuth("hornets/stats")
    }

    func submitCatch(_ body: HornetCatchCreate) async throws -> HornetCatchOut {
        try await client.postNoAuth("hornets/catches", body: body)
    }

    func getNests() async throws -> HornetNestGeoJSON {
        try await client.getNoAuth("hornets/nests")
    }

    func submitNest(_ body: HornetNestCreate) async throws -> HornetNestOut {
        try await client.postNoAuth("hornets/nests", body: body)
    }

    func getSightings(page: Int = 1) async throws -> PaginatedResponse<HornetSightingOut> {
        try await client.getNoAuth("hornets/sightings?page=\(page)&per_page=12")
    }

    func submitSighting(_ body: HornetSightingCreate) async throws -> HornetSightingOut {
        try await client.postNoAuth("hornets/sightings", body: body)
    }

    func vote(sightingId: String, vote: String) async throws {
        try await client.postVoidNoAuth(
            "hornets/sightings/\(sightingId)/vote",
            body: HornetVote(vote: vote)
        )
    }

    // MARK: - Traps

    func createTrap(_ body: HornetTrapCreate) async throws -> HornetTrapOut {
        try await client.postNoAuth("hornets/traps", body: body)
    }

    func getTrap(accessCode: String) async throws -> HornetTrapOut {
        try await client.getNoAuth("hornets/traps/\(accessCode.uppercased())")
    }

    func addTrapCatch(accessCode: String, body: HornetTrapCatchCreate) async throws -> HornetTrapCatchOut {
        try await client.postNoAuth("hornets/traps/\(accessCode.uppercased())/catches", body: body)
    }

    func getNearbyTraps(lat: Double, lon: Double, radiusM: Int = 50) async throws -> [HornetTrapNearbyOut] {
        try await client.getNoAuth("hornets/traps/nearby?lat=\(lat)&lon=\(lon)&radius_m=\(radiusM)")
    }

    func getTrapsGeoJSON() async throws -> HornetTrapsGeoJSON {
        try await client.getNoAuth("hornets/traps/geojson")
    }
}
