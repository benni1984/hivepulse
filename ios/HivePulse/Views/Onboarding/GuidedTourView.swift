import SwiftUI

/// Swipeable introduction shown once after the first sign-in on a device (and on demand from Settings).
/// iOS counterpart of Android's `GuidedTourScreen`.
struct GuidedTourView: View {
    let onFinished: () -> Void

    @State private var page = 0

    private struct Page {
        /// Marker for the custom hornet glyph (no fitting SF Symbol exists).
        static let hornet = "hivepulse.hornet"

        let symbol: String?   // nil shows the HivePulse logo
        let titleKey: String
        let bodyKey: String
    }

    private let pages: [Page] = [
        Page(symbol: nil,                 titleKey: "tour.welcome.title",     bodyKey: "tour.welcome.body"),
        Page(symbol: "qrcode.viewfinder", titleKey: "tour.qr.title",          bodyKey: "tour.qr.body"),
        Page(symbol: "checklist",         titleKey: "tour.inspections.title", bodyKey: "tour.inspections.body"),
        Page(symbol: "chart.bar.xaxis",   titleKey: "tour.stats.title",       bodyKey: "tour.stats.body"),
        Page(symbol: "bell.badge",        titleKey: "tour.reminders.title",   bodyKey: "tour.reminders.body"),
        Page(symbol: Page.hornet,         titleKey: "tour.hornets.title",     bodyKey: "tour.hornets.body"),
    ]

    private var isLastPage: Bool { page == pages.count - 1 }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Spacer()
                if !isLastPage {
                    Button(NSLocalizedString("tour.skip", comment: "")) { onFinished() }
                        .font(.dmSans(16, weight: .medium, relativeTo: .body))
                        .foregroundColor(.hpStone500)
                }
            }
            .frame(minHeight: 44)
            .padding(.horizontal, 24)

            TabView(selection: $page) {
                ForEach(pages.indices, id: \.self) { index in
                    pageView(pages[index])
                        .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))

            HStack(spacing: 8) {
                ForEach(pages.indices, id: \.self) { index in
                    Circle()
                        .fill(index == page ? Color.hpAmber : Color.hpStone200)
                        .frame(width: index == page ? 10 : 8, height: index == page ? 10 : 8)
                }
            }
            .padding(.vertical, 20)
            .accessibilityHidden(true)

            Button {
                if isLastPage {
                    onFinished()
                } else {
                    withAnimation { page += 1 }
                }
            } label: {
                Text(NSLocalizedString(isLastPage ? "tour.getStarted" : "tour.next", comment: ""))
            }
            .buttonStyle(HPPrimaryButtonStyle())
            .accessibilityIdentifier("tourPrimaryButton")
            .accessibilityValue("\(page + 1)/\(pages.count)")
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
        }
        .background(Color.hpStone50.ignoresSafeArea())
        // Shown right after signing in: the password keyboard can still be up and would cover the Next button.
        .onAppear {
            UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
        }
    }

    @ViewBuilder
    private func pageView(_ p: Page) -> some View {
        VStack(spacing: 0) {
            if let symbol = p.symbol {
                Group {
                    if symbol == Page.hornet {
                        Image(uiImage: HornetIcon.image(pointSize: 60))
                    } else {
                        Image(systemName: symbol)
                    }
                }
                    .font(.system(size: 52, weight: .semibold))
                    .foregroundColor(.hpAmberDark)
                    .frame(width: 120, height: 120)
                    .background(Color.hpAmber.opacity(0.15))
                    .clipShape(Circle())
                    .accessibilityHidden(true)
            } else {
                HivePulseLogo(size: 112)
            }

            Text(NSLocalizedString(p.titleKey, comment: ""))
                .font(.dmSans(26, weight: .bold, relativeTo: .title))
                .foregroundColor(.hpStone900)
                .multilineTextAlignment(.center)
                .padding(.top, 32)

            Text(NSLocalizedString(p.bodyKey, comment: ""))
                .font(.dmSans(17, relativeTo: .body))
                .foregroundColor(.hpStone500)
                .multilineTextAlignment(.center)
                .padding(.top, 12)
        }
        .padding(.horizontal, 32)
        .frame(maxHeight: .infinity)
    }
}
