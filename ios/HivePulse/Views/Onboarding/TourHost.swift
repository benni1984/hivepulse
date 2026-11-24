import SwiftUI

/// The tour engine: it points at the real control and waits for the real tap (#449).
///
/// On the website this is a DOM overlay. Here there is no DOM, so the targets report their own
/// position — `.tourAnchor(id)` publishes the view's bounds through a preference — and the
/// overlay draws over the rectangle it is handed. That is the whole difference between the two
/// engines, and the reason they could not be shared. Android does the same thing with
/// `onGloballyPositioned`; the three files read alike on purpose.
///
/// **One shade with the target cut out of it**, where the website draws four rectangles around
/// the target instead. The website needs the four because a `<div>` over a button swallows the
/// click. Here the shade is drawn with `.allowsHitTesting(false)`, so every touch goes straight
/// through to the control below — lit one included. Nothing intercepts and replays its tap, which
/// is the kind of cleverness that breaks on the one control nobody tested.
///
/// **Three things the engine owes the beekeeper**, learned from how these go wrong:
///
///  1. **Never trap them.** A step waiting for a tap that cannot happen — a disabled button, a
///     control two screens away — would otherwise sit there for ever. If the anchor has not
///     reported itself within `findTimeout` the overlay says so and offers to skip or leave.
///  2. **Always escapable.** Every step shows a way out.
///  3. **Announce itself.** The caption is an accessibility element VoiceOver is moved to on
///     every step.

// MARK: - The anchors

struct TourAnchorKey: PreferenceKey {
    static var defaultValue: [String: Anchor<CGRect>] = [:]
    static func reduce(value: inout [String: Anchor<CGRect>],
                       nextValue: () -> [String: Anchor<CGRect>]) {
        value.merge(nextValue()) { _, new in new }
    }
}

extension View {
    /// Marks a view as something a tour can point at.
    ///
    /// The tap is observed with a simultaneous gesture and never consumed, which is this
    /// platform's equivalent of the website's capture-phase listener: the engine learns that the
    /// control was pressed without standing between the finger and the button.
    ///
    /// **Except on a `NavigationLink`**, where a `TapGesture` — simultaneous or not — competes
    /// with the link's own and the navigation stops happening. That is not a tour bug a test
    /// would report as one: every test that opens an apiary fails instead, which is how this was
    /// found. A row like that is a `.navigates` step and passes `observesTap: false`; the engine
    /// then takes the control's *disappearance* as the tap, which is the only way it can go.
    func tourAnchor(_ id: String, observesTap: Bool = true) -> some View {
        self
            .anchorPreference(key: TourAnchorKey.self, value: .bounds) { [id: $0] }
            .modifier(TourTapObserver(id: id, enabled: observesTap))
    }
}

private struct TourTapObserver: ViewModifier {
    let id: String
    let enabled: Bool

    func body(content: Content) -> some View {
        if enabled {
            content.simultaneousGesture(TapGesture().onEnded { TourController.shared.tapped(id) })
        } else {
            content
        }
    }
}

// MARK: - The controller

@MainActor
final class TourController: ObservableObject {
    static let shared = TourController()

    @Published private(set) var activeId: String?
    @Published private(set) var index = 0
    /// Set by the host so a step can send the beekeeper to the tab it lives on.
    var selectTab: ((RootTab) -> Void)?

    private let onboarding: OnboardingStore

    init(onboarding: OnboardingStore = OnboardingStore()) {
        self.onboarding = onboarding
    }

    var tour: Tour? { activeId.flatMap(Tours.byId) }
    var step: TourStep? {
        guard let tour, index < tour.steps.count else { return nil }
        return tour.steps[index]
    }

    func start(_ id: String) {
        guard let tour = Tours.byId(id) else { return }
        // Take them to where the first step lives, before anything is drawn. Without this, every
        // tour started from Settings would open on "the control for this step is not on this
        // screen" — honest, and useless.
        if let tab = tour.steps.first?.tab { selectTab?(tab) }
        index = 0
        activeId = id
    }

    func stop() { activeId = nil }

    func next() {
        guard let tour else { return }
        guard index + 1 < tour.steps.count else {
            onboarding.markTourFinished(tour.id)
            activeId = nil
            return
        }
        index += 1
        if let tab = step?.tab { selectTab?(tab) }
    }

    /// Called by `tourAnchor` when a control the current step points at is pressed.
    func tapped(_ anchor: String) {
        guard let step, step.anchor == anchor, step.advance == .tap else { return }
        next()
    }
}

// MARK: - The overlay

struct TourHost<Content: View>: View {
    @ObservedObject var controller: TourController
    let selectTab: (RootTab) -> Void
    @ViewBuilder var content: () -> Content

    /// Long enough for a route change or a list to arrive, short enough not to feel stuck.
    private let findTimeout: TimeInterval = 2.5

    @State private var lost = false
    /// Whether the current step's control has been on screen yet — a `.navigates` step ends when
    /// it has been and then is not.
    @State private var seen = false

    var body: some View {
        content()
            .overlayPreferenceValue(TourAnchorKey.self) { anchors in
                GeometryReader { proxy in
                    if let tour = controller.tour, let step = controller.step {
                        overlay(tour: tour, step: step,
                                rect: anchors[step.anchor].map { proxy[$0] },
                                height: proxy.size.height)
                    }
                }
            }
            .onAppear { controller.selectTab = selectTab }
    }

    @ViewBuilder
    private func overlay(tour: Tour, step: TourStep, rect: CGRect?, height: CGFloat) -> some View {
        let counter = "\(controller.index + 1)/\(tour.steps.count)"
        let manual = step.advance == .manual
        // Below the target where there is room beneath it, above it otherwise. Without this the
        // caption for the amber create button — which lives in the bottom corner of every screen
        // in this app — is laid out past the bottom edge, where nobody can read it and where it
        // sits over the button it is about. The website flips it the same way.
        let below = rect.map { $0.maxY + 170 < height } ?? true

        ZStack(alignment: .topLeading) {
            if let rect {
                // The shade, with the control cut out of it. `allowsHitTesting(false)` is what
                // keeps the button underneath a button.
                Color.black.opacity(0.7)
                    .reverseMask {
                        RoundedRectangle(cornerRadius: 10)
                            .frame(width: rect.width + 12, height: rect.height + 12)
                            .position(x: rect.midX, y: rect.midY)
                    }
                    .ignoresSafeArea()
                    .allowsHitTesting(false)

                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color.hpAmber, lineWidth: 2)
                    .frame(width: rect.width + 12, height: rect.height + 12)
                    .position(x: rect.midX, y: rect.midY)
                    .allowsHitTesting(false)

                card(text: NSLocalizedString(step.textKey, comment: ""),
                     counter: counter,
                     nextLabel: "tour.next",
                     onNext: manual ? { controller.next() } : nil)
                    .padding(.horizontal, 12)
                    .frame(maxWidth: .infinity,
                           maxHeight: .infinity,
                           alignment: below ? .topLeading : .bottomLeading)
                    .padding(below ? .top : .bottom,
                             below ? rect.maxY + 12 : height - rect.minY + 12)
            } else {
                // Not a dark screen with nothing lit. Either we are still looking, or we have
                // given up and say so.
                VStack {
                    Spacer()
                    card(text: NSLocalizedString(lost ? "tour.lost" : step.textKey, comment: ""),
                         counter: counter,
                         nextLabel: lost ? "tour.skipStep" : "tour.next",
                         onNext: (lost && controller.index + 1 < tour.steps.count) || (!lost && manual)
                            ? { controller.next() } : nil)
                        .padding(16)
                }
            }
        }
        // A `.navigates` step ends when its control is gone: it points at a row that pushes
        // another screen, and on such a row the engine cannot watch for the tap itself.
        .onChange(of: rect != nil) { _, present in
            if present {
                seen = true
            } else if seen && step.advance == .navigates {
                controller.next()
            }
        }
        // Only the branch above reads `lost`, and that branch only exists while the anchor has
        // not reported itself -- so this can simply time out. If the control arrives first, the
        // lit branch takes over and nobody ever sees the sentence.
        .task(id: "\(step.anchor)-\(controller.index)") {
            lost = false
            seen = rect != nil
            try? await Task.sleep(nanoseconds: UInt64(findTimeout * 1_000_000_000))
            lost = true
        }
    }

    private func card(text: String, counter: String, nextLabel: String,
                      onNext: (() -> Void)?) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(text)
                .font(.dmSans(15, relativeTo: .body))
                .foregroundColor(.hpStone900)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("tourText")
            HStack {
                Text(counter)
                    .font(.dmSans(12, relativeTo: .caption))
                    .foregroundColor(.hpStone500)
                    .accessibilityHidden(true)
                Spacer()
                if let onNext {
                    Button(NSLocalizedString(nextLabel, comment: ""), action: onNext)
                        .font(.dmSans(15, weight: .bold, relativeTo: .body))
                        .accessibilityIdentifier("tourNext")
                }
                Button(NSLocalizedString("tour.close", comment: "")) { controller.stop() }
                    .font(.dmSans(15, relativeTo: .body))
                    .foregroundColor(.hpStone500)
                    .accessibilityIdentifier("tourStop")
            }
        }
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(radius: 12, y: 4)
        .accessibilityIdentifier("tourCard")
        .accessibilityElement(children: .contain)
    }
}

private extension View {
    /// The inverse of `.mask`: keeps everything *except* the given shape.
    func reverseMask<Mask: View>(@ViewBuilder _ mask: () -> Mask) -> some View {
        self.mask {
            Rectangle()
                .overlay(alignment: .topLeading) {
                    mask().blendMode(.destinationOut)
                }
                .compositingGroup()
        }
    }
}
