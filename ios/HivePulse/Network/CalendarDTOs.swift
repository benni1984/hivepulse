import Foundation

// MARK: - The beekeeper's year (see "Beekeeping Year" in docs/api-contract.md)

/// Where the beekeeper keeps bees, and how far that moves the calendar against central Germany.
struct RegionOut: Codable, Equatable {
    let country: String?
    let postalCode: String?
    let latitude: Double?
    let longitude: Double?
    /// Days added by hand to what the position says.
    let adjustDays: Int
    /// Days the dates move against the reference region; positive is later.
    let shiftDays: Int
    /// "postal_code", "apiary" (the first apiary with a position) or "default".
    let source: String
    /// False when a postal code was given that could not be found.
    let located: Bool

    enum CodingKeys: String, CodingKey {
        case country, latitude, longitude, source, located
        case postalCode = "postal_code"
        case adjustDays = "adjust_days"
        case shiftDays = "shift_days"
    }
}

struct RegionUpdateRequest: Encodable {
    /// An empty string clears it.
    let country: String?
    let postalCode: String?
    let adjustDays: Int?

    enum CodingKeys: String, CodingKey {
        case country
        case postalCode = "postal_code"
        case adjustDays = "adjust_days"
    }
}

struct CalendarEntryOut: Codable, Equatable, Identifiable {
    let key: String
    /// inspection, swarm, feeding, varroa, harvest, migration, bloom, care or winter
    let category: String
    let title: String
    let body: String
    /// "YYYY-MM-DD"
    let start: String
    let end: String
    /// Set when the task repeats during the entry ("at least every 9 days").
    let intervalDays: Int?
    /// A forage key (acacia, rapeseed, ...) when the entry is about one kind of honey.
    let honey: String?
    /// Whether today lies within the entry.
    let active: Bool

    var id: String { key + "|" + start }

    enum CodingKeys: String, CodingKey {
        case key, category, title, body, start, end, honey, active
        case intervalDays = "interval_days"
    }
}

struct CalendarOut: Codable {
    let region: RegionOut
    let today: String
    let start: String
    let end: String
    let entries: [CalendarEntryOut]
}
