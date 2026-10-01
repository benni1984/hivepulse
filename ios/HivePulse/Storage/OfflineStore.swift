import Foundation

/// Local copies of what a beekeeper needs at the apiary, where there is often no signal:
/// the apiaries, their hives, the inspections already recorded and the custom field
/// definitions the inspection form renders.
///
/// Stored as JSON files in Application Support. The server stays the source of truth —
/// every successful request refreshes a file, and a file is only read when the request
/// failed for want of a connection.
final class OfflineStore {

    static let shared = OfflineStore()

    private let directory: URL
    private let queue = DispatchQueue(label: "de.multihead.hivepulse.offlinestore")
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(directory: URL? = nil) {
        if let directory {
            self.directory = directory
        } else {
            let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            self.directory = base.appendingPathComponent("HivePulseOffline", isDirectory: true)
        }
        // Inspections carry dates the API encodes as the backend does; keep both ends in step.
        encoder.dateEncodingStrategy = .iso8601
        decoder.dateDecodingStrategy = .hivePulseBackend  // also parses what we encode (.iso8601)
        try? FileManager.default.createDirectory(at: self.directory, withIntermediateDirectories: true)
        // The cache holds hive data; it must not end up in iCloud backups or be readable
        // while the device is locked.
        var resourceValues = URLResourceValues()
        resourceValues.isExcludedFromBackup = true
        var cacheDirectory = self.directory
        try? cacheDirectory.setResourceValues(resourceValues)
    }

    // MARK: - Keys

    enum Key {
        static let apiaries = "apiaries"
        static func hives(apiaryId: String) -> String { "hives-\(apiaryId)" }
        static let hivesById = "hives-by-id"
        static func inspections(hiveId: String) -> String { "inspections-\(hiveId)" }
        static func fieldDefinitions(apiaryId: String?) -> String {
            apiaryId.map { "fields-\($0)" } ?? "fields-user"
        }
        static let pendingInspections = "pending-inspections"
    }

    // MARK: - Raw access

    func save<T: Encodable>(_ value: T, for key: String) {
        queue.sync {
            guard let data = try? encoder.encode(value) else { return }
            try? data.write(to: file(key), options: .completeFileProtection)
        }
    }

    func load<T: Decodable>(_ type: T.Type, for key: String) -> T? {
        queue.sync {
            guard let data = try? Data(contentsOf: file(key)) else { return nil }
            return try? decoder.decode(type, from: data)
        }
    }

    func remove(_ key: String) {
        queue.sync { try? FileManager.default.removeItem(at: file(key)) }
    }

    /// Signing out must not leave the previous account's hives on the device.
    func clear() {
        queue.sync {
            let contents = (try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil)) ?? []
            for url in contents { try? FileManager.default.removeItem(at: url) }
        }
    }

    private func file(_ key: String) -> URL {
        directory.appendingPathComponent("\(key).json")
    }

    // MARK: - Hives by id and QR token

    /// Hives are also kept in one flat table so a scanned QR code finds its hive offline.
    func rememberHives(_ hives: [HiveOut]) {
        var table = load([String: HiveOut].self, for: Key.hivesById) ?? [:]
        for hive in hives { table[hive.id] = hive }
        save(table, for: Key.hivesById)
    }

    func hive(id: String) -> HiveOut? {
        load([String: HiveOut].self, for: Key.hivesById)?[id]
    }

    func hive(qrToken: String) -> HiveOut? {
        load([String: HiveOut].self, for: Key.hivesById)?.values.first { $0.qrToken == qrToken }
    }
}

/// True for the failures that mean "no usable connection right now" — those are the ones
/// worth answering from the cache or queueing. An HTTP 404 or 401 is a real answer from
/// the server and must keep surfacing as an error.
extension Error {
    var isOffline: Bool {
        if let urlError = self as? URLError {
            switch urlError.code {
            case .notConnectedToInternet, .networkConnectionLost, .timedOut,
                 .cannotConnectToHost, .cannotFindHost, .dataNotAllowed,
                 .internationalRoamingOff, .secureConnectionFailed:
                return true
            default:
                return false
            }
        }
        // APIClient wraps URLSession transport failures in .network; an HTTP status never
        // lands there, so anything but a URLError in that case is a connection failure too.
        if let apiError = self as? APIError, case .network(let underlying) = apiError {
            guard let urlError = underlying as? URLError else { return true }
            return urlError.isOffline
        }
        return false
    }
}
