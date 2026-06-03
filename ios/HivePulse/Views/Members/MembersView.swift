import SwiftUI

private let supporterInfoURL = URL(string: "https://apiscan-two.vercel.app/contribute")!

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
            VStack(spacing: 24) {
                // Stats grid — blurred for non-supporters
                LazyVGrid(
                    columns: [GridItem(.flexible()), GridItem(.flexible())],
                    spacing: 12
                ) {
                    statCard(formatVarroa(), label: NSLocalizedString("members.stat.avgVarroa", comment: ""))
                    statCard(formatMood(),   label: NSLocalizedString("members.stat.goodMood",   comment: ""))
                    statCard(formatBrood(),  label: NSLocalizedString("members.stat.avgBrood",   comment: ""))
                    statCard(formatInterval(), label: NSLocalizedString("members.stat.interval", comment: ""))
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
    private func statCard(_ value: String, label: String) -> some View {
        VStack(spacing: 6) {
            Text(value)
                .font(.title2).fontWeight(.bold)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity, minHeight: 80)
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    @ViewBuilder
    private func supporterContent() -> some View {
        VStack(spacing: 8) {
            Label("", systemImage: "checkmark.seal.fill")
                .labelStyle(.iconOnly)
                .font(.system(size: 32))
                .foregroundColor(.orange)
            Text(NSLocalizedString("members.comingSoon", comment: ""))
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    @ViewBuilder
    private func supporterGate() -> some View {
        VStack(spacing: 12) {
            Image(systemName: "star.circle.fill")
                .font(.system(size: 36))
                .foregroundColor(.orange)
            Text(NSLocalizedString("members.gate.title", comment: ""))
                .font(.headline)
            Text(NSLocalizedString("members.gate.desc", comment: ""))
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            Link(NSLocalizedString("members.becomeSupporter", comment: ""),
                 destination: supporterInfoURL)
                .font(.subheadline.weight(.semibold))
                .buttonStyle(.borderedProminent)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}
