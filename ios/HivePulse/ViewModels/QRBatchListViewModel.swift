import Foundation

@MainActor
final class QRBatchListViewModel: ObservableObject {
    @Published var batches: [QrBatchSummary] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let service: any QrBatchServiceProtocol

    init(service: any QrBatchServiceProtocol = QrBatchService()) {
        self.service = service
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            batches = try await service.list().items
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// The server limits a batch to 1...50 codes; clamping here keeps a typo from becoming a refused request.
    func create(count: Int) async {
        do {
            _ = try await service.create(count: max(1, min(50, count)))
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// A code on a hive is how that hive is found again by scanning it, so the server keeps such a batch.
    /// Offering the action only where it can succeed spares the user a refusal.
    func canDelete(_ batch: QrBatchSummary) -> Bool {
        batch.linkedCount == 0
    }

    func delete(_ batch: QrBatchSummary) async {
        guard canDelete(batch) else { return }
        errorMessage = nil
        do {
            try await service.delete(batch.id)
            batches.removeAll { $0.id == batch.id }
        } catch {
            // Stays in the list: it was not deleted. The server's own message says why, in the user's language.
            errorMessage = error.localizedDescription
        }
    }
}
