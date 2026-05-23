import Foundation

@MainActor
final class HornetViewModel: ObservableObject {
    @Published var stats: HornetStats? = nil
    @Published var nests: HornetNestGeoJSON? = nil
    @Published var sightings: [HornetSightingOut] = []
    @Published var sightingsPage = 1
    @Published var sightingsPages = 1
    @Published var isLoading = false
    @Published var errorMessage: String? = nil

    // MARK: - Trap state
    @Published var currentTrap: HornetTrapOut? = nil
    @Published var nearbyTraps: [HornetTrapNearbyOut] = []
    @Published var trapLoading = false
    @Published var trapError: String? = nil
    @Published var trapSuccess: String? = nil

    private let service: HornetServiceProtocol

    init(service: HornetServiceProtocol = HornetService()) {
        self.service = service
    }

    // MARK: - Load

    func loadStats() async {
        do { stats = try await service.getStats() }
        catch { errorMessage = error.localizedDescription }
    }

    func loadNests() async {
        isLoading = true
        defer { isLoading = false }
        do { nests = try await service.getNests() }
        catch { errorMessage = error.localizedDescription }
    }

    func loadSightings(page: Int = 1) async {
        isLoading = true
        defer { isLoading = false }
        do {
            let result = try await service.getSightings(page: page)
            sightings = page == 1 ? result.items : sightings + result.items
            sightingsPage = result.page
            sightingsPages = result.pages
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Submit

    func submitCatch(count: Int, latitude: Double? = nil, longitude: Double? = nil,
                     reporterName: String? = nil) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            _ = try await service.submitCatch(HornetCatchCreate(
                latitude: latitude, longitude: longitude,
                count: count, reporterName: reporterName))
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func submitNest(latitude: Double, longitude: Double, notes: String? = nil,
                    photoUrl: String? = nil, reporterName: String? = nil) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            _ = try await service.submitNest(HornetNestCreate(
                latitude: latitude, longitude: longitude,
                reporterName: reporterName, notes: notes, photoUrl: photoUrl))
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func submitSighting(photoUrl: String, description: String? = nil,
                        latitude: Double? = nil, longitude: Double? = nil,
                        reporterName: String? = nil) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let sighting = try await service.submitSighting(HornetSightingCreate(
                photoUrl: photoUrl, description: description,
                reporterName: reporterName, latitude: latitude, longitude: longitude))
            sightings.insert(sighting, at: 0)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func vote(sightingId: String, vote: String) async {
        do {
            try await service.vote(sightingId: sightingId, vote: vote)
            await loadSightings(page: 1)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Traps

    func loadNearbyTraps(lat: Double, lon: Double, radiusM: Int = 50) async {
        trapLoading = true
        trapError = nil
        defer { trapLoading = false }
        do {
            nearbyTraps = try await service.getNearbyTraps(lat: lat, lon: lon, radiusM: radiusM)
        } catch {
            trapError = error.localizedDescription
        }
    }

    func loadTrap(accessCode: String) async {
        trapLoading = true
        trapError = nil
        defer { trapLoading = false }
        do {
            currentTrap = try await service.getTrap(accessCode: accessCode)
        } catch {
            trapError = error.localizedDescription
        }
    }

    func createTrap(name: String, latitude: Double, longitude: Double,
                    notes: String? = nil, ownerName: String? = nil) async -> HornetTrapOut? {
        trapLoading = true
        trapError = nil
        trapSuccess = nil
        defer { trapLoading = false }
        do {
            let trap = try await service.createTrap(HornetTrapCreate(
                name: name, latitude: latitude, longitude: longitude,
                notes: notes, ownerName: ownerName))
            trapSuccess = NSLocalizedString("hornets.traps.success", comment: "")
            return trap
        } catch {
            trapError = error.localizedDescription
            return nil
        }
    }

    func addTrapCatch(accessCode: String, count: Int, date: String) async {
        trapLoading = true
        trapError = nil
        trapSuccess = nil
        defer { trapLoading = false }
        do {
            _ = try await service.addTrapCatch(
                accessCode: accessCode,
                body: HornetTrapCatchCreate(count: count, caughtOn: date))
            trapSuccess = NSLocalizedString("hornets.traps.logSuccess", comment: "")
            // Refresh trap detail
            if let code = currentTrap?.accessCode {
                currentTrap = try await service.getTrap(accessCode: code)
            }
        } catch {
            trapError = error.localizedDescription
        }
    }
}
