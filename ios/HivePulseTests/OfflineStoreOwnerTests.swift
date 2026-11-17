import XCTest
@testable import HivePulse

/// Whose offline data this is (#469).
///
/// Nothing used to say. What kept one beekeeper's hives from the next was that signing out
/// cleared the directory — which works exactly as long as everybody signs out, and #467 is the
/// case where nobody does: the session simply ran out.
///
/// Clearing on expiry as well would have been the easy answer and the wrong one. An inspection
/// waiting in the queue was recorded at a hive with no signal and exists nowhere else until it
/// uploads; losing it because an access token aged past thirty days is worse than the dead end
/// that started this. So the data carries an owner, and is cleared when a *different* account
/// signs in — a stronger guarantee than the old one, because it does not depend on anybody
/// having signed out properly.
final class OfflineStoreOwnerTests: XCTestCase {

    private var directory: URL!
    private var store: OfflineStore!

    override func setUp() {
        super.setUp()
        directory = FileManager.default.temporaryDirectory
            .appendingPathComponent("OfflineStoreOwnerTests-\(UUID().uuidString)", isDirectory: true)
        store = OfflineStore(directory: directory)
    }

    override func tearDown() {
        try? FileManager.default.removeItem(at: directory)
        store = nil
        directory = nil
        super.tearDown()
    }

    private let queueKey = OfflineStore.Key.pendingInspections

    func test_theSameBeekeeperFindsTheirQueuedVisitsWhereTheyLeftThem() {
        store.adopt(userId: "u-1")
        store.save(["a visit recorded with no signal"], for: queueKey)

        store.adopt(userId: "u-1")

        XCTAssertEqual(store.load([String].self, for: queueKey), ["a visit recorded with no signal"])
        XCTAssertEqual(store.owner, "u-1")
    }

    func test_aDifferentAccountFindsNothingToReadAndNothingToUpload() {
        store.adopt(userId: "u-1")
        store.save(["a visit recorded with no signal"], for: queueKey)
        store.save(["Meadow"], for: OfflineStore.Key.apiaries)

        store.adopt(userId: "u-2")

        XCTAssertNil(store.load([String].self, for: queueKey))
        XCTAssertNil(store.load([String].self, for: OfflineStore.Key.apiaries))
        XCTAssertEqual(store.owner, "u-2")
    }

    func test_dataFromBeforeAnybodyWasRecordedBelongsToWhoeverIsSigningIn() {
        // An install updating into this change has files and no owner. They were written by the
        // account that is signing in — it is the only one this device has had — so taking them
        // away would be the loss this whole arrangement exists to avoid.
        store.save(["a visit recorded with no signal"], for: queueKey)

        store.adopt(userId: "u-1")

        XCTAssertEqual(store.load([String].self, for: queueKey), ["a visit recorded with no signal"])
    }

    func test_theOwnerSurvivesAnotherStoreOpeningTheSameDirectory() {
        // The owner lives beside the data, not in UserDefaults, so the two can only be lost
        // together.
        store.adopt(userId: "u-1")

        XCTAssertEqual(OfflineStore(directory: directory).owner, "u-1")
    }
}
