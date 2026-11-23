import Foundation

/// The guided tours, as data — the iPhone half of #449.
///
/// This file mirrors Android's `Tours.kt` and the website's `lib/tours.ts` one to one,
/// deliberately: same ids, same order, same wording. Put the three side by side and they read
/// alike, which is the rule for Android and the iPhone (`CLAUDE.md`, "Same navigation on Android
/// and iOS") and `scripts/check_i18n.py` enforces for the words themselves.
///
/// What a tour *is* changed with this issue. The old one was a `TabView` of six pages shown once
/// after the first sign-in, describing features in the voice of a product page and then gone for
/// good — afterwards the beekeeper stood on a screen reading "No apiaries yet" with nothing
/// pointed at. These point at the real control, on the real screen, and wait for the real tap.
///
/// `anchor` is the whole coupling between a tour and the interface: a string passed to
/// `.tourAnchor(...)` on an actual view. It is also the first thing that will rot, so
/// `ToursTests` pins every one of them, and the engine refuses to dim the screen with nothing lit.
enum TourAdvance {
    /// The step ends when the beekeeper taps *that* control. The default, and the point.
    case tap
    /// A small "next" for a step that only explains something. Used sparingly: a tour made of
    /// these is the carousel again, and `ToursTests` forbids one.
    case manual
}

struct TourStep {
    /// The value passed to `.tourAnchor(...)` on the view to point at.
    let anchor: String
    /// The key in `Localizable.strings`.
    let textKey: String
    var advance: TourAdvance = .tap
    /// Which tab this step lives on, so a tour started from Settings can get there.
    var tab: RootTab?
}

struct Tour: Identifiable {
    let id: String
    let titleKey: String
    /// Shown in the list in Settings, so somebody can tell what they are about to be shown.
    let summaryKey: String
    let steps: [TourStep]

    var title: String { NSLocalizedString(titleKey, comment: "") }
    var summary: String { NSLocalizedString(summaryKey, comment: "") }
}

/// The five bottom tabs, in the order they are in — the same order as Android's.
enum RootTab: Int {
    case apiaries = 0
    case scan = 1
    case hornets = 2
    case members = 3
    case settings = 4
}

/// Anchor names, in one place, so a view and a tour cannot drift apart silently.
enum TourAnchors {
    static let newApiary = "new-apiary"
    static let apiaryName = "apiary-name"
    static let apiarySave = "apiary-save"
    static let apiaryOpen = "apiary-open"
    static let newHive = "new-hive"
    static let newInspection = "new-inspection"
    static let qrBatches = "qr-batches"
    static let newQrBatch = "new-qr-batch"
    static let scanTab = "scan-tab"
    static let hornetsTab = "hornets-tab"
    static let trapNew = "trap-new"
    static let trapName = "trap-name"
    static let trapRegister = "trap-register"
    static let beekeepingYear = "beekeeping-year"
    static let yearRate = "year-rate"
    static let treatments = "treatments"
    static let treatmentPlan = "treatment-plan"
    static let shareApiary = "share-apiary"
    static let sharingInvite = "sharing-invite"
    static let customFields = "custom-fields"
    static let fieldNew = "field-new"
    static let moveHives = "move-hives"
    static let movesOverview = "moves-overview"
}

enum Tours {
    /// The same nine as Android and the website, in the same order. A tenth added on one platform
    /// only is the kind of difference a store reviewer sees.
    static let all: [Tour] = [
        Tour(
            id: "first-steps",
            titleKey: "tour.firstSteps.title",
            summaryKey: "tour.firstSteps.summary",
            steps: [
                TourStep(anchor: TourAnchors.newApiary, textKey: "tour.firstSteps.step1", tab: .apiaries),
                TourStep(anchor: TourAnchors.apiaryName, textKey: "tour.firstSteps.step2", advance: .manual),
                TourStep(anchor: TourAnchors.apiarySave, textKey: "tour.firstSteps.step3"),
                TourStep(anchor: TourAnchors.apiaryOpen, textKey: "tour.firstSteps.step4"),
                TourStep(anchor: TourAnchors.newHive, textKey: "tour.firstSteps.step5"),
            ]
        ),
        Tour(
            id: "offline",
            titleKey: "tour.offline.title",
            summaryKey: "tour.offline.summary",
            steps: [
                TourStep(anchor: TourAnchors.newInspection, textKey: "tour.offline.step1", advance: .manual),
            ]
        ),
        Tour(
            id: "qr-codes",
            titleKey: "tour.qrCodes.title",
            summaryKey: "tour.qrCodes.summary",
            steps: [
                TourStep(anchor: TourAnchors.qrBatches, textKey: "tour.qrCodes.step1", tab: .apiaries),
                TourStep(anchor: TourAnchors.newQrBatch, textKey: "tour.qrCodes.step2"),
                TourStep(anchor: TourAnchors.scanTab, textKey: "tour.qrCodes.step3", advance: .manual),
            ]
        ),
        Tour(
            id: "hornets",
            titleKey: "tour.hornets.title",
            summaryKey: "tour.hornets.summary",
            steps: [
                TourStep(anchor: TourAnchors.hornetsTab, textKey: "tour.hornets.step1"),
                TourStep(anchor: TourAnchors.trapNew, textKey: "tour.hornets.step2", tab: .hornets),
                TourStep(anchor: TourAnchors.trapName, textKey: "tour.hornets.step3", advance: .manual),
                TourStep(anchor: TourAnchors.trapRegister, textKey: "tour.hornets.step4"),
            ]
        ),
        Tour(
            id: "year",
            titleKey: "tour.year.title",
            summaryKey: "tour.year.summary",
            steps: [
                TourStep(anchor: TourAnchors.beekeepingYear, textKey: "tour.year.step1", tab: .apiaries),
                TourStep(anchor: TourAnchors.yearRate, textKey: "tour.year.step2", advance: .manual),
            ]
        ),
        Tour(
            id: "treatments",
            titleKey: "tour.treatments.title",
            summaryKey: "tour.treatments.summary",
            steps: [
                TourStep(anchor: TourAnchors.treatments, textKey: "tour.treatments.step1"),
                TourStep(anchor: TourAnchors.treatmentPlan, textKey: "tour.treatments.step2"),
            ]
        ),
        Tour(
            id: "sharing",
            titleKey: "tour.sharing.title",
            summaryKey: "tour.sharing.summary",
            steps: [
                TourStep(anchor: TourAnchors.shareApiary, textKey: "tour.sharing.step1"),
                TourStep(anchor: TourAnchors.sharingInvite, textKey: "tour.sharing.step2", advance: .manual),
            ]
        ),
        Tour(
            id: "custom-fields",
            titleKey: "tour.customFields.title",
            summaryKey: "tour.customFields.summary",
            steps: [
                TourStep(anchor: TourAnchors.customFields, textKey: "tour.customFields.step1"),
                TourStep(anchor: TourAnchors.fieldNew, textKey: "tour.customFields.step2"),
            ]
        ),
        Tour(
            id: "moves",
            titleKey: "tour.moves.title",
            summaryKey: "tour.moves.summary",
            steps: [
                TourStep(anchor: TourAnchors.moveHives, textKey: "tour.moves.step1"),
                TourStep(anchor: TourAnchors.movesOverview, textKey: "tour.moves.step2",
                         advance: .manual, tab: .apiaries),
            ]
        ),
    ]

    static func byId(_ id: String) -> Tour? {
        all.first { $0.id == id }
    }
}
