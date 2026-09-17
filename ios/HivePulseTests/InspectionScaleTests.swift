import XCTest
@testable import HivePulse

/// Varroa is recorded as a word level (0 none … 3 high) and colony strength as weak / medium / strong (1–3).
/// Replaces the old free mite count and the 1–5 strength stepper.
final class InspectionScaleTests: XCTestCase {

    private func bundle(_ locale: String) throws -> Bundle {
        let path = try XCTUnwrap(Bundle(for: AuthViewModel.self).path(forResource: locale, ofType: "lproj"))
        return try XCTUnwrap(Bundle(path: path))
    }

    func test_scaleValuesMatchTheAPI() {
        XCTAssertEqual(InspectionScale.varroaLevels, [0, 1, 2, 3])
        XCTAssertEqual(InspectionScale.strengthLevels, [1, 2, 3])
    }

    func test_everyScaleWordIsTranslatedInEveryLocale() throws {
        let keys = InspectionScale.varroaLevels.map { "varroaLevel.\($0)" }
            + InspectionScale.strengthLevels.map { "strength.\($0)" }
            + ["field.varroaLevel", "screen.editHive"]
        for locale in ["en", "de", "fr", "es"] {
            let b = try bundle(locale)
            for key in keys {
                XCTAssertNotEqual(b.localizedString(forKey: key, value: "@@missing@@", table: nil), "@@missing@@",
                                  "\(key) is not translated in \(locale)")
            }
        }
    }

    func test_germanWords() throws {
        let de = try bundle("de")
        XCTAssertEqual(de.localizedString(forKey: "varroaLevel.0", value: nil, table: nil), "Keine")
        XCTAssertEqual(de.localizedString(forKey: "varroaLevel.3", value: nil, table: nil), "Stark")
        XCTAssertEqual(de.localizedString(forKey: "strength.1", value: nil, table: nil), "Schwach")
        XCTAssertEqual(de.localizedString(forKey: "strength.3", value: nil, table: nil), "Stark")
    }

    func test_createRequestSendsVarroaLevelNotCount() throws {
        let req = InspectionCreateRequest(
            date: "2026-09-17", queenSeen: true, queenColor: "blue", broodFrames: nil, honeyFrames: nil,
            mood: nil, populationStrength: 2, varroaLevel: 3, swarmCellsSeen: nil, treatmentApplied: nil,
            feedingDone: nil, feedingType: nil, weightKg: nil, notes: nil, customFields: [:])
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: JSONEncoder().encode(req)) as? [String: Any])
        XCTAssertEqual(json["varroa_level"] as? Int, 3)
        XCTAssertEqual(json["population_strength"] as? Int, 2)
        XCTAssertEqual(json["queen_color"] as? String, "blue")
        XCTAssertNil(json["varroa_count"])
    }

    func test_inspectionDecodesVarroaLevelAndKeepsLegacyCount() throws {
        let data = Data("""
        {"id":"i-1","hive_id":"h-1","date":"2026-09-17","queen_seen":null,"queen_color":null,
         "brood_frames":null,"honey_frames":null,"mood":null,"population_strength":3,
         "varroa_level":2,"varroa_count":4,"swarm_cells_seen":null,"treatment_applied":null,
         "feeding_done":null,"feeding_type":null,"weight_kg":null,"notes":null,"custom_fields":{},
         "created_at":"2026-09-17T08:00:00.000000"}
        """.utf8)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .hivePulseBackend
        let insp = try decoder.decode(InspectionOut.self, from: data)
        XCTAssertEqual(insp.varroaLevel, 2)
        XCTAssertEqual(insp.varroaCount, 4)
        XCTAssertEqual(insp.populationStrength, 3)
    }

    func test_queenColorDotsCoverTheSicammColours() {
        XCTAssertEqual(QueenColorDots.options.map(\.key), ["white", "yellow", "red", "green", "blue"])
    }
}

/// Editing a hive from the hive detail screen.
@MainActor
final class HiveEditTests: XCTestCase {

    func test_request_trimsAndDropsEmptyNotes() throws {
        let values = try XCTUnwrap(HiveEditView.request(name: "  Linde 3 ", hasAcquisitionDate: false,
                                                       acquisitionDate: Date(), notes: "   "))
        XCTAssertEqual(values.name, "Linde 3")
        XCTAssertNil(values.acquisitionDate)
        XCTAssertNil(values.notes)
    }

    func test_request_formatsAcquisitionDateForTheAPI() throws {
        var comps = DateComponents()
        comps.year = 2025
        comps.month = 4
        comps.day = 9
        let date = try XCTUnwrap(Calendar.current.date(from: comps))
        let values = try XCTUnwrap(HiveEditView.request(name: "A", hasAcquisitionDate: true,
                                                       acquisitionDate: date, notes: "Swarm catch"))
        XCTAssertEqual(values.acquisitionDate, "2025-04-09")
        XCTAssertEqual(values.notes, "Swarm catch")
    }

    func test_request_rejectsBlankName() {
        XCTAssertNil(HiveEditView.request(name: "   ", hasAcquisitionDate: false, acquisitionDate: Date(), notes: ""))
    }

    func test_viewModelUpdate_sendsAcquisitionDateAndReturnsHive() async throws {
        let svc = MockHiveService()
        let vm = HiveViewModel(service: svc)
        let updated = try await vm.update("h-1", name: "Renamed", hiveType: "dadant", notes: "n",
                                          acquisitionDate: "2025-04-09")
        XCTAssertEqual(updated.name, "Renamed")
        XCTAssertEqual(svc.lastUpdateRequest?.acquisitionDate, "2025-04-09")
        XCTAssertEqual(svc.lastUpdateRequest?.hiveType, "dadant")
    }
}
