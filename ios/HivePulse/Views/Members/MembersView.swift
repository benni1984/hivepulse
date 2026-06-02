import SwiftUI

struct MembersView: View {
    @EnvironmentObject var authVM: AuthViewModel

    private let placeholderStats: [(value: String, labelKey: String)] = [
        ("3.2",  "members.stat.avgVarroa"),
        ("78%",  "members.stat.goodMood"),
        ("6.4",  "members.stat.avgBrood"),
        ("12d",  "members.stat.interval"),
    ]

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
                    ForEach(placeholderStats, id: \.labelKey) { stat in
                        statCard(stat.value, label: NSLocalizedString(stat.labelKey, comment: ""))
                    }
                }
                .blur(radius: isUnlocked ? 0 : 8)
                .animation(.easeInOut(duration: 0.25), value: isUnlocked)

                if isUnlocked {
                    supporterContent()
                } else {
                    supporterGate()
                }
            }
            .padding()
        }
        .navigationTitle(NSLocalizedString("members.title", comment: ""))
    }

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
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}
