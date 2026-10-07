import Foundation

// MARK: - The endless timeline

@MainActor
final class BeekeepingYearViewModel: ObservableObject {
    @Published private(set) var entries: [CalendarEntryOut] = []
    @Published private(set) var region: RegionOut?
    @Published private(set) var today: String
    @Published private(set) var isLoaded = false
    @Published private(set) var failed = false
    @Published private(set) var isLoadingEarlier = false
    @Published private(set) var isLoadingLater = false

    private var loadedFrom: String?
    private var loadedTo: String?
    private let service: any CalendarServiceProtocol
    private let language: String

    init(service: any CalendarServiceProtocol = CalendarService(),
         language: String = BeekeepingYear.appLanguage,
         now: Date = Date()) {
        self.service = service
        self.language = language
        self.today = DayFormat.wireString(from: now)
    }

    /// The timeline as rows: month headers, the entries and the divider for today.
    var items: [TimelineItem] { BeekeepingYear.timeline(entries, today: today) }

    /// The first stretch: from the month before this one, so there is a little to scroll back to. Also what runs
    /// again when the region changed and every date has moved.
    func load() async {
        failed = false
        let from = BeekeepingYear.firstOfMonth(today, monthsAgo: 1)
        do {
            let window = try await service.calendar(from: from, days: BeekeepingYear.windowDays + 31, language: language)
            entries = window.entries
            region = window.region
            today = window.today
            loadedFrom = window.start
            loadedTo = window.end
            isLoaded = true
        } catch {
            failed = true
        }
    }

    func loadLater() async {
        guard isLoaded, !isLoadingLater, let to = loadedTo else { return }
        isLoadingLater = true
        defer { isLoadingLater = false }
        do {
            let window = try await service.calendar(from: BeekeepingYear.addDays(to, 1),
                                                    days: BeekeepingYear.windowDays, language: language)
            entries = BeekeepingYear.merge(entries, window.entries)
            loadedTo = window.end
        } catch {
            failed = true
        }
    }

    func loadEarlier() async {
        guard isLoaded, !isLoadingEarlier, let from = loadedFrom else { return }
        isLoadingEarlier = true
        defer { isLoadingEarlier = false }
        let earlier = BeekeepingYear.addDays(from, -BeekeepingYear.windowDays)
        do {
            let window = try await service.calendar(from: earlier, days: BeekeepingYear.windowDays, language: language)
            entries = BeekeepingYear.merge(entries, window.entries)
            loadedFrom = earlier
        } catch {
            failed = true
        }
    }
}

// MARK: - The region the year is moved to

enum RegionMessage: Equatable {
    case saved
    case notLocated
    case failed
}

@MainActor
final class RegionViewModel: ObservableObject {
    @Published var country = ""
    @Published var postalCode = ""
    @Published var adjustDays = 0
    @Published private(set) var isLoaded = false
    @Published private(set) var isSaving = false
    @Published private(set) var message: RegionMessage?

    private let service: any CalendarServiceProtocol

    init(service: any CalendarServiceProtocol = CalendarService()) {
        self.service = service
    }

    func load() async {
        // Without it the year still works, only unmoved: a failed load hides the form instead of showing an error.
        guard let region = try? await service.region() else { return }
        apply(region)
        isLoaded = true
    }

    private func apply(_ region: RegionOut) {
        country = region.country ?? ""
        postalCode = region.postalCode ?? ""
        adjustDays = region.adjustDays
    }

    /// The adjustment is kept within what the server accepts.
    static func clamp(_ days: Int) -> Int { max(-28, min(28, days)) }

    func request() -> RegionUpdateRequest {
        RegionUpdateRequest(
            country: country,
            postalCode: postalCode.trimmingCharacters(in: .whitespacesAndNewlines),
            adjustDays: Self.clamp(adjustDays)
        )
    }

    /// Returns the saved region, nil (with `message` set) when it could not be saved.
    @discardableResult
    func save() async -> RegionOut? {
        isSaving = true
        message = nil
        defer { isSaving = false }
        do {
            let saved = try await service.updateRegion(request())
            apply(saved)
            message = saved.located ? .saved : .notLocated
            return saved
        } catch {
            message = .failed
            return nil
        }
    }
}
