import SwiftUI

private let supporterInfoURL = URL(string: "https://hivepulse.multihead.de/contribute")!

struct MembersView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var publicStats: PublicStats?
    @State private var isLoadingStats = false

    private let statsService = StatsService()

    private var isUnlocked: Bool {
        authVM.currentUser?.isSupporter == true || authVM.currentUser?.isAdmin == true
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Stats grid — blurred for non-supporters
                LazyVGrid(
                    columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)],
                    spacing: 12
                ) {
                    HPStatPill(label: NSLocalizedString("members.stat.avgVarroa", comment: ""),
                               value: formatVarroa(), systemImage: "ant", iconColor: .hpRed)
                    HPStatPill(label: NSLocalizedString("members.stat.goodMood", comment: ""),
                               value: formatMood(), systemImage: "face.smiling", iconColor: .hpGreen)
                    HPStatPill(label: NSLocalizedString("members.stat.avgBrood", comment: ""),
                               value: formatBrood(), systemImage: "square.grid.3x3", iconColor: .hpGreen)
                    HPStatPill(label: NSLocalizedString("members.stat.interval", comment: ""),
                               value: formatInterval(), systemImage: "clock")
                }
                .blur(radius: isUnlocked ? 0 : 8)
                .animation(.easeInOut(duration: 0.25), value: isUnlocked)
                .overlay {
                    if isLoadingStats {
                        ProgressView()
                    }
                }

                if isUnlocked {
                    supporterContent()
                } else {
                    supporterGate()
                }
            }
            .padding()
        }
        .hpScreenBackground()
        .navigationTitle(NSLocalizedString("members.title", comment: ""))
        .task {
            isLoadingStats = true
            publicStats = try? await statsService.publicStats()
            isLoadingStats = false
        }
    }

    // MARK: - Stat formatting

    private func formatVarroa() -> String {
        guard let v = publicStats?.avgVarroaCount else { return "—" }
        return String(format: "%.1f", v)
    }

    private func formatMood() -> String {
        guard let dist = publicStats?.moodDistribution else { return "—" }
        let total = dist.values.reduce(0, +)
        guard total > 0 else { return "—" }
        let calm = dist["calm"] ?? 0
        return "\(calm * 100 / total)%"
    }

    private func formatBrood() -> String {
        guard let v = publicStats?.avgBroodFrames else { return "—" }
        return String(format: "%.1f", v)
    }

    private func formatInterval() -> String {
        guard let v = publicStats?.avgInspectionIntervalDays else { return "—" }
        return "\(Int(v))d"
    }

    // MARK: - Sub-views

    @ViewBuilder
    private func supporterContent() -> some View {
        VStack(spacing: 8) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 32))
                .foregroundColor(.hpAmber)
            Text(NSLocalizedString("members.comingSoon", comment: ""))
                .font(.dmSans(15, relativeTo: .subheadline))
                .foregroundColor(.hpStone500)
                .multilineTextAlignment(.center)
        }
        .hpCard(padding: 20, alignment: .center)
    }

    @ViewBuilder
    private func supporterGate() -> some View {
        VStack(spacing: 12) {
            Image(systemName: "star.circle.fill")
                .font(.system(size: 36))
                .foregroundColor(.hpAmber)
            Text(NSLocalizedString("members.gate.title", comment: ""))
                .font(.dmSans(18, weight: .bold, relativeTo: .headline))
                .foregroundColor(.hpStone900)
            Text(NSLocalizedString("members.gate.desc", comment: ""))
                .font(.dmSans(15, relativeTo: .subheadline))
                .foregroundColor(.hpStone500)
                .multilineTextAlignment(.center)
            Link(NSLocalizedString("members.becomeSupporter", comment: ""),
                 destination: supporterInfoURL)
                .buttonStyle(HPPrimaryButtonStyle())
                .padding(.top, 4)
        }
        .hpCard(padding: 20, alignment: .center)
    }
}
