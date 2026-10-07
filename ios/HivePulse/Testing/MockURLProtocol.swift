#if DEBUG
import Foundation

final class MockURLProtocol: URLProtocol {
    private static let lock = NSLock()
    private static var handlers: [(pattern: String, status: Int, body: Data)] = []

    /// Simulates "no connection" for writes while reads keep working — what a beekeeper has
    /// at the apiary after the lists were loaded at home.
    static var failWritesAsOffline = false

    static func configure(_ entries: [(String, Int, String)]) {
        lock.lock()
        defer { lock.unlock() }
        handlers = entries.map { ($0.0, $0.1, Data($0.2.utf8)) }
    }

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let url = request.url?.absoluteString ?? ""
        // A percent-encoded "?" or "&" means the client pushed a query string into the path. The real
        // backend answers 404 for that, so mirror it instead of matching a handler by substring — that
        // mismatch hid the broken list URLs from every UI test.
        if url.contains("%3F") || url.contains("%26") {
            let response = HTTPURLResponse(url: request.url!, statusCode: 404, httpVersion: "HTTP/1.1",
                                           headerFields: ["Content-Type": "application/json"])!
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: Data(#"{"detail":"Not Found"}"#.utf8))
            client?.urlProtocolDidFinishLoading(self)
            return
        }
        if Self.failWritesAsOffline, request.httpMethod != "GET" {
            client?.urlProtocol(self, didFailWithError: URLError(.notConnectedToInternet))
            return
        }
        Self.lock.lock()
        let match = Self.handlers.first { url.contains($0.pattern) }
        Self.lock.unlock()
        let (_, status, body) = match ?? ("", 200, Data("{}".utf8))
        let response = HTTPURLResponse(
            url: request.url!, statusCode: status,
            httpVersion: "HTTP/1.1",
            headerFields: ["Content-Type": "application/json"]
        )!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: body)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}

// MARK: - Canned handler sets

extension MockURLProtocol {

    // Authenticated screens, all lists empty.
    static let authenticatedHandlers: [(String, Int, String)] = [
        ("hives/by-qr/tok-free", 200, qrUnlinkedJSON),   // before "hives"
        ("hives/by-qr/tok-h1",   200, qrLinkedHiveJSON),
        ("stats/overview",   200, overviewJSON),
        ("inspections",      200, emptyList),
        ("hives",            200, emptyList),
        ("field-definitions",200, "[]"),
        ("users/me/region",200, regionJSON),
        ("users/me/reminder",200, reminderJSON),   // must come before "users/me"
        ("users/me",         200, userJSON),
        ("qr-batches",       200, emptyList),
        ("apiaries",         200, emptyList),
        ("auth/refresh",     200, accessTokenJSON),
    ]

    // Authenticated screens, one apiary containing one hive (for deep-navigation tests).
    static let apiaryWithHiveHandlers: [(String, Int, String)] = [
        ("hives/by-qr/tok-free", 200, qrUnlinkedJSON),   // before "hives"
        ("hives/by-qr/tok-h1",   200, qrLinkedHiveJSON),
        ("stats/overview",                 200, overviewJSON),
        ("hives/h-1/inspections",          200, emptyList),
        ("apiaries/a-1/hives",             200, hiveListJSON),
        ("apiaries/a-1/field-definitions", 200, "[]"),
        ("hives/h-1",                      200, hiveJSON),
        ("apiaries/a-1",                   200, apiaryJSON),
        ("field-definitions",              200, "[]"),
        ("users/me/region",              200, regionJSON),
        ("users/me/reminder",              200, reminderJSON),  // before "users/me"
        ("users/me",                       200, userJSON),
        ("qr-batches",                     200, emptyList),
        ("apiaries",                       200, apiaryListJSON),
        ("auth/refresh",                   200, accessTokenJSON),
    ]

    // Authenticated supporter — same as authenticatedHandlers but user has is_supporter: true.
    static let authenticatedSupporterHandlers: [(String, Int, String)] = [
        ("stats/community-heatmap", 200, communityHeatmapJSON),
        ("inspections",      200, emptyList),
        ("hives",            200, emptyList),
        ("field-definitions",200, "[]"),
        ("users/me/region",200, regionJSON),
        ("users/me/reminder",200, reminderJSON),   // must come before "users/me"
        ("users/me",         200, supporterUserJSON),
        ("qr-batches",       200, emptyList),
        ("apiaries",         200, emptyList),
        ("auth/refresh",     200, accessTokenJSON),
    ]

    // Unauthenticated tests that need a working mock server (Register / Login success paths).
    static let unauthenticatedHandlers: [(String, Int, String)] = [
        ("auth/register", 200, tokenResponseJSON),
        ("auth/login",    200, tokenResponseJSON),
        ("users/me",      200, userJSON),
        ("apiaries",      200, emptyList),
    ]

    // The day at a glance, for the apiary list (-mockHomeSummary). Not part of the default set: the summary
    // repeats the apiary and hive names, which would make "Meadow" ambiguous in every other UI test.
    static let homeSummaryHandlers: [(String, Int, String)] = [
        ("home", 200, homeJSON),
    ]

    // The pages behind the newer tools (-mockNewTools): where a hive has stood, treatments, working together.
    static let newToolsHandlers: [(String, Int, String)] = [
        ("calendar",             200, calendarJSON),
        ("hives/moves/overview", 200, "[]"),
        ("hives/h-1/moves",      200, "[]"),   // before "hives/h-1"
        ("treatments",           200, "[]"),
        ("shares/incoming",      200, "[]"),
        ("shares",               200, "[]"),
    ]

    private static let regionJSON = """
    {"country":null,"postal_code":null,"latitude":null,"longitude":null,"adjust_days":0,"shift_days":0,
     "source":"default","located":true}
    """

    // The beekeeper's year around "today" (2026-10-07), with something running now, a repeated task and a honey.
    private static let calendarJSON = """
    {"region":{"country":"DE","postal_code":"69123","latitude":49.4,"longitude":8.7,"adjust_days":0,"shift_days":2,
               "source":"postal_code","located":true},
     "today":"2026-10-07","start":"2026-09-01","end":"2027-01-29",
     "entries":[
      {"key":"winter-feeding","category":"feeding","title":"Feed for the winter","body":"Feed sugar syrup in a few large rations while it is still warm.",
       "start":"2026-08-01","end":"2026-09-25","interval_days":null,"honey":null,"active":false},
      {"key":"winter-prep","category":"winter","title":"Make the hives winter-proof","body":"Fit the mouse guard and a reduced entrance, and leave the colonies in peace.",
       "start":"2026-10-01","end":"2026-11-20","interval_days":null,"honey":null,"active":true},
      {"key":"oxalic-acid","category":"varroa","title":"Winter treatment in the brood-free time","body":"After some days of hard frost, once, as approved.",
       "start":"2026-11-25","end":"2026-12-31","interval_days":null,"honey":null,"active":false},
      {"key":"candy-feeding","category":"feeding","title":"Feed candy if the stores run low","body":"Lift the hive at the back: a light colony needs help now.",
       "start":"2027-02-01","end":"2027-03-10","interval_days":null,"honey":null,"active":false},
      {"key":"swarm-control","category":"swarm","title":"Swarm control: look for queen cells","body":"Check every colony weekly, at the latest every 9 days.",
       "start":"2027-04-22","end":"2027-07-02","interval_days":9,"honey":null,"active":false},
      {"key":"harvest-rapeseed","category":"harvest","title":"Rapeseed honey: extract at once","body":"Rapeseed honey sets hard within days.",
       "start":"2027-05-17","end":"2027-06-07","interval_days":null,"honey":"rapeseed","active":false}]}
    """

    private static let homeJSON = """
    {"today":"2026-10-07","in_season":true,"apiary_count":1,"hive_count":1,
     "inspections":{"interval_days":14,"overdue_count":0,"due_soon_count":1,"next":[
       {"hive_id":"h-1","hive_name":"Hive Alpha","apiary_name":"Meadow","last_inspection_on":null,"due_on":"2026-10-09","overdue_days":0}]},
     "health":{"ok":0,"watch":0,"alert":0,"unknown":1,"attention":[]},
     "treatments":{"open_count":1,"overdue_count":0,"upcoming":[
       {"id":"t-1","target":{"type":"hive","id":"h-1","name":"Hive Alpha"},"apiary_name":"Meadow","product":"Oxalic acid",
        "due_on":"2026-10-20","note":null,"done_on":null,"overdue":false,"created_by_name":"Tester","created_at":"2026-10-01T08:00:00.000000"}]},
     "ad":null}
    """

    // Authenticated with one QR batch ("b-1") whose PDF can be downloaded.
    static let qrBatchHandlers: [(String, Int, String)] = [
        ("hives/by-qr/tok-free", 200, qrUnlinkedJSON),   // before "hives"
        ("hives/by-qr/tok-h1",   200, qrLinkedHiveJSON),
        ("qr-batches/b-1/pdf", 200, minimalPDF),        // before "qr-batches/b-1"
        ("qr-batches/b-1",     200, qrBatchJSON),       // before "qr-batches"
        ("qr-batches",         200, qrBatchListJSON),
        ("field-definitions",  200, "[]"),
        ("users/me/region",  200, regionJSON),
        ("users/me/reminder",  200, reminderJSON),      // before "users/me"
        ("users/me",           200, userJSON),
        ("apiaries",           200, emptyList),
        ("auth/refresh",       200, accessTokenJSON),
    ]

    // MARK: - Canned JSON

    // QR scan: an unlinked token, and a token already linked to a hive
    static let qrUnlinkedJSON = """
    {"status":"unlinked","token":"tok-free"}
    """

    static let qrLinkedHiveJSON = hiveJSON

    static let qrBatchJSON = """
    {"id":"b-1","count":2,"created_at":"2026-09-01T10:00:00.123456","tokens":[{"token":"tok-aaaa","linked_hive_id":null},{"token":"tok-bbbb","linked_hive_id":"h-1"}]}
    """

    static let qrBatchListJSON = """
    {"items":[{"id":"b-1","count":2,"created_at":"2026-09-01T10:00:00.123456","linked_count":1}],"total":1,"page":1,"per_page":20,"pages":1}
    """

    static let minimalPDF = """
    %PDF-1.4
    1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
    2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
    3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj
    trailer<</Root 1 0 R>>
    %%EOF
    """

    static let userJSON = """
    {"id":"u-1","email":"tester@example.com","name":"Test User","locale":"en","created_at":"2024-01-01T00:00:00.123456","is_admin":false,"is_supporter":false}
    """

    // Two neighbouring 0.5° cells in central Germany: a healthy one (west) and a struggling one (east).
    static let communityHeatmapJSON = """
    {"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[9.5,51.0],[10.0,51.0],[10.0,51.5],[9.5,51.5],[9.5,51.0]]]},"properties":{"avg_varroa":1.2,"mood_score":82,"avg_brood":6.1,"swarm_pct":5,"apiary_count":4,"inspection_count":21}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[10.0,51.0],[10.5,51.0],[10.5,51.5],[10.0,51.5],[10.0,51.0]]]},"properties":{"avg_varroa":5.8,"mood_score":35,"avg_brood":null,"swarm_pct":40,"apiary_count":2,"inspection_count":9}}]}
    """

    static let supporterUserJSON = """
    {"id":"u-1","email":"tester@example.com","name":"Test Supporter","locale":"en","created_at":"2024-01-01T00:00:00.123456","is_admin":false,"is_supporter":true}
    """

    static let reminderJSON = """
    {"reminder_enabled":true,"reminder_interval_days":7,"reminder_season_start":4,"reminder_season_end":8,"push_token_apns":null,"push_token_fcm":null,"reminder_email_enabled":false}
    """

    private static let accessTokenJSON = """
    {"access_token":"ui-test-token"}
    """

    private static let tokenResponseJSON = """
    {"access_token":"ui-test-token","refresh_token":"ui-test-refresh","user":{"id":"u-1","email":"tester@example.com","name":"Test User","locale":"en","created_at":"2024-01-01T00:00:00.123456","is_admin":false,"is_supporter":false}}
    """

    private static let emptyList = """
    {"items":[],"total":0,"page":1,"per_page":50,"pages":1}
    """

    static let overviewJSON = """
    {"period":{"from":"2025-09-15","to":"2026-09-15","preset":"365d"},"apiary_count":1,"hive_count":1,"inspections_total":12,"per_apiary":[{"apiary_id":"a-1","apiary_name":"Meadow","hive_count":1,"inspections_total":12}]}
    """

    private static let apiaryJSON = """
    {"id":"a-1","name":"Meadow","description":null,"latitude":null,"longitude":null,"address":null,"hive_count":1,"created_at":"2024-01-01T00:00:00.123456"}
    """

    private static let apiaryListJSON = """
    {"items":[{"id":"a-1","name":"Meadow","description":null,"latitude":null,"longitude":null,"address":null,"hive_count":1,"created_at":"2024-01-01T00:00:00.123456"}],"total":1,"page":1,"per_page":50,"pages":1}
    """

    private static let hiveJSON = """
    {"id":"h-1","qr_token":"tok-h1","apiary_id":"a-1","name":"Hive Alpha","hive_type":"langstroth","latitude":null,"longitude":null,"acquisition_date":null,"notes":null,"custom_fields":{},"initialized_at":"2024-01-01T00:00:00.123456","last_inspection_at":null,"created_at":"2024-01-01T00:00:00.123456"}
    """

    private static let hiveListJSON = """
    {"items":[{"id":"h-1","qr_token":"tok-h1","apiary_id":"a-1","name":"Hive Alpha","hive_type":"langstroth","latitude":null,"longitude":null,"acquisition_date":null,"notes":null,"custom_fields":{},"initialized_at":"2024-01-01T00:00:00.123456","last_inspection_at":null,"created_at":"2024-01-01T00:00:00.123456"}],"total":1,"page":1,"per_page":50,"pages":1}
    """
}
#endif
