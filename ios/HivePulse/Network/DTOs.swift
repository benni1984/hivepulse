import Foundation

// MARK: - JSON Value (dynamic custom fields)
enum JSONValue: Codable, Hashable {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)
    case null

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null; return }
        if let v = try? c.decode(Bool.self)   { self = .bool(v);   return }
        if let v = try? c.decode(Int.self)    { self = .int(v);    return }
        if let v = try? c.decode(Double.self) { self = .double(v); return }
        if let v = try? c.decode(String.self) { self = .string(v); return }
        throw DecodingError.typeMismatch(JSONValue.self,
            .init(codingPath: decoder.codingPath, debugDescription: "Unexpected JSON type"))
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let v): try c.encode(v)
        case .int(let v):    try c.encode(v)
        case .double(let v): try c.encode(v)
        case .bool(let v):   try c.encode(v)
        case .null:          try c.encodeNil()
        }
    }

    var displayString: String {
        switch self {
        case .string(let v): return v
        case .int(let v):    return "\(v)"
        case .double(let v): return String(format: "%.2f", v)
        case .bool(let v):   return v ? "✓" : "✗"
        case .null:          return "—"
        }
    }
}

// MARK: - Pagination
struct PaginatedResponse<T: Codable>: Codable {
    let items: [T]
    let total: Int
    let page: Int
    let perPage: Int
    let pages: Int

    enum CodingKeys: String, CodingKey {
        case items, total, page, pages
        case perPage = "per_page"
    }
}

// MARK: - Auth
struct RegisterRequest: Encodable {
    let email: String
    let password: String
    let name: String
    let locale: String
}

struct SocialSignInRequest: Encodable {
    let provider: String
    let idToken: String
    /// Apple sends the name once, in the very first authorization and never in the token, so
    /// it travels with this request or it is lost for good.
    let name: String?
    /// Apple's one-time code from the same authorization. The server trades it for a token it
    /// can hand back to Apple when the account is deleted, which Apple requires.
    var authorizationCode: String? = nil

    enum CodingKeys: String, CodingKey {
        case provider
        case idToken = "id_token"
        case name
        case authorizationCode = "authorization_code"
    }
}

struct SignInProvider: Decodable {
    let clientId: String

    enum CodingKeys: String, CodingKey { case clientId = "client_id" }
}

struct SignInProviders: Decodable {
    let google: SignInProvider?
    let apple: SignInProvider?
}

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct RefreshRequest: Encodable {
    let refreshToken: String
    enum CodingKeys: String, CodingKey { case refreshToken = "refresh_token" }
}

struct LogoutRequest: Encodable {
    let refreshToken: String
    enum CodingKeys: String, CodingKey { case refreshToken = "refresh_token" }
}

struct TokenResponse: Decodable {
    let accessToken: String
    let refreshToken: String
    let user: UserOut
    enum CodingKeys: String, CodingKey {
        case user
        case accessToken  = "access_token"
        case refreshToken = "refresh_token"
    }
}

struct AccessTokenResponse: Decodable {
    let accessToken: String
    enum CodingKeys: String, CodingKey { case accessToken = "access_token" }
}

// MARK: - Users
struct UserOut: Codable, Identifiable {
    let id: String
    let email: String
    let name: String
    let locale: String
    let createdAt: Date
    let isAdmin: Bool
    let isSupporter: Bool
    /// False for an account made through Apple or Google, which never had a password.
    /// Optional with a default so older responses and the memberwise initialiser still work.
    var hasPassword: Bool? = nil
    /// Settings shows "Change password" only where there is something to change.
    var canChangePassword: Bool { hasPassword ?? true }
    enum CodingKeys: String, CodingKey {
        case id, email, name, locale
        case createdAt   = "created_at"
        case isAdmin     = "is_admin"
        case isSupporter = "is_supporter"
        case hasPassword = "has_password"
    }
}

struct UserUpdateRequest: Encodable {
    let name: String?
    let locale: String?
}

struct PasswordChangeRequest: Encodable {
    let password: String
    let currentPassword: String
    enum CodingKeys: String, CodingKey {
        case password
        case currentPassword = "current_password"
    }
}

// MARK: - Reminder Settings

struct ReminderSettingsOut: Codable {
    let reminderEnabled: Bool
    let reminderIntervalDays: Int
    let reminderSeasonStart: Int
    let reminderSeasonEnd: Int
    let pushTokenApns: String?
    let pushTokenFcm: String?
    /// Email as an extra reminder channel, additive to push (optional so older responses still decode).
    var reminderEmailEnabled: Bool? = nil
    enum CodingKeys: String, CodingKey {
        case pushTokenApns       = "push_token_apns"
        case pushTokenFcm        = "push_token_fcm"
        case reminderEnabled     = "reminder_enabled"
        case reminderIntervalDays = "reminder_interval_days"
        case reminderSeasonStart  = "reminder_season_start"
        case reminderSeasonEnd    = "reminder_season_end"
        case reminderEmailEnabled = "reminder_email_enabled"
    }
}

struct ReminderSettingsUpdate: Encodable {
    var reminderEnabled: Bool?
    var reminderIntervalDays: Int?
    var reminderSeasonStart: Int?
    var reminderSeasonEnd: Int?
    var reminderEmailEnabled: Bool?
    enum CodingKeys: String, CodingKey {
        case reminderEnabled      = "reminder_enabled"
        case reminderIntervalDays = "reminder_interval_days"
        case reminderSeasonStart  = "reminder_season_start"
        case reminderSeasonEnd    = "reminder_season_end"
        case reminderEmailEnabled = "reminder_email_enabled"
    }
}

struct PushTokenRegister: Encodable {
    let platform: String  // "ios" or "android"
    let token: String
}

// MARK: - Field Definitions
struct FieldDefinitionOut: Codable, Identifiable {
    let id: String
    let scope: String
    let apiaryId: String?
    let target: String
    let name: String
    let type: String
    let options: [String]
    let required: Bool
    let sortOrder: Int
    enum CodingKeys: String, CodingKey {
        case id, scope, target, name, options, required
        case apiaryId  = "apiary_id"
        case type      = "type"
        case sortOrder = "sort_order"
    }
}

struct FieldDefinitionCreate: Encodable {
    let target: String
    let name: String
    let type: String
    let options: [String]
    let required: Bool
    let sortOrder: Int
    enum CodingKeys: String, CodingKey {
        case target, name, options, required
        case type      = "type"
        case sortOrder = "sort_order"
    }
}

/// Target and type are fixed after creation; nil fields are left out of the request and stay unchanged.
struct FieldDefinitionUpdate: Encodable {
    let name: String?
    let options: [String]?
    let required: Bool?
}

// MARK: - Apiaries
struct ApiaryOut: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let latitude: Double?
    let longitude: Double?
    let address: String?
    let hiveCount: Int
    let createdAt: Date
    /// Shown on the public map and counted in community statistics. Optional so older payloads still decode.
    var isPublic: Bool? = nil
    /// owner, shared or partial (see "Sharing" in the API contract). Optional so older payloads still decode.
    var access: String? = nil
    /// Whose apiary it is, when it is not the caller's.
    var ownerName: String? = nil
    enum CodingKeys: String, CodingKey {
        case id, name, description, latitude, longitude, address, access
        case hiveCount = "hive_count"
        case createdAt = "created_at"
        case isPublic = "is_public"
        case ownerName = "owner_name"
    }
}

extension ApiaryOut {
    /// A payload without the field comes from a server that only ever returned the caller's own apiaries.
    var isOwner: Bool { access == nil || access == "owner" }
    /// Somebody who was given single hives can work on those, but not on the apiary around them.
    var canEdit: Bool { access != "partial" }
}

struct ApiaryCreate: Encodable {
    let name: String
    let description: String?
    let latitude: Double?
    let longitude: Double?
    let address: String?
    /// nil leaves visibility unchanged on update (the key is omitted).
    var isPublic: Bool? = nil
    enum CodingKeys: String, CodingKey {
        case name, description, latitude, longitude, address
        case isPublic = "is_public"
    }
}

// MARK: - QR Batches
struct QrTokenOut: Codable, Identifiable {
    let token: String
    let linkedHiveId: String?
    var id: String { token }
    var isLinked: Bool { linkedHiveId != nil }
    enum CodingKeys: String, CodingKey {
        case token
        case linkedHiveId = "linked_hive_id"
    }
}

struct QrBatchOut: Codable, Identifiable {
    let id: String
    let count: Int
    let createdAt: Date
    let tokens: [QrTokenOut]
    enum CodingKeys: String, CodingKey {
        case id, count, tokens
        case createdAt = "created_at"
    }
}

extension HiveOut {
    var isOwner: Bool { access == nil || access == "owner" }
}

// MARK: - Sharing

struct ShareTarget: Codable {
    /// "apiary" or "hive"
    let type: String
    let id: String
    let name: String
}

struct ShareOut: Codable, Identifiable {
    let id: String
    let email: String
    /// "pending" or "accepted"
    let status: String
    let target: ShareTarget
    let collaboratorName: String?
    let createdAt: Date
    let acceptedAt: Date?
    enum CodingKeys: String, CodingKey {
        case id, email, status, target
        case collaboratorName = "collaborator_name"
        case createdAt = "created_at"
        case acceptedAt = "accepted_at"
    }
}

struct IncomingShareOut: Codable, Identifiable {
    let id: String
    let ownerName: String
    let target: ShareTarget
    /// Set when the target is a hive, so the invitation can say where it sits.
    let apiaryName: String?
    let createdAt: Date
    enum CodingKeys: String, CodingKey {
        case id, target
        case ownerName = "owner_name"
        case apiaryName = "apiary_name"
        case createdAt = "created_at"
    }
}

// MARK: - Home summary and planned treatments

struct TreatmentTarget: Codable, Equatable {
    /// "hive" or "apiary"
    let type: String
    let id: String
    let name: String
}

struct PlannedTreatmentOut: Codable, Identifiable {
    let id: String
    let target: TreatmentTarget
    let apiaryName: String?
    let product: String
    /// "YYYY-MM-DD"
    let dueOn: String
    let note: String?
    let doneOn: String?
    let overdue: Bool
    let createdByName: String?
    let createdAt: Date
    enum CodingKeys: String, CodingKey {
        case id, target, product, note, overdue
        case apiaryName = "apiary_name"
        case dueOn = "due_on"
        case doneOn = "done_on"
        case createdByName = "created_by_name"
        case createdAt = "created_at"
    }
}

struct TreatmentCreateRequest: Encodable {
    let hiveId: String?
    let apiaryId: String?
    let product: String
    let dueOn: String
    let note: String?
    enum CodingKeys: String, CodingKey {
        case product, note
        case hiveId = "hive_id"
        case apiaryId = "apiary_id"
        case dueOn = "due_on"
    }
}

struct HomeInspectionItem: Codable, Equatable {
    let hiveId: String
    let hiveName: String
    let apiaryName: String
    let lastInspectionOn: String?
    let dueOn: String
    let overdueDays: Int
    enum CodingKeys: String, CodingKey {
        case hiveId = "hive_id"
        case hiveName = "hive_name"
        case apiaryName = "apiary_name"
        case lastInspectionOn = "last_inspection_on"
        case dueOn = "due_on"
        case overdueDays = "overdue_days"
    }
}

struct HomeInspections: Codable {
    let intervalDays: Int
    let overdueCount: Int
    let dueSoonCount: Int
    let next: [HomeInspectionItem]
    enum CodingKeys: String, CodingKey {
        case next
        case intervalDays = "interval_days"
        case overdueCount = "overdue_count"
        case dueSoonCount = "due_soon_count"
    }
}

struct HomeAttentionItem: Codable, Equatable {
    let hiveId: String
    let hiveName: String
    let apiaryName: String
    /// "alert" or "watch"
    let status: String
    let reasons: [String]
    enum CodingKeys: String, CodingKey {
        case status, reasons
        case hiveId = "hive_id"
        case hiveName = "hive_name"
        case apiaryName = "apiary_name"
    }
}

struct HomeHealth: Codable {
    let ok: Int
    let watch: Int
    let alert: Int
    let unknown: Int
    let attention: [HomeAttentionItem]
}

struct HomeTreatments: Codable {
    let openCount: Int
    let overdueCount: Int
    let upcoming: [PlannedTreatmentOut]
    enum CodingKeys: String, CodingKey {
        case upcoming
        case openCount = "open_count"
        case overdueCount = "overdue_count"
    }
}

struct HomeAd: Codable, Equatable {
    let id: String
    let label: String
    let title: String
    let body: String
    let url: String?
}

struct HomeSummary: Codable {
    let today: String
    let inSeason: Bool
    let apiaryCount: Int
    let hiveCount: Int
    let inspections: HomeInspections
    let health: HomeHealth
    let treatments: HomeTreatments
    let ad: HomeAd?
    enum CodingKeys: String, CodingKey {
        case today, inspections, health, treatments, ad
        case inSeason = "in_season"
        case apiaryCount = "apiary_count"
        case hiveCount = "hive_count"
    }
}

// MARK: - Moving hives

struct MovePlace: Codable, Equatable {
    let apiaryId: String?
    let name: String
    let latitude: Double?
    let longitude: Double?
    enum CodingKeys: String, CodingKey {
        case name, latitude, longitude
        case apiaryId = "apiary_id"
    }
}

struct HiveMoveOut: Codable, Identifiable {
    let id: String
    let hiveId: String
    let hiveName: String
    /// "YYYY-MM-DD"
    let movedOn: String
    let forage: String?
    let note: String?
    let from: MovePlace
    let to: MovePlace
    let createdByName: String?
    let createdAt: Date
    enum CodingKeys: String, CodingKey {
        case id, forage, note, from, to
        case hiveId = "hive_id"
        case hiveName = "hive_name"
        case movedOn = "moved_on"
        case createdByName = "created_by_name"
        case createdAt = "created_at"
    }
}

struct NewApiaryForMove: Encodable {
    let name: String
    let address: String?
    var latitude: Double? = nil
    var longitude: Double? = nil
}

struct MoveCreateRequest: Encodable {
    let hiveIds: [String]
    let toApiaryId: String?
    let newApiary: NewApiaryForMove?
    let movedOn: String?
    let forage: String?
    let note: String?
    enum CodingKeys: String, CodingKey {
        case forage, note
        case hiveIds = "hive_ids"
        case toApiaryId = "to_apiary_id"
        case newApiary = "new_apiary"
        case movedOn = "moved_on"
    }
}

struct MoveResult: Codable {
    let moved: Int
    let apiary: ApiaryOut
    let moves: [HiveMoveOut]
}

struct ShareTokenRequest: Encodable {
    let token: String
}

struct ShareCreateRequest: Encodable {
    let email: String
    let apiaryId: String?
    let hiveId: String?
    enum CodingKeys: String, CodingKey {
        case email
        case apiaryId = "apiary_id"
        case hiveId = "hive_id"
    }
}

struct QrBatchSummary: Codable, Identifiable {
    let id: String
    let count: Int
    let createdAt: Date
    let linkedCount: Int
    enum CodingKeys: String, CodingKey {
        case id, count
        case createdAt   = "created_at"
        case linkedCount = "linked_count"
    }
}

struct QrBatchCreate: Encodable {
    let count: Int
}

// MARK: - Hives
struct HiveOut: Codable, Identifiable {
    let id: String
    let qrToken: String
    let apiaryId: String
    let name: String
    let hiveType: String
    let latitude: Double?
    let longitude: Double?
    let acquisitionDate: String?
    let notes: String?
    let customFields: [String: JSONValue]
    let initializedAt: Date
    let lastInspectionAt: Date?
    let createdAt: Date
    /// owner or shared. Optional so older payloads still decode.
    var access: String? = nil
    enum CodingKeys: String, CodingKey {
        case id, name, latitude, longitude, notes, access
        case qrToken        = "qr_token"
        case apiaryId       = "apiary_id"
        case hiveType       = "hive_type"
        case acquisitionDate = "acquisition_date"
        case customFields   = "custom_fields"
        case initializedAt  = "initialized_at"
        case lastInspectionAt = "last_inspection_at"
        case createdAt      = "created_at"
    }
}

struct HiveInitializeRequest: Encodable {
    let qrToken: String
    let apiaryId: String
    let name: String
    let hiveType: String
    let latitude: Double?
    let longitude: Double?
    let acquisitionDate: String?
    let notes: String?
    let customFields: [String: JSONValue]
    enum CodingKeys: String, CodingKey {
        case name, latitude, longitude, notes
        case qrToken        = "qr_token"
        case apiaryId       = "apiary_id"
        case hiveType       = "hive_type"
        case acquisitionDate = "acquisition_date"
        case customFields   = "custom_fields"
    }
}

struct HiveUpdateRequest: Encodable {
    let apiaryId: String?
    let name: String?
    let hiveType: String?
    let latitude: Double?
    let longitude: Double?
    let acquisitionDate: String?
    let notes: String?
    let customFields: [String: JSONValue]?
    enum CodingKeys: String, CodingKey {
        case name, latitude, longitude, notes
        case apiaryId       = "apiary_id"
        case hiveType       = "hive_type"
        case acquisitionDate = "acquisition_date"
        case customFields   = "custom_fields"
    }
}

enum QRScanResult {
    case linked(HiveOut)
    case unlinked(token: String)
}

struct QRUnlinkedResponse: Decodable {
    let status: String
    let token: String
}

// MARK: - Inspections
struct InspectionOut: Codable, Identifiable {
    let id: String
    let hiveId: String
    let date: String
    let queenSeen: Bool?
    let queenColor: String?
    let broodFrames: Int?
    let honeyFrames: Int?
    let mood: String?
    /// 1 weak, 2 medium, 3 strong
    let populationStrength: Int?
    /// 0 none, 1 low, 2 medium, 3 high
    let varroaLevel: Int?
    /// Retired mite count, still returned for older inspections
    let varroaCount: Int?
    let swarmCellsSeen: Bool?
    let treatmentApplied: String?
    let feedingDone: Bool?
    let feedingType: String?
    let weightKg: Double?
    let notes: String?
    let customFields: [String: JSONValue]
    /// Set for inspections an app recorded offline; see api-contract.md.
    let clientId: String?
    let createdAt: Date
    /// Who recorded it. Empty for records made before sharing existed.
    var createdByName: String? = nil
    enum CodingKeys: String, CodingKey {
        case id, date, notes
        case createdByName    = "created_by_name"
        case hiveId           = "hive_id"
        case clientId         = "client_id"
        case queenSeen        = "queen_seen"
        case queenColor       = "queen_color"
        case broodFrames      = "brood_frames"
        case honeyFrames      = "honey_frames"
        case mood
        case populationStrength = "population_strength"
        case varroaLevel      = "varroa_level"
        case varroaCount      = "varroa_count"
        case swarmCellsSeen   = "swarm_cells_seen"
        case treatmentApplied = "treatment_applied"
        case feedingDone      = "feeding_done"
        case feedingType      = "feeding_type"
        case weightKg         = "weight_kg"
        case customFields     = "custom_fields"
        case createdAt        = "created_at"
    }
}

/// Codable, not just Encodable: a queued inspection is written to disk and read back.
struct InspectionCreateRequest: Codable {
    let date: String
    let queenSeen: Bool?
    let queenColor: String?
    let broodFrames: Int?
    let honeyFrames: Int?
    let mood: String?
    let populationStrength: Int?
    let varroaLevel: Int?
    let swarmCellsSeen: Bool?
    let treatmentApplied: String?
    let feedingDone: Bool?
    let feedingType: String?
    let weightKg: Double?
    let notes: String?
    let customFields: [String: JSONValue]
    /// Reused across retries of a queued inspection so the server stores it once.
    var clientId: String? = nil
    enum CodingKeys: String, CodingKey {
        case date, notes
        case clientId         = "client_id"
        case queenSeen        = "queen_seen"
        case queenColor       = "queen_color"
        case broodFrames      = "brood_frames"
        case honeyFrames      = "honey_frames"
        case mood
        case populationStrength = "population_strength"
        case varroaLevel      = "varroa_level"
        case swarmCellsSeen   = "swarm_cells_seen"
        case treatmentApplied = "treatment_applied"
        case feedingDone      = "feeding_done"
        case feedingType      = "feeding_type"
        case weightKg         = "weight_kg"
        case customFields     = "custom_fields"
    }
}

extension InspectionCreateRequest {
    /// The queue stamps every attempt of the same recorded visit with one id.
    func withClientId(_ id: String) -> InspectionCreateRequest {
        var copy = self
        copy.clientId = id
        return copy
    }
}

// MARK: - Stats
struct TrendPoint: Codable, Identifiable {
    let date: String
    let value: JSONValue
    var id: String { date }
}

struct StatsPeriod: Codable {
    let from: String
    let to: String
    let preset: String
}

struct HiveStats: Codable {
    let hiveId: String
    let period: StatsPeriod
    let inspectionCount: Int
    let daysSinceLastInspection: Int?
    let queenSeenRate: Double?
    let moodDistribution: [String: Int]
    let swarmCellsCount: Int
    let varroaTrend: [TrendPoint]
    let broodFramesTrend: [TrendPoint]
    let honeyFramesTrend: [TrendPoint]
    let populationStrengthTrend: [TrendPoint]
    let weightTrend: [TrendPoint]
    let customFieldStats: [String: CustomFieldStat]
    enum CodingKeys: String, CodingKey {
        case period
        case hiveId                   = "hive_id"
        case inspectionCount          = "inspection_count"
        case daysSinceLastInspection  = "days_since_last_inspection"
        case queenSeenRate            = "queen_seen_rate"
        case moodDistribution         = "mood_distribution"
        case swarmCellsCount          = "swarm_cells_count"
        case varroaTrend              = "varroa_trend"
        case broodFramesTrend         = "brood_frames_trend"
        case honeyFramesTrend         = "honey_frames_trend"
        case populationStrengthTrend  = "population_strength_trend"
        case weightTrend              = "weight_trend"
        case customFieldStats         = "custom_field_stats"
    }
}

struct CustomFieldStat: Codable {
    let fieldName: String
    let type: String
    let trend: [TrendPoint]?
    let distribution: [String: Int]?
    enum CodingKeys: String, CodingKey {
        case type, trend, distribution
        case fieldName = "field_name"
    }
}

struct ApiaryStats: Codable {
    let apiaryId: String
    let period: StatsPeriod
    let hiveCount: Int
    let inspectionsTotal: Int
    let hivesInspectedLast30d: Int
    let hivesNotInspected30d: Int
    let averageVarroa: Double?
    let averageBroodFrames: Double?
    let averageHoneyFrames: Double?
    let moodDistribution: [String: Int]
    let swarmAlerts: Int
    enum CodingKeys: String, CodingKey {
        case period
        case apiaryId              = "apiary_id"
        case hiveCount             = "hive_count"
        case inspectionsTotal      = "inspections_total"
        case hivesInspectedLast30d = "hives_inspected_last_30d"
        case hivesNotInspected30d  = "hives_not_inspected_30d"
        case averageVarroa         = "average_varroa"
        case averageBroodFrames    = "average_brood_frames"
        case averageHoneyFrames    = "average_honey_frames"
        case moodDistribution      = "mood_distribution"
        case swarmAlerts           = "swarm_alerts"
    }
}

struct ApiaryStatsSummary: Codable, Identifiable {
    let apiaryId: String
    let apiaryName: String
    let hiveCount: Int
    let inspectionsTotal: Int
    var id: String { apiaryId }
    enum CodingKeys: String, CodingKey {
        case apiaryId         = "apiary_id"
        case apiaryName       = "apiary_name"
        case hiveCount        = "hive_count"
        case inspectionsTotal = "inspections_total"
    }
}

struct OverviewStats: Codable {
    let period: StatsPeriod
    let apiaryCount: Int
    let hiveCount: Int
    let inspectionsTotal: Int
    let perApiary: [ApiaryStatsSummary]
    enum CodingKeys: String, CodingKey {
        case period
        case apiaryCount      = "apiary_count"
        case hiveCount        = "hive_count"
        case inspectionsTotal = "inspections_total"
        case perApiary        = "per_apiary"
    }
}

// MARK: - Admin
struct AdminUserOut: Codable, Identifiable {
    let id: String
    let email: String
    let name: String
    let createdAt: Date
    let isSupporter: Bool
    let apiaryCount: Int
    let hiveCount: Int
    let inspectionCount: Int
    enum CodingKeys: String, CodingKey {
        case id, email, name
        case createdAt       = "created_at"
        case isSupporter     = "is_supporter"
        case apiaryCount     = "apiary_count"
        case hiveCount       = "hive_count"
        case inspectionCount = "inspection_count"
    }
}

struct SignupDay: Codable, Identifiable {
    let date: String
    let count: Int
    var id: String { date }
}

struct PlatformStats: Codable {
    let totalUsers: Int
    let newUsersInPeriod: Int
    let supporterCount: Int
    let totalApiaries: Int
    let publicApiaries: Int
    let totalHives: Int
    let totalInspections: Int
    let activeUsers30d: Int
    let signupsByDay: [SignupDay]
    enum CodingKeys: String, CodingKey {
        case totalUsers          = "total_users"
        case newUsersInPeriod    = "new_users_in_period"
        case supporterCount      = "supporter_count"
        case totalApiaries       = "total_apiaries"
        case publicApiaries      = "public_apiaries"
        case totalHives          = "total_hives"
        case totalInspections    = "total_inspections"
        case activeUsers30d      = "active_users_30d"
        case signupsByDay        = "signups_by_day"
    }
}

struct PublicStats: Codable {
    let avgVarroaCount: Double?
    let moodDistribution: [String: Int]
    let avgBroodFrames: Double?
    let avgInspectionIntervalDays: Double?
    let apiaryCount: Int
    let hiveCount: Int
    let inspectionCount: Int
    enum CodingKeys: String, CodingKey {
        case avgVarroaCount            = "avg_varroa_count"
        case moodDistribution          = "mood_distribution"
        case avgBroodFrames            = "avg_brood_frames"
        case avgInspectionIntervalDays = "avg_inspection_interval_days"
        case apiaryCount               = "apiary_count"
        case hiveCount                 = "hive_count"
        case inspectionCount           = "inspection_count"
    }
}

// MARK: - Community Heatmap (supporter/admin only)

struct CommunityHeatmap: Codable {
    let type: String
    let features: [CommunityHeatmapFeature]
}

struct CommunityHeatmapFeature: Codable {
    let geometry: PolygonGeometry
    let properties: CommunityHeatmapProperties
}

struct PolygonGeometry: Codable {
    let type: String
    let coordinates: [[[Double]]]   // rings of [longitude, latitude]
}

struct CommunityHeatmapProperties: Codable, Equatable {
    let avgVarroa: Double?
    let moodScore: Double?          // percentage 0–100
    let avgBrood: Double?
    let swarmPct: Double            // percentage 0–100, never null
    let apiaryCount: Int
    let inspectionCount: Int
    enum CodingKeys: String, CodingKey {
        case avgVarroa       = "avg_varroa"
        case moodScore       = "mood_score"
        case avgBrood        = "avg_brood"
        case swarmPct        = "swarm_pct"
        case apiaryCount     = "apiary_count"
        case inspectionCount = "inspection_count"
    }
}

struct AdminTokenStats: Codable {
    let totalActiveSessions: Int
    let usersWithActiveSessions: Int
    let avgSessionsPerUser: Double
    enum CodingKeys: String, CodingKey {
        case totalActiveSessions      = "total_active_sessions"
        case usersWithActiveSessions  = "users_with_active_sessions"
        case avgSessionsPerUser       = "avg_sessions_per_user"
    }
}

struct AdminApiary: Codable, Identifiable {
    let id: String
    let name: String
    let ownerEmail: String
    let latitude: Double?
    let longitude: Double?
    let hiveCount: Int
    enum CodingKeys: String, CodingKey {
        case id, name, latitude, longitude
        case ownerEmail = "owner_email"
        case hiveCount  = "hive_count"
    }
}

struct HealthSummary: Codable {
    let inactiveUsersCount: Int
    let noVarroaApiariesCount: Int
    let zeroInspectionHivesCount: Int
    enum CodingKeys: String, CodingKey {
        case inactiveUsersCount       = "inactive_users_count"
        case noVarroaApiariesCount    = "no_varroa_apiaries_count"
        case zeroInspectionHivesCount = "zero_inspection_hives_count"
    }
}

struct InactiveUser: Codable, Identifiable {
    let id: String
    let email: String
    let createdAt: Date
    let daysSinceRegistration: Int
    enum CodingKeys: String, CodingKey {
        case id, email
        case createdAt             = "created_at"
        case daysSinceRegistration = "days_since_registration"
    }
}

struct NoVarroaApiary: Codable, Identifiable {
    let apiaryId: String
    let apiaryName: String
    let count: Int
    var id: String { apiaryId }
    enum CodingKeys: String, CodingKey {
        case count
        case apiaryId   = "apiary_id"
        case apiaryName = "apiary_name"
    }
}

struct ZeroInspectionHive: Codable, Identifiable {
    let hiveId: String
    let hiveName: String
    let apiaryName: String
    let initializedAt: Date
    var id: String { hiveId }
    enum CodingKeys: String, CodingKey {
        case hiveName    = "hive_name"
        case apiaryName  = "apiary_name"
        case hiveId      = "hive_id"
        case initializedAt = "initialized_at"
    }
}

struct SetSupporterRequest: Encodable {
    let isSupporter: Bool
    enum CodingKeys: String, CodingKey { case isSupporter = "is_supporter" }
}

// MARK: - Error
struct APIErrorEnvelope: Decodable {
    let error: ErrorDetail
    struct ErrorDetail: Decodable {
        let code: String
        let message: String
    }
}
