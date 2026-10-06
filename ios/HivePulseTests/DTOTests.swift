import XCTest
@testable import HivePulse

final class DTOTests: XCTestCase {

    // MARK: - JSONValue

    func test_jsonValue_string_roundtrip() throws {
        let value = JSONValue.string("hello")
        let decoded = try roundtrip(value)
        XCTAssertEqual(decoded, value)
    }

    func test_jsonValue_int_roundtrip() throws {
        let value = JSONValue.int(42)
        let decoded = try roundtrip(value)
        XCTAssertEqual(decoded, value)
    }

    func test_jsonValue_double_roundtrip() throws {
        let value = JSONValue.double(3.14)
        let decoded = try roundtrip(value)
        XCTAssertEqual(decoded, value)
    }

    func test_jsonValue_bool_roundtrip() throws {
        XCTAssertEqual(try roundtrip(JSONValue.bool(true)), .bool(true))
        XCTAssertEqual(try roundtrip(JSONValue.bool(false)), .bool(false))
    }

    func test_jsonValue_null_roundtrip() throws {
        XCTAssertEqual(try roundtrip(JSONValue.null), .null)
    }

    func test_jsonValue_displayString_null() {
        XCTAssertEqual(JSONValue.null.displayString, "—")
    }

    func test_jsonValue_displayString_bool_true() {
        XCTAssertEqual(JSONValue.bool(true).displayString, "✓")
    }

    func test_jsonValue_displayString_string() {
        XCTAssertEqual(JSONValue.string("abc").displayString, "abc")
    }

    // MARK: - PaginatedResponse

    func test_paginatedResponse_decodesPerPageSnakeCase() throws {
        let json = #"{"items":[],"total":0,"page":1,"per_page":50,"pages":1}"#.data(using: .utf8)!
        let resp = try JSONDecoder().decode(PaginatedResponse<ApiaryOut>.self, from: json)
        XCTAssertEqual(resp.perPage, 50)
        XCTAssertEqual(resp.pages, 1)
        XCTAssertTrue(resp.items.isEmpty)
    }

    // MARK: - QrTokenOut

    func test_qrTokenOut_isLinked_true() {
        let token = QrTokenOut(token: "abc", linkedHiveId: "h-1")
        XCTAssertTrue(token.isLinked)
        XCTAssertEqual(token.id, "abc")
    }

    func test_qrTokenOut_isLinked_false() {
        let token = QrTokenOut(token: "abc", linkedHiveId: nil)
        XCTAssertFalse(token.isLinked)
    }

    // MARK: - UserOut

    func test_userOut_decodesSnakeCaseCreatedAt() throws {
        let json = #"{"id":"u-1","email":"a@b.com","name":"Alice","locale":"en","created_at":"2024-01-01T00:00:00Z","is_admin":false,"is_supporter":false}"#.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let user = try decoder.decode(UserOut.self, from: json)
        XCTAssertEqual(user.id, "u-1")
        XCTAssertEqual(user.name, "Alice")
        XCTAssertEqual(user.locale, "en")
    }

    // MARK: - InspectionOut

    func test_inspectionOut_dateIsStringNotDate() throws {
        let json = """
        {"id":"i-1","hive_id":"h-1","date":"2024-06-15","queen_seen":true,
         "queen_color":null,"brood_frames":3,"honey_frames":2,"mood":null,
         "population_strength":null,"varroa_count":null,"swarm_cells_seen":null,
         "treatment_applied":null,"feeding_done":null,"feeding_type":null,
         "weight_kg":null,"notes":null,"custom_fields":{},"created_at":"2024-01-01T00:00:00Z"}
        """.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let insp = try decoder.decode(InspectionOut.self, from: json)
        XCTAssertEqual(insp.date, "2024-06-15")
        XCTAssertEqual(insp.queenSeen, true)
        XCTAssertEqual(insp.broodFrames, 3)
    }

    // MARK: - AdminUserOut

    func test_adminUserOut_decodesSnakeCaseKeys() throws {
        let json = """
        {"id":"u-1","email":"a@b.com","name":"Alice","created_at":"2024-01-01T00:00:00Z",
         "is_supporter":true,"apiary_count":2,"hive_count":5,"inspection_count":10}
        """.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let user = try decoder.decode(AdminUserOut.self, from: json)
        XCTAssertEqual(user.id, "u-1")
        XCTAssertTrue(user.isSupporter)
        XCTAssertEqual(user.apiaryCount, 2)
        XCTAssertEqual(user.hiveCount, 5)
        XCTAssertEqual(user.inspectionCount, 10)
    }

    // MARK: - PlatformStats

    func test_platformStats_decodesSnakeCaseKeys() throws {
        let json = """
        {"total_users":100,"new_users_in_period":5,"supporter_count":12,
         "total_apiaries":30,"public_apiaries":10,"total_hives":80,
         "total_inspections":500,"active_users_30d":25,
         "signups_by_day":[{"date":"2024-01-01","count":3}]}
        """.data(using: .utf8)!
        let stats = try JSONDecoder().decode(PlatformStats.self, from: json)
        XCTAssertEqual(stats.totalUsers, 100)
        XCTAssertEqual(stats.newUsersInPeriod, 5)
        XCTAssertEqual(stats.supporterCount, 12)
        XCTAssertEqual(stats.activeUsers30d, 25)
        XCTAssertEqual(stats.signupsByDay.count, 1)
        XCTAssertEqual(stats.signupsByDay.first?.date, "2024-01-01")
    }

    // MARK: - HealthSummary

    func test_healthSummary_decodesSnakeCaseKeys() throws {
        let json = """
        {"inactive_users_count":3,"no_varroa_apiaries_count":7,"zero_inspection_hives_count":2}
        """.data(using: .utf8)!
        let summary = try JSONDecoder().decode(HealthSummary.self, from: json)
        XCTAssertEqual(summary.inactiveUsersCount, 3)
        XCTAssertEqual(summary.noVarroaApiariesCount, 7)
        XCTAssertEqual(summary.zeroInspectionHivesCount, 2)
    }

    // MARK: - ReminderSettingsOut

    func test_reminderSettingsOut_decodesFromJSON() throws {
        let json = """
        {"reminder_enabled":true,"reminder_interval_days":7,"reminder_season_start":4,
         "reminder_season_end":8,"push_token_apns":null,"push_token_fcm":null}
        """.data(using: .utf8)!
        let settings = try JSONDecoder().decode(ReminderSettingsOut.self, from: json)
        XCTAssertTrue(settings.reminderEnabled)
        XCTAssertEqual(settings.reminderIntervalDays, 7)
        XCTAssertEqual(settings.reminderSeasonStart, 4)
        XCTAssertEqual(settings.reminderSeasonEnd, 8)
        XCTAssertNil(settings.pushTokenApns)
        XCTAssertNil(settings.pushTokenFcm)
    }

    func test_reminderSettingsOut_decodesWithPushTokens() throws {
        let json = """
        {"reminder_enabled":false,"reminder_interval_days":14,"reminder_season_start":3,
         "reminder_season_end":10,"push_token_apns":"abc123","push_token_fcm":null}
        """.data(using: .utf8)!
        let settings = try JSONDecoder().decode(ReminderSettingsOut.self, from: json)
        XCTAssertFalse(settings.reminderEnabled)
        XCTAssertEqual(settings.reminderIntervalDays, 14)
        XCTAssertEqual(settings.pushTokenApns, "abc123")
        XCTAssertNil(settings.pushTokenFcm)
    }

    func test_reminderSettingsOut_decodesEmailChannel() throws {
        let json = """
        {"reminder_enabled":true,"reminder_interval_days":7,"reminder_season_start":4,
         "reminder_season_end":8,"push_token_apns":null,"push_token_fcm":null,"reminder_email_enabled":true}
        """.data(using: .utf8)!
        let settings = try JSONDecoder().decode(ReminderSettingsOut.self, from: json)
        XCTAssertEqual(settings.reminderEmailEnabled, true)
    }

    func test_reminderSettingsOut_emailChannelMissingDecodesAsNil() throws {
        let json = """
        {"reminder_enabled":true,"reminder_interval_days":7,"reminder_season_start":4,
         "reminder_season_end":8,"push_token_apns":null,"push_token_fcm":null}
        """.data(using: .utf8)!
        let settings = try JSONDecoder().decode(ReminderSettingsOut.self, from: json)
        XCTAssertNil(settings.reminderEmailEnabled)
    }

    func test_reminderSettingsUpdate_encodesEmailChannelOnlyWhenSet() throws {
        let withFlag = try JSONEncoder().encode(ReminderSettingsUpdate(
            reminderEnabled: nil, reminderIntervalDays: nil, reminderSeasonStart: nil,
            reminderSeasonEnd: nil, reminderEmailEnabled: true))
        let decodedWith = try XCTUnwrap(JSONSerialization.jsonObject(with: withFlag) as? [String: Any])
        XCTAssertEqual(decodedWith["reminder_email_enabled"] as? Bool, true)

        let withoutFlag = try JSONEncoder().encode(ReminderSettingsUpdate(
            reminderEnabled: true, reminderIntervalDays: nil, reminderSeasonStart: nil, reminderSeasonEnd: nil))
        let decodedWithout = try XCTUnwrap(JSONSerialization.jsonObject(with: withoutFlag) as? [String: Any])
        XCTAssertNil(decodedWithout["reminder_email_enabled"])
    }

    // MARK: - Helpers

    private func roundtrip<T: Codable>(_ value: T) throws -> T {
        let data = try JSONEncoder().encode(value)
        return try JSONDecoder().decode(T.self, from: data)
    }


    private func decodeUser(_ json: String) throws -> UserOut {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .hivePulseBackend
        return try decoder.decode(UserOut.self, from: Data(json.utf8))
    }

    // MARK: - Accounts without a password

    func test_userOut_withoutAPasswordCannotChangeOne() throws {
        let json = #"{"id":"u","email":"a@b.de","name":"A","locale":"de","created_at":"2026-01-01T00:00:00.123456","is_admin":false,"is_supporter":false,"has_password":false}"#
        let user = try decodeUser(json)

        XCTAssertFalse(user.canChangePassword)
    }

    func test_userOut_withoutTheFieldIsTreatedAsHavingAPassword() throws {
        // An older response, or a mock, must not hide the section from everybody.
        let json = #"{"id":"u","email":"a@b.de","name":"A","locale":"de","created_at":"2026-01-01T00:00:00.123456","is_admin":false,"is_supporter":false}"#
        let user = try decodeUser(json)

        XCTAssertTrue(user.canChangePassword)
    }

    func test_socialSignInRequest_sendsTheAuthorizationCodeUnderItsServerName() throws {
        let data = try JSONEncoder().encode(SocialSignInRequest(
            provider: "apple", idToken: "t", name: nil, authorizationCode: "one-time"))
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])

        XCTAssertEqual(json["authorization_code"] as? String, "one-time")
        XCTAssertEqual(json["id_token"] as? String, "t")
    }

    func test_socialSignInRequest_leavesTheCodeOutWhenThereIsNone() throws {
        let data = try JSONEncoder().encode(SocialSignInRequest(
            provider: "google", idToken: "t", name: nil))
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])

        XCTAssertNil(json["authorization_code"])
    }

    // MARK: - Sharing

    private func decoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .hivePulseBackend
        return decoder
    }

    func test_apiaryOut_decodesWhoItBelongsToAndHowItIsShared() throws {
        let json = #"{"id":"a","name":"Garden","description":null,"latitude":null,"longitude":null,"address":null,"hive_count":2,"is_public":false,"access":"shared","owner_name":"Alice","created_at":"2026-01-01T00:00:00.123456"}"#

        let apiary = try decoder().decode(ApiaryOut.self, from: Data(json.utf8))

        XCTAssertEqual(apiary.access, "shared")
        XCTAssertEqual(apiary.ownerName, "Alice")
        XCTAssertFalse(apiary.isOwner)
        XCTAssertTrue(apiary.canEdit)
    }

    func test_anApiaryFromAnOlderServerIsTheCallersOwn() throws {
        let json = #"{"id":"a","name":"Garden","description":null,"latitude":null,"longitude":null,"address":null,"hive_count":2,"created_at":"2026-01-01T00:00:00.123456"}"#

        let apiary = try decoder().decode(ApiaryOut.self, from: Data(json.utf8))

        XCTAssertNil(apiary.access)
        XCTAssertTrue(apiary.isOwner)
        XCTAssertTrue(apiary.canEdit)
    }

    func test_anApiaryWithOnlySomeHivesSharedCannotBeEdited() throws {
        let json = #"{"id":"a","name":"Garden","description":null,"latitude":null,"longitude":null,"address":null,"hive_count":1,"access":"partial","owner_name":"Bob","created_at":"2026-01-01T00:00:00.123456"}"#

        let apiary = try decoder().decode(ApiaryOut.self, from: Data(json.utf8))

        XCTAssertFalse(apiary.isOwner)
        XCTAssertFalse(apiary.canEdit)
    }

    func test_hiveOut_knowsWhetherItIsTheCallersOwn() throws {
        let owner = #"{"id":"h","qr_token":"t","apiary_id":"a","name":"H","hive_type":"langstroth","latitude":null,"longitude":null,"acquisition_date":null,"notes":null,"custom_fields":{},"initialized_at":"2026-01-01T00:00:00.123456","last_inspection_at":null,"access":"owner","created_at":"2026-01-01T00:00:00.123456"}"#
        let shared = owner.replacingOccurrences(of: #""access":"owner""#, with: #""access":"shared""#)
        let older = owner.replacingOccurrences(of: #""access":"owner","#, with: "")

        XCTAssertTrue(try decoder().decode(HiveOut.self, from: Data(owner.utf8)).isOwner)
        XCTAssertFalse(try decoder().decode(HiveOut.self, from: Data(shared.utf8)).isOwner)
        XCTAssertTrue(try decoder().decode(HiveOut.self, from: Data(older.utf8)).isOwner)
    }

    func test_inspectionOut_decodesWhoRecordedIt() throws {
        let json = #"{"id":"i","hive_id":"h","date":"2026-05-01","custom_fields":{},"created_by_name":"Bob","created_at":"2026-05-01T10:00:00.123456"}"#

        let inspection = try decoder().decode(InspectionOut.self, from: Data(json.utf8))

        XCTAssertEqual(inspection.createdByName, "Bob")
    }

    func test_shareOut_decodesACollaboratorAndAnOpenInvitation() throws {
        let json = #"[{"id":"s-1","email":"bob@example.com","status":"accepted","target":{"type":"apiary","id":"a","name":"Garden"},"collaborator_name":"Bob","created_at":"2026-01-01T00:00:00.123456","accepted_at":"2026-01-02T00:00:00.123456"},{"id":"s-2","email":"carol@example.com","status":"pending","target":{"type":"hive","id":"h","name":"Hive 1"},"collaborator_name":null,"created_at":"2026-01-03T00:00:00.123456","accepted_at":null}]"#

        let shares = try decoder().decode([ShareOut].self, from: Data(json.utf8))

        XCTAssertEqual(shares[0].collaboratorName, "Bob")
        XCTAssertNotNil(shares[0].acceptedAt)
        XCTAssertEqual(shares[1].status, "pending")
        XCTAssertNil(shares[1].collaboratorName)
        XCTAssertEqual(shares[1].target.type, "hive")
    }

    func test_incomingShareOut_decodesWhereAHiveSits() throws {
        let json = #"{"id":"s-1","owner_name":"Alice","target":{"type":"hive","id":"h","name":"Hive 1"},"apiary_name":"Garden","created_at":"2026-01-01T00:00:00.123456"}"#

        let invitation = try decoder().decode(IncomingShareOut.self, from: Data(json.utf8))

        XCTAssertEqual(invitation.ownerName, "Alice")
        XCTAssertEqual(invitation.apiaryName, "Garden")
    }

    func test_shareCreateRequest_sendsExactlyOneTarget() throws {
        let hive = try JSONSerialization.jsonObject(
            with: JSONEncoder().encode(ShareCreateRequest(email: "bob@example.com", apiaryId: nil, hiveId: "h-1"))
        ) as? [String: Any]
        let apiary = try JSONSerialization.jsonObject(
            with: JSONEncoder().encode(ShareCreateRequest(email: "bob@example.com", apiaryId: "a-1", hiveId: nil))
        ) as? [String: Any]

        XCTAssertEqual(hive?["hive_id"] as? String, "h-1")
        XCTAssertNil(hive?["apiary_id"])
        XCTAssertEqual(apiary?["apiary_id"] as? String, "a-1")
        XCTAssertNil(apiary?["hive_id"])
        XCTAssertEqual(apiary?["email"] as? String, "bob@example.com")
    }

}
