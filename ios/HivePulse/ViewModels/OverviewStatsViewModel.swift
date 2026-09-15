import Foundation

@MainActor
final class OverviewStatsViewModel: ObservableObject {
    static let presets = ["30d", "90d", "365d", "all"]

    /// Last year by default, same as the web "My Statistics" page.
    @Published var preset = "365d"
    @Published var stats: OverviewStats?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let service: any OverviewStatsProviding

    init(service: any OverviewStatsProviding = StatsService()) {
        self.service = service
    }

    /// Keeps the previous numbers on screen while a new period loads and if loading fails.
    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            stats = try await service.overview(preset: preset, from: nil, to: nil)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
