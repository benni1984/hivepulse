import Foundation

// MARK: - The summary at the top of the apiary list

@MainActor
final class HomeSummaryViewModel: ObservableObject {
    @Published var home: HomeSummary?
    @Published var errorMessage: String?

    private let homeService: any HomeServiceProtocol
    private let treatmentService: any TreatmentServiceProtocol

    init(homeService: any HomeServiceProtocol = HomeService(),
         treatmentService: any TreatmentServiceProtocol = TreatmentService()) {
        self.homeService = homeService
        self.treatmentService = treatmentService
    }

    /// Somebody with no hives yet has nothing to be told, and the apiary list below already explains how to start.
    var isVisible: Bool { (home?.hiveCount ?? 0) > 0 }

    func load() async {
        // The apiary list is usable without it: a failed load keeps what was there and shows no error of its own.
        if let summary = try? await homeService.home() {
            home = summary
        }
    }

    func markDone(_ treatment: PlannedTreatmentOut) async {
        errorMessage = nil
        do {
            _ = try await treatmentService.markDone(treatment.id)
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// The reason as the user should read it: the translated text of a known code, or the code as the server sent it.
    static func reasonText(_ reason: String) -> String {
        let key = "home.reason." + reason
        let text = NSLocalizedString(key, comment: "")
        return text == key ? reason : text
    }
}

// MARK: - The treatments of one hive or apiary

enum TreatmentTargetKind {
    case hive(String)
    case apiary(String)
}

@MainActor
final class TreatmentsViewModel: ObservableObject {
    @Published var open: [PlannedTreatmentOut] = []
    @Published var done: [PlannedTreatmentOut] = []
    @Published var isLoading = false
    @Published var isSaving = false
    @Published var errorMessage: String?

    // The form that plans another one.
    @Published var product = ""
    @Published var dueOn = Calendar.current.date(byAdding: .day, value: 7, to: Date()) ?? Date()
    @Published var note = ""

    let target: TreatmentTargetKind
    private let service: any TreatmentServiceProtocol

    init(target: TreatmentTargetKind, service: any TreatmentServiceProtocol = TreatmentService()) {
        self.target = target
        self.service = service
    }

    private func filter(status: String) -> TreatmentFilter {
        switch target {
        case .hive(let id): return TreatmentFilter(status: status, hiveId: id, apiaryId: nil)
        case .apiary(let id): return TreatmentFilter(status: status, hiveId: nil, apiaryId: id)
        }
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            async let openOnes = service.list(filter(status: "open"))
            async let doneOnes = service.list(filter(status: "done"))
            open = try await openOnes
            // Each screen lists the treatments of its own target, and the last few that were done.
            done = Array(try await doneOnes.prefix(5))
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    var canPlan: Bool { !product.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isSaving }

    func request() -> TreatmentCreateRequest {
        let trimmedNote = note.trimmingCharacters(in: .whitespacesAndNewlines)
        var hiveId: String?
        var apiaryId: String?
        switch target {
        case .hive(let id): hiveId = id
        case .apiary(let id): apiaryId = id
        }
        return TreatmentCreateRequest(
            hiveId: hiveId, apiaryId: apiaryId,
            product: product.trimmingCharacters(in: .whitespacesAndNewlines),
            dueOn: DayFormat.wireString(from: dueOn),
            note: trimmedNote.isEmpty ? nil : trimmedNote
        )
    }

    /// True when the server took the plan; the form is emptied for the next one.
    func plan() async -> Bool {
        guard canPlan else { return false }
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }
        do {
            _ = try await service.create(request())
            product = ""
            note = ""
            dueOn = Calendar.current.date(byAdding: .day, value: 7, to: Date()) ?? Date()
            await load()
            return true
        } catch {
            // The server words the reason (only the owner may plan for an apiary, ...) in the user's language.
            errorMessage = error.localizedDescription
            return false
        }
    }

    func markDone(_ treatment: PlannedTreatmentOut) async { await act { _ = try await self.service.markDone(treatment.id) } }
    func reopen(_ treatment: PlannedTreatmentOut) async { await act { _ = try await self.service.reopen(treatment.id) } }
    func delete(_ treatment: PlannedTreatmentOut) async { await act { try await self.service.delete(treatment.id) } }

    private func act(_ action: () async throws -> Void) async {
        errorMessage = nil
        do {
            try await action()
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
