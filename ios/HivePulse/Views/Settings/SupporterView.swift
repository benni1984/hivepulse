import SwiftUI

/// The paywall. Shown from Settings and from the Members gate, which is what it replaced there:
/// that gate used to be a button into a web page, which is both a store-review risk and, since
/// the page stopped asking for money, a dead end (#535).
struct SupporterView: View {
    @StateObject private var vm: SupporterViewModel

    /// Called when something actually unlocked, so the screen underneath can re-read the account
    /// rather than keep showing a gate over a feature that is now paid for.
    private let onUnlock: () -> Void

    init(userID: String?, onUnlock: @escaping () -> Void = {}) {
        _vm = StateObject(wrappedValue: SupporterViewModel(userID: userID))
        self.onUnlock = onUnlock
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                header
                switch vm.state {
                case .loading:
                    ProgressView().padding(.vertical, 32)
                case .offers(let offers):
                    benefits
                    offerList(offers)
                case .alreadySupporter:
                    active
                case .unavailable:
                    benefits
                    unavailable
                case .failed(let message):
                    failed(message)
                }
                restoreRow
            }
            .padding(16)
        }
        .hpScreenBackground()
        .navigationTitle(NSLocalizedString("supporter.title", comment: ""))
        .task { await vm.load() }
        .onChange(of: vm.didUnlock) { _, unlocked in
            if unlocked { onUnlock() }
        }
        .alert(NSLocalizedString("supporter.notice", comment: ""),
               isPresented: Binding(get: { vm.notice != nil },
                                    set: { if !$0 { vm.notice = nil } })) {
            Button(NSLocalizedString("action.done", comment: "")) { vm.notice = nil }
        } message: {
            Text(vm.notice ?? "")
        }
    }

    // MARK: - Pieces

    private var header: some View {
        VStack(spacing: 8) {
            Image(systemName: "star.circle.fill")
                .font(.system(size: 40))
                .foregroundColor(.hpAmber)
            Text(NSLocalizedString("supporter.heading", comment: ""))
                .font(.dmSans(20, weight: .bold, relativeTo: .title3))
                .foregroundColor(.hpStone900)
                .multilineTextAlignment(.center)
            Text(NSLocalizedString("supporter.intro", comment: ""))
                .font(.dmSans(15, relativeTo: .subheadline))
                .foregroundColor(.hpStone500)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 8)
    }

    private var benefits: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(Self.benefitKeys, id: \.self) { key in
                HStack(alignment: .firstTextBaseline, spacing: 10) {
                    Image(systemName: "checkmark")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.hpAmberDark)
                    Text(NSLocalizedString(key, comment: ""))
                        .font(.dmSans(15, relativeTo: .body))
                        .foregroundColor(.hpStone900)
                    Spacer(minLength: 0)
                }
            }
        }
        .hpCard(padding: 16)
    }

    /// The same six the website lists under the supporter plan. Kept in one place so the two do
    /// not drift into two different promises.
    private static let benefitKeys = [
        "supporter.benefit.colonies",
        "supporter.benefit.history",
        "supporter.benefit.treatments",
        "supporter.benefit.fields",
        "supporter.benefit.sharing",
        "supporter.benefit.map",
    ]

    private func offerList(_ offers: [SupporterOffer]) -> some View {
        VStack(spacing: 10) {
            ForEach(offers) { offer in
                Button {
                    Task { await vm.buy(offer) }
                } label: {
                    HStack {
                        Text(offer.title)
                        Spacer()
                        if vm.buying == offer {
                            ProgressView().tint(.white)
                        } else {
                            Text(offer.price).bold()
                        }
                    }
                }
                .buttonStyle(HPPrimaryButtonStyle())
                .disabled(vm.buying != nil)
                .accessibilityIdentifier("supporterBuy_" + offer.id)
            }
            Text(NSLocalizedString("supporter.cancelAnytime", comment: ""))
                .font(.dmSans(13, relativeTo: .footnote))
                .foregroundColor(.hpStone500)
                .multilineTextAlignment(.center)
        }
    }

    private var active: some View {
        VStack(spacing: 10) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 32))
                .foregroundColor(.hpGreen)
            // The identifier sits on the text, not on the card: a SwiftUI container's place in
            // the element tree is not something to guess at from a test (#286).
            Text(NSLocalizedString("supporter.active.title", comment: ""))
                .font(.dmSans(17, weight: .bold, relativeTo: .headline))
                .foregroundColor(.hpStone900)
                .accessibilityIdentifier("supporterActive")
            Text(NSLocalizedString("supporter.active.desc", comment: ""))
                .font(.dmSans(15, relativeTo: .subheadline))
                .foregroundColor(.hpStone500)
                .multilineTextAlignment(.center)
            Button(NSLocalizedString("supporter.manage", comment: "")) {
                Task { await vm.manageSubscription() }
            }
            .buttonStyle(HPPrimaryButtonStyle())
            .accessibilityIdentifier("supporterManage")
        }
        .hpCard(padding: 20, alignment: .center)
    }

    /// No key in this build, or a store with nothing in it. Deliberately the same sentence as the
    /// website shows when it cannot sell: the reason differs, what somebody can do about it does
    /// not.
    private var unavailable: some View {
        VStack(spacing: 8) {
            Text(NSLocalizedString("supporter.unavailable.title", comment: ""))
                .font(.dmSans(16, weight: .bold, relativeTo: .headline))
                .foregroundColor(.hpStone900)
                .accessibilityIdentifier("supporterUnavailable")
            Text(NSLocalizedString("supporter.unavailable.desc", comment: ""))
                .font(.dmSans(14, relativeTo: .subheadline))
                .foregroundColor(.hpStone500)
                .multilineTextAlignment(.center)
        }
        .hpCard(padding: 16, alignment: .center)
    }

    private func failed(_ message: String) -> some View {
        VStack(spacing: 10) {
            Text(message)
                .font(.dmSans(14, relativeTo: .subheadline))
                .foregroundColor(.hpStone500)
                .multilineTextAlignment(.center)
            Button(NSLocalizedString("supporter.retry", comment: "")) {
                Task { await vm.load() }
            }
            .buttonStyle(HPPrimaryButtonStyle())
        }
        .hpCard(padding: 16, alignment: .center)
    }

    /// Reachable in every state, including before anything has been bought. Apple requires a
    /// restore that does not sit behind a purchase, and somebody who reinstalled or changed phone
    /// has no other way back to what they paid for.
    private var restoreRow: some View {
        Button(NSLocalizedString("supporter.restore", comment: "")) {
            Task { await vm.restore() }
        }
        .font(.dmSans(15, relativeTo: .body))
        .foregroundColor(.hpAmberDark)
        .disabled(vm.buying != nil)
        .accessibilityIdentifier("supporterRestore")
        .padding(.top, 4)
    }
}
