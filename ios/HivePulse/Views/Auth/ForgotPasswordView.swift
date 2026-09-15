import SwiftUI

/// Native "forgot password" flow: requests the reset email in-app instead of opening the website.
/// The link inside the email still opens the web reset page.
struct ForgotPasswordView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var vm: ForgotPasswordViewModel

    init(email: String) {
        _vm = StateObject(wrappedValue: ForgotPasswordViewModel(email: email))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                HivePulseLogo(size: 48)

                Text(NSLocalizedString("forgot.title", comment: ""))
                    .font(.dmSans(22, weight: .bold, relativeTo: .title2))
                    .foregroundColor(.hpStone900)
                    .multilineTextAlignment(.center)
                    .padding(.top, 14)

                if vm.sent {
                    Text(NSLocalizedString("forgot.sent", comment: ""))
                        .font(.dmSans(15, relativeTo: .subheadline))
                        .foregroundColor(.hpStone500)
                        .multilineTextAlignment(.center)
                        .padding(.top, 8)

                    Button(NSLocalizedString("forgot.back", comment: "")) { dismiss() }
                        .buttonStyle(HPPrimaryButtonStyle())
                        .padding(.top, 24)
                } else {
                    Text(NSLocalizedString("forgot.desc", comment: ""))
                        .font(.dmSans(15, relativeTo: .subheadline))
                        .foregroundColor(.hpStone500)
                        .multilineTextAlignment(.center)
                        .padding(.top, 8)

                    TextField(NSLocalizedString("field.email", comment: ""), text: $vm.email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .hpInputField()
                        .accessibilityIdentifier("forgotEmailField")
                        .padding(.top, 22)

                    if vm.isOffline {
                        ErrorBanner(message: NSLocalizedString("forgot.offline", comment: "")) {
                            vm.isOffline = false
                        }
                        .padding(.top, 12)
                    }

                    Button {
                        Task { await vm.submit() }
                    } label: {
                        HStack(spacing: 8) {
                            if vm.isSending { ProgressView().tint(Color.hpStone900) }
                            Text(NSLocalizedString("forgot.submit", comment: ""))
                        }
                    }
                    .buttonStyle(HPPrimaryButtonStyle())
                    .disabled(!vm.canSubmit)
                    .padding(.top, 16)

                    Button(NSLocalizedString("forgot.back", comment: "")) { dismiss() }
                        .font(.dmSans(14, relativeTo: .subheadline))
                        .foregroundColor(.hpStone500)
                        .padding(.top, 12)
                }
            }
            .padding(24)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Color.hpStone200, lineWidth: 1))
            .padding(20)
        }
        .background(Color.hpStone50.ignoresSafeArea())
    }
}
