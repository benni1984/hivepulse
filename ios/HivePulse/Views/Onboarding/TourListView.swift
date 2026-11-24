import SwiftUI

/// Every tour there is, restartable, on a screen of its own (#449).
///
/// This is the part that decides whether #449 was worth doing on the phone. An overlay that
/// points at the real button is a better first run; a *list* of them is the thing the carousel
/// could not be at all. That ran once, after the first sign-in, and the only way back was a
/// button that replayed the same six pages. Somebody who had kept bees with this app for a year
/// and still did not know what a QR batch was for had nowhere to look.
///
/// **A screen, not a section in Settings.** It was a section first, and nine rows with a sentence
/// each pushed everything below them — reminders, region, export, the danger zone — off the end
/// of a phone. `CLAUDE.md` gives the tour one entry in the settings order, between help and
/// diagnostics, and that is what it has. The website keeps its list inline, because a desktop
/// page has the room.
///
/// The mark beside a finished tour is a mark and not a lock: the start button stays. Seen is not
/// spent. Android's `TourListScreen.kt` is the same screen, reached the same way.
struct TourListView: View {
    @Environment(\.dismiss) private var dismiss

    private let onboarding = OnboardingStore()
    @State private var finished: Set<String> = []

    var body: some View {
        List {
            Section {
                ForEach(Tours.all) { tour in
                    Button {
                        // Out of Settings first: every tour points at a control somewhere else,
                        // and the overlay would otherwise open on "not on this screen".
                        dismiss()
                        TourController.shared.start(tour.id)
                    } label: {
                        row(tour)
                    }
                    .accessibilityIdentifier("startTour-\(tour.id)")
                }
            } footer: {
                Text(NSLocalizedString("tour.listIntro", comment: ""))
                    .font(.dmSans(13, relativeTo: .footnote))
            }
        }
        .navigationTitle(NSLocalizedString("tour.listTitle", comment: ""))
        .navigationBarTitleDisplayMode(.inline)
        // Read on appearing rather than held in the view: a tour finished since this screen was
        // last built belongs in the list with its mark.
        .onAppear { finished = onboarding.finishedTours }
    }

    private func row(_ tour: Tour) -> some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 8) {
                    Text(tour.title)
                        .font(.dmSans(16, weight: .bold, relativeTo: .body))
                        .foregroundColor(.hpStone900)
                    if finished.contains(tour.id) {
                        Text(NSLocalizedString("tour.listDone", comment: ""))
                            .font(.dmSans(12, relativeTo: .caption))
                            .foregroundColor(.hpStone500)
                    }
                }
                Text(tour.summary)
                    .font(.dmSans(13, relativeTo: .footnote))
                    .foregroundColor(.hpStone500)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer()
            Text(NSLocalizedString("tour.listStart", comment: ""))
                .font(.dmSans(15, weight: .bold, relativeTo: .body))
                .foregroundColor(.hpAmberDark)
        }
    }
}
