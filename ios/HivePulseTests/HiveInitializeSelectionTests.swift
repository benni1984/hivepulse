import XCTest
@testable import HivePulse

/// Regression: the apiary picker selected `apiaries.first` in `onAppear` only. `MainTabView` loads the
/// apiary list asynchronously, so when the scan sheet opened first, the selection stayed empty and never
/// recovered — Save was permanently greyed out with no explanation.
final class HiveInitializeSelectionTests: XCTestCase {

    private func apiary(_ id: String, _ name: String) -> ApiaryOut {
        ApiaryOut(id: id, name: name, description: nil, latitude: nil, longitude: nil,
                  address: nil, hiveCount: 0, createdAt: Date(timeIntervalSince1970: 0))
    }

    func test_preselectsFirstApiary_whenNothingSelectedYet() {
        let resolved = HiveInitializeView.resolvedApiaryId(
            current: "", apiaries: [apiary("a-1", "Meadow"), apiary("a-2", "Orchard")]
        )
        XCTAssertEqual(resolved, "a-1")
    }

    func test_selectsFirstApiary_whenListArrivesAfterTheSheetOpened() {
        // onAppear ran against an empty list; the load finishes afterwards.
        var selection = HiveInitializeView.resolvedApiaryId(current: "", apiaries: [])
        XCTAssertEqual(selection, "")

        selection = HiveInitializeView.resolvedApiaryId(current: selection, apiaries: [apiary("a-9", "Late")])
        XCTAssertEqual(selection, "a-9", "a late-arriving list must become selectable")
    }

    func test_keepsExistingSelection() {
        let resolved = HiveInitializeView.resolvedApiaryId(
            current: "a-2", apiaries: [apiary("a-1", "Meadow"), apiary("a-2", "Orchard")]
        )
        XCTAssertEqual(resolved, "a-2")
    }

    func test_replacesSelectionThatIsNoLongerInTheList() {
        let resolved = HiveInitializeView.resolvedApiaryId(
            current: "deleted", apiaries: [apiary("a-1", "Meadow")]
        )
        XCTAssertEqual(resolved, "a-1")
    }

    func test_staysEmptyWithoutApiaries() {
        // Nothing to select — the form shows the "no apiaries" hint instead of a dead Save button.
        XCTAssertEqual(HiveInitializeView.resolvedApiaryId(current: "", apiaries: []), "")
    }
}
