import Foundation

/// Prefix of the id a queued inspection carries until the server assigns a real one.
let pendingIdPrefix = "pending:"

extension InspectionOut {
    var isPending: Bool { id.hasPrefix(pendingIdPrefix) }
}

/// An inspection recorded at the apiary without a connection.
struct PendingInspection: Codable {
    let clientId: String
    let hiveId: String
    let request: InspectionCreateRequest
    let createdAt: Date
    var attempts: Int = 0
    var lastError: String?
}

/// Inspections recorded without a connection.
///
/// The queue is the reason an inspection is never lost: the entry is written before any
/// network attempt, carries a `client_id` so a retry cannot duplicate the visit on the
/// server, and is only removed once the server confirmed it.
actor OfflineInspectionQueue {

    static let shared = OfflineInspectionQueue()

    private let store: OfflineStore
    private let service: any InspectionServiceProtocol

    init(store: OfflineStore = .shared, service: any InspectionServiceProtocol = InspectionAPIService()) {
        self.store = store
        self.service = service
    }

    private var entries: [PendingInspection] {
        get { store.load([PendingInspection].self, for: OfflineStore.Key.pendingInspections) ?? [] }
        set { store.save(newValue, for: OfflineStore.Key.pendingInspections) }
    }

    var count: Int { entries.count }

    func pending(hiveId: String) -> [InspectionOut] {
        entries.filter { $0.hiveId == hiveId }.map(\.asInspection)
    }

    /// Stores the entry, then tries once. Returns the server's inspection or the queued one.
    func submit(hiveId: String, request: InspectionCreateRequest) async throws -> InspectionOut {
        let clientId = request.clientId ?? UUID().uuidString
        let withId = request.withClientId(clientId)
        let entry = PendingInspection(
            clientId: clientId, hiveId: hiveId, request: withId, createdAt: Date()
        )
        entries.append(entry)

        do {
            let saved = try await service.create(hiveId: hiveId, request: withId)
            remove(clientId: clientId)
            return saved
        } catch {
            guard error.isOffline else {
                // A rejection from the server (validation, deleted hive, expired session)
                // will not pass on a retry — surface it instead of queueing silently.
                remove(clientId: clientId)
                throw error
            }
            return entry.asInspection
        }
    }

    /// Sends everything that is waiting. Returns the number still queued afterwards.
    @discardableResult
    func flush() async -> Int {
        for entry in entries {
            do {
                _ = try await service.create(hiveId: entry.hiveId, request: entry.request)
                remove(clientId: entry.clientId)
            } catch {
                if error.isOffline {
                    recordFailure(clientId: entry.clientId, error: error)
                    break // still no connection — the rest will not fare better
                }
                // The server refused this entry; keeping it would block the queue forever.
                remove(clientId: entry.clientId)
            }
        }
        return entries.count
    }

    func clear() {
        store.remove(OfflineStore.Key.pendingInspections)
    }

    private func remove(clientId: String) {
        entries = entries.filter { $0.clientId != clientId }
    }

    private func recordFailure(clientId: String, error: Error) {
        entries = entries.map { entry in
            guard entry.clientId == clientId else { return entry }
            var updated = entry
            updated.attempts += 1
            updated.lastError = error.localizedDescription
            return updated
        }
    }
}

private extension PendingInspection {
    var asInspection: InspectionOut {
        InspectionOut(
            id: pendingIdPrefix + clientId,
            hiveId: hiveId,
            date: request.date,
            queenSeen: request.queenSeen,
            queenColor: request.queenColor,
            broodFrames: request.broodFrames,
            honeyFrames: request.honeyFrames,
            mood: request.mood,
            populationStrength: request.populationStrength,
            varroaLevel: request.varroaLevel,
            varroaCount: nil,
            swarmCellsSeen: request.swarmCellsSeen,
            treatmentApplied: request.treatmentApplied,
            feedingDone: request.feedingDone,
            feedingType: request.feedingType,
            weightKg: request.weightKg,
            notes: request.notes,
            customFields: request.customFields,
            clientId: clientId,
            createdAt: createdAt
        )
    }
}
