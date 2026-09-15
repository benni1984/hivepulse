import Foundation

@MainActor
final class QRBatchDetailViewModel: ObservableObject {
    @Published var batch: QrBatchOut?
    @Published var isLoading = false
    @Published var isDownloading = false
    /// Set once the PDF is on disk; the view presents it with Quick Look (print / share from there).
    @Published var pdfURL: URL?
    @Published var errorMessage: String?

    let batchId: String
    private let service: any QrBatchServiceProtocol

    init(batchId: String, service: any QrBatchServiceProtocol = QrBatchService()) {
        self.batchId = batchId
        self.service = service
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            batch = try await service.get(batchId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Downloads the printable PDF through the authenticated API client — the previous `Link` opened the
    /// URL without an Authorization header, which the backend rejects. Taps while a download is running
    /// are ignored (the flag is set before the first suspension point).
    func downloadPdf() async {
        guard !isDownloading else { return }
        isDownloading = true
        errorMessage = nil
        defer { isDownloading = false }
        do {
            let data = try await service.pdfData(batchId: batchId)
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("HivePulse_QR_batch_\(batchId.prefix(8)).pdf")
            try data.write(to: url, options: .atomic)
            pdfURL = url
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
