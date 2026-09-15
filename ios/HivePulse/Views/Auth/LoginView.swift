import SwiftUI
import SafariServices

// MARK: - SFSafariViewController wrapper

struct SafariView: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> SFSafariViewController {
        SFSafariViewController(url: url)
    }
    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}

struct LoginView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var showRegister = false
    @State private var showForgotPassword = false

    var body: some View {
        NavigationStack {
            GeometryReader { geo in
                ScrollView {
                    VStack {
                        Spacer(minLength: 24)
                        loginCard
                            .padding(.horizontal, 20)
                        Spacer(minLength: 24)
                    }
                    .frame(minHeight: geo.size.height)
                }
            }
            .background(Color.hpStone50.ignoresSafeArea())
            .navigationDestination(isPresented: $showRegister) {
                RegisterView().environmentObject(authVM)
            }
            .sheet(isPresented: $showForgotPassword) {
                if let url = URL(string: "https://hivepulse.multihead.de/dashboard/forgot-password") {
                    SafariView(url: url)
                        .ignoresSafeArea()
                }
            }
        }
    }

    /// White card on stone-50 — same composition as the web and Android sign-in screens.
    private var loginCard: some View {
        VStack(spacing: 0) {
            HivePulseLogo(size: 64)

            HivePulseWordmark(size: 30)
                .padding(.top, 16)

            Text(NSLocalizedString("login.subtitle", comment: ""))
                .font(.dmSans(15, relativeTo: .subheadline))
                .foregroundColor(.hpStone500)
                .multilineTextAlignment(.center)
                .padding(.top, 6)

            VStack(spacing: 12) {
                TextField(NSLocalizedString("field.email", comment: ""), text: $email)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .hpInputField()

                SecureField(NSLocalizedString("field.password", comment: ""), text: $password)
                    .hpInputField()
            }
            .padding(.top, 28)

            if let error = authVM.errorMessage {
                ErrorBanner(message: error) { authVM.errorMessage = nil }
                    .padding(.top, 12)
            }

            Button {
                Task { await authVM.login(email: email, password: password) }
            } label: {
                HStack(spacing: 8) {
                    if authVM.isLoading { ProgressView().tint(Color.hpStone900) }
                    Text(NSLocalizedString("action.login", comment: ""))
                }
            }
            .buttonStyle(HPPrimaryButtonStyle())
            .disabled(authVM.isLoading || email.isEmpty || password.isEmpty)
            .padding(.top, 20)

            Button(NSLocalizedString("action.forgotPassword", comment: "")) {
                showForgotPassword = true
            }
            .font(.dmSans(14, relativeTo: .subheadline))
            .foregroundColor(.hpStone500)
            .padding(.top, 14)

            Button(NSLocalizedString("action.register", comment: "")) {
                showRegister = true
            }
            .font(.dmSans(15, weight: .bold, relativeTo: .subheadline))
            .foregroundColor(.hpAmberDark)
            .padding(.top, 10)
        }
        .padding(28)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Color.hpStone200, lineWidth: 1))
        .shadow(color: Color.black.opacity(0.06), radius: 16, x: 0, y: 6)
    }
}
