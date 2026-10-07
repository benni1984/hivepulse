import Foundation

// MARK: - Taking hives elsewhere

/// The form that moves hives out of one apiary: which hives, to where, when, for which forage.
@MainActor
final class MoveHivesViewModel: ObservableObject {
    /// What the target picker offers besides "a new place".
    static let newPlace = "__new__"
    static let otherForage = "__other__"

    let apiaryId: String
    let hives: [HiveOut]

    @Published var targets: [ApiaryOut] = []
    @Published var selected: Set<String> = []
    @Published var target = ""
    @Published var newName = ""
    @Published var newAddress = ""
    @Published var movedOn = Date()
    @Published var forage = ""
    @Published var otherForage = ""
    @Published var note = ""
    @Published var isSubmitting = false
    @Published var errorMessage: String?

    private let moveService: any MoveServiceProtocol
    private let apiaryService: any ApiaryServiceProtocol

    init(apiaryId: String, hives: [HiveOut],
         moveService: any MoveServiceProtocol = MoveService(),
         apiaryService: any ApiaryServiceProtocol = ApiaryService()) {
        self.apiaryId = apiaryId
        self.hives = hives
        self.moveService = moveService
        self.apiaryService = apiaryService
    }

    /// The caller's own other apiaries: not where the hives already are, and not somebody else's.
    func loadTargets() async {
        if let page = try? await apiaryService.list() {
            targets = page.items.filter { $0.id != apiaryId && $0.isOwner }
        }
    }

    var allSelected: Bool { !hives.isEmpty && selected.count == hives.count }

    func toggleAll() {
        selected = allSelected ? [] : Set(hives.map(\.id))
    }

    func toggle(_ id: String) {
        if selected.contains(id) { selected.remove(id) } else { selected.insert(id) }
    }

    var canSubmit: Bool {
        guard !selected.isEmpty, !isSubmitting else { return false }
        if target == Self.newPlace { return !newName.trimmingCharacters(in: .whitespaces).isEmpty }
        return !target.isEmpty
    }

    /// The forage to send: a chosen key, the text typed under "other", or nothing.
    var forageValue: String? {
        let value = forage == Self.otherForage ? otherForage.trimmingCharacters(in: .whitespaces) : forage
        return value.isEmpty ? nil : value
    }

    func request() -> MoveCreateRequest {
        let trimmedNote = note.trimmingCharacters(in: .whitespacesAndNewlines)
        let address = newAddress.trimmingCharacters(in: .whitespaces)
        return MoveCreateRequest(
            hiveIds: hives.map(\.id).filter { selected.contains($0) },
            toApiaryId: target == Self.newPlace ? nil : target,
            newApiary: target == Self.newPlace
                ? NewApiaryForMove(name: newName.trimmingCharacters(in: .whitespaces), address: address.isEmpty ? nil : address)
                : nil,
            movedOn: Self.dayString(movedOn),
            forage: forageValue,
            note: trimmedNote.isEmpty ? nil : trimmedNote
        )
    }

    /// The server's day format, in the phone's own calendar day: a move at 23:30 belongs to that evening.
    static func dayString(_ date: Date) -> String {
        let parts = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 1970, parts.month ?? 1, parts.day ?? 1)
    }

    /// Returns the result when the server took the move, nil (with the reason in `errorMessage`) when not.
    func submit() async -> MoveResult? {
        guard canSubmit else { return nil }
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }
        do {
            return try await moveService.move(request())
        } catch {
            // The server words the reason (only the owner may move, nothing to move, ...) in the user's language.
            errorMessage = error.localizedDescription
            return nil
        }
    }
}

// MARK: - Where a hive has stood

@MainActor
final class HiveMovesViewModel: ObservableObject {
    @Published var moves: [HiveMoveOut] = []
    @Published var routes: [MoveRoute] = []
    @Published var isLoading = false
    @Published var loaded = false

    let hiveId: String
    private let service: any MoveServiceProtocol

    init(hiveId: String, service: any MoveServiceProtocol = MoveService()) {
        self.hiveId = hiveId
        self.service = service
    }

    func load() async {
        isLoading = true
        defer { isLoading = false; loaded = true }
        // The history is a nicety on the hive page: failing to load it reads as "no moves", not as an error.
        moves = (try? await service.moves(forHive: hiveId)) ?? []
        routes = MoveRoutes.build(from: moves)
    }
}

// MARK: - The map of all journeys

@MainActor
final class MovesOverviewViewModel: ObservableObject {
    @Published var moves: [HiveMoveOut] = []
    @Published var routes: [MoveRoute] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var from: Date?
    @Published var to: Date?

    private let service: any MoveServiceProtocol

    init(service: any MoveServiceProtocol = MoveService()) {
        self.service = service
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            moves = try await service.overview(
                from: from.map(MoveHivesViewModel.dayString),
                to: to.map(MoveHivesViewModel.dayString)
            )
            routes = MoveRoutes.build(from: moves)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
