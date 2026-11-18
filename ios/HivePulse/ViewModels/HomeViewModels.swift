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
    /// Free text, not a number with a unit: a dose is written the way the product is applied —
    /// "2 × 15 ml per colony", "60 g" — and a number would lose that (#477).
    @Published var amount = ""
    @Published var withdrawalDays = ""

    // The treatment record. Only an apiary has one; a single hive is not a holding.
    @Published var isMakingRecord = false
    /// Set once the record is on disk; the view shows it with Quick Look, which can print and share.
    @Published var recordURL: URL?
    @Published var recordYear = Calendar.current.component(.year, from: Date())

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

    /// Only an apiary has a record: it names a place and the colonies standing there.
    var apiaryId: String? {
        if case .apiary(let id) = target { return id }
        return nil
    }

    func makeRecord() async {
        guard let apiaryId else { return }
        isMakingRecord = true
        errorMessage = nil
        defer { isMakingRecord = false }
        do {
            let data = try await service.record(apiaryId: apiaryId, year: recordYear)
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("HivePulse-treatment-record-\(recordYear).pdf")
            try data.write(to: url, options: .atomic)
            recordURL = url
        } catch {
            // It is part of the subscription, so this can be a 403 with a sentence worth reading.
            // A download that silently does nothing is the worst way to learn that.
            errorMessage = error.localizedDescription
        }
    }

    func request() -> TreatmentCreateRequest {
        let trimmedNote = note.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedAmount = amount.trimmingCharacters(in: .whitespacesAndNewlines)
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
            note: trimmedNote.isEmpty ? nil : trimmedNote,
            // Left out rather than sent as "": "nothing written down" is not "nothing given".
            amount: trimmedAmount.isEmpty ? nil : trimmedAmount,
            withdrawalDays: Int(withdrawalDays.trimmingCharacters(in: .whitespaces))
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
            amount = ""
            withdrawalDays = ""
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
