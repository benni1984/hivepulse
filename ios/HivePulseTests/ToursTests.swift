import XCTest
@testable import HivePulse

/// Every step of every tour points at a control that exists, and says so in five languages (#449).
///
/// `.tourAnchor(...)` is the whole coupling between a tour and the interface, and it is the first
/// thing that will rot: somebody renames a view, moves a button into a menu, replaces a `Button`
/// with a `Link`, and a step now points at nothing. The engine degrades honestly when that
/// happens — it says the control is not on this screen and offers to leave — but an honest dead
/// end is still a dead end, and nobody would find out until a beekeeper did.
///
/// Android pins the same thing in `ToursTest.kt` and the website in `__tests__/Tours.test.ts`.
final class ToursTests: XCTestCase {

    private let locales = ["en", "de", "fr", "es", "pl"]

    func testThereAreToursToCheck() throws {
        // A fixture check: an empty list would make every assertion below pass.
        XCTAssertGreaterThanOrEqual(Tours.all.count, 9)
        XCTAssertGreaterThan(Tours.all.reduce(0) { $0 + $1.steps.count }, 10)
    }

    func testTheNineAreTheSameNineAsEverywhereElse() throws {
        // The three clients carry the same tours, in the same order. A tenth added on one
        // platform only is the kind of difference a store reviewer sees and a beekeeper
        // complains about — and `CLAUDE.md` makes it a rule.
        XCTAssertEqual(
            Tours.all.map(\.id),
            ["first-steps", "offline", "qr-codes", "hornets", "year",
             "treatments", "sharing", "custom-fields", "moves"]
        )
    }

    func testEveryIdIsUniqueAndFindable() throws {
        let ids = Tours.all.map(\.id)
        XCTAssertEqual(Set(ids).count, ids.count)
        for id in ids {
            XCTAssertEqual(Tours.byId(id)?.id, id)
        }
        // The list in Settings and the first sign-in both start a tour by name; an unknown one
        // comes back nil rather than crashing at the beekeeper.
        XCTAssertNil(Tours.byId("no-such-tour"))
    }

    func testEveryAnchorIsOneTheAppKnows() throws {
        let known = Set([
            TourAnchors.newApiary, TourAnchors.apiaryName, TourAnchors.apiarySave,
            TourAnchors.apiaryOpen, TourAnchors.newHive, TourAnchors.newInspection,
            TourAnchors.qrBatches, TourAnchors.newQrBatch, TourAnchors.scanTab,
            TourAnchors.hornetsTab, TourAnchors.trapNew, TourAnchors.trapName,
            TourAnchors.trapRegister, TourAnchors.beekeepingYear, TourAnchors.yearRate,
            TourAnchors.treatments, TourAnchors.treatmentPlan, TourAnchors.shareApiary,
            TourAnchors.sharingInvite, TourAnchors.customFields, TourAnchors.fieldNew,
            TourAnchors.moveHives, TourAnchors.movesOverview,
        ])
        for tour in Tours.all {
            for step in tour.steps {
                XCTAssertTrue(known.contains(step.anchor),
                              "\(tour.id) points at an anchor nothing declares: \(step.anchor)")
            }
        }
    }

    func testEveryWordExistsInAllFiveLanguages() throws {
        // A missing translation never fails at runtime — `NSLocalizedString` hands back the key
        // and the beekeeper reads "tour.qrCodes.step2" in the middle of a sentence. So the keys
        // are checked against each bundle, not against the default one.
        var gaps: [String] = []
        for locale in locales {
            // The app bundle, not the test bundle: `Localizable.strings` ships with the app.
            guard let path = Bundle(for: OnboardingStore.self).path(forResource: locale, ofType: "lproj"),
                  let bundle = Bundle(path: path) else {
                XCTFail("no \(locale).lproj in the test bundle")
                continue
            }
            var keys: [String] = ["tour.next", "tour.close", "tour.skipStep", "tour.lost",
                                  "tour.listTitle", "tour.listIntro", "tour.listStart",
                                  "tour.listDone"]
            for tour in Tours.all {
                keys.append(tour.titleKey)
                keys.append(tour.summaryKey)
                keys.append(contentsOf: tour.steps.map(\.textKey))
            }
            for key in keys {
                let value = bundle.localizedString(forKey: key, value: "@@missing@@", table: nil)
                if value == "@@missing@@" || value.isEmpty {
                    gaps.append("\(locale): \(key)")
                }
            }
        }
        XCTAssertEqual(gaps, [], gaps.joined(separator: "\n  "))
    }

    func testIsMostlyMadeOfRealTapsNotOfANextButton() throws {
        // The whole point is to point at a control and wait. A tour of nothing but `.manual`
        // steps is the carousel we are replacing, wearing an overlay.
        for tour in Tours.all where tour.steps.count > 1 {
            let real = tour.steps.filter { $0.advance != .manual }.count
            XCTAssertGreaterThan(real, 0, "\(tour.id) is all \"next\" steps")
        }
    }

    func testEveryTourStartsSomewhereItCanName() throws {
        // A tour started from the list in Settings has to take the beekeeper somewhere first.
        let onATab: Set<String> = [TourAnchors.hornetsTab, TourAnchors.scanTab]
        let beginWhereYouAlreadyAre: Set<String> =
            ["offline", "treatments", "sharing", "custom-fields", "moves"]
        for tour in Tours.all {
            let first = tour.steps[0]
            XCTAssertTrue(
                first.tab != nil || onATab.contains(first.anchor)
                    || beginWhereYouAlreadyAre.contains(tour.id),
                "\(tour.id) starts nowhere in particular"
            )
        }
    }

    @MainActor
    func testTheRealTapIsWhatMovesTheTourOn() throws {
        let controller = TourController()
        controller.start("first-steps")
        XCTAssertEqual(controller.index, 0)

        // A tap on something else does nothing — the step waits for *its* control.
        controller.tapped(TourAnchors.newHive)
        XCTAssertEqual(controller.index, 0)

        controller.tapped(TourAnchors.newApiary)
        XCTAssertEqual(controller.index, 1)

        // The second step explains the name field and has nothing to tap, so its own anchor
        // does not move it on either; only "next" does.
        controller.tapped(TourAnchors.apiaryName)
        XCTAssertEqual(controller.index, 1)
        controller.next()
        XCTAssertEqual(controller.index, 2)
    }

    @MainActor
    func testATourCanBeLeftAtAnyStep() throws {
        // Never trap them.
        let controller = TourController()
        controller.start("qr-codes")
        XCTAssertNotNil(controller.tour)
        controller.stop()
        XCTAssertNil(controller.tour)
        XCTAssertNil(controller.step)
    }

    @MainActor
    func testFinishingMarksItWithoutSpendingIt() throws {
        let defaults = UserDefaults(suiteName: "tours-tests")!
        defaults.removePersistentDomain(forName: "tours-tests")
        let store = OnboardingStore(defaults: defaults)
        let controller = TourController(onboarding: store)

        controller.start("offline")          // one step
        controller.next()                    // which finishes it
        XCTAssertNil(controller.activeId)
        XCTAssertTrue(store.finishedTours.contains("offline"))

        // Seen is not spent: it starts again, as often as anybody likes.
        controller.start("offline")
        XCTAssertEqual(controller.activeId, "offline")
        XCTAssertEqual(controller.index, 0)
    }

    @MainActor
    func testStartingAnUnknownTourChangesNothing() throws {
        let controller = TourController()
        controller.start("first-steps")
        controller.start("no-such-tour")
        XCTAssertEqual(controller.activeId, "first-steps")
    }
}
