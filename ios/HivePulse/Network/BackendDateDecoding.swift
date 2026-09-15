import Foundation

/// Parses the timestamp formats the HivePulse backend actually sends.
///
/// FastAPI/Pydantic serialises the naive UTC `datetime`s stored by the backend as
/// `"2026-09-13T13:18:13.734534"` — microseconds and **no time zone** — which Swift's
/// `JSONDecoder.DateDecodingStrategy.iso8601` rejects. Accepted forms:
/// - `2026-09-13T13:18:13.734534` / `2026-09-13T13:18:13` (no zone → UTC)
/// - `2026-09-13T13:18:13.734534Z`, `2026-09-13T13:18:13+02:00` (explicit zone)
/// - `2026-09-13` (date only, UTC midnight)
enum BackendDate {
    private static let withFraction: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    private static let withoutFraction: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    private static let dateOnly: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withFullDate]
        f.timeZone = TimeZone(identifier: "UTC")
        return f
    }()

    static func parse(_ raw: String) -> Date? {
        let value = raw.trimmingCharacters(in: .whitespaces)
        if value.count == 10 {
            return dateOnly.date(from: value)
        }
        guard let tIndex = value.firstIndex(of: "T") else { return nil }

        // Split "time[.fraction]" from an optional zone suffix (Z, +hh:mm, -hh:mm).
        var body = value
        var zone = "Z"
        if value.hasSuffix("Z") {
            body = String(value.dropLast())
        } else if let signIndex = value[tIndex...].lastIndex(where: { $0 == "+" || $0 == "-" }) {
            zone = String(value[signIndex...])
            body = String(value[..<signIndex])
        }

        // ISO8601DateFormatter only handles millisecond precision reliably: trim/pad the fraction to 3 digits.
        if let dot = body.firstIndex(of: ".") {
            let digits = body[body.index(after: dot)...].prefix(while: \.isNumber)
            let millis = String((digits + "000").prefix(3))
            return withFraction.date(from: String(body[..<dot]) + "." + millis + zone)
        }
        return withoutFraction.date(from: body + zone)
    }
}

extension JSONDecoder.DateDecodingStrategy {
    /// Decodes every date the backend sends; see `BackendDate`.
    static let hivePulseBackend: JSONDecoder.DateDecodingStrategy = .custom { decoder in
        let container = try decoder.singleValueContainer()
        let raw = try container.decode(String.self)
        guard let date = BackendDate.parse(raw) else {
            throw DecodingError.dataCorruptedError(
                in: container, debugDescription: "Unrecognised backend date: \(raw)"
            )
        }
        return date
    }
}
