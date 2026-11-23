import SwiftUI

/// Every tour there is, in Settings, restartable (#449).
///
/// This is the part that decides whether #449 was worth doing on the phone. An overlay that
/// points at the real button is a better first run; a *list* of them is the thing the carousel
/// could not be at all. That ran once, after the first sign-in, and the only way back was a
/// button that replayed the same six pages. Somebody who had kept bees with this app for a year
/// and still did not know what a QR batch was for had nowhere to look.
///
/// The mark beside a finished tour is a mark and not a lock: the start button stays. Seen is not
/// spent. Android's `TourList.kt` is the same list, in the same place in Settings.
struct TourListView: View {
    let onStart: (String) -> Void

    private let onboarding = OnboardingStore()
    @State private var finished: Set<String> = []

    var body: some View {
        Section {
            ForEach(Tours.all) { tour in
                Button {
                    onStart(tour.id)
                } label: {
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
                .accessibilityIdentifier("startTour-\(tour.id)")
            }
        } header: {
            Text(NSLocalizedString("tour.listTitle", comment: ""))
        } footer: {
            Text(NSLocalizedString("tour.listIntro", comment: ""))
        }
        // Read on appearing rather than held in the view: a tour finished since Settings was
        // last built belongs in the list.
        .onAppear { finished = onboarding.finishedTours }
    }
}
