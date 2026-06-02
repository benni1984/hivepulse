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
                    VStack(spacing: 24) {
                        Spacer(minLength: 40)

                        Image(systemName: "hexagon.fill")
                            .font(.system(size: 72))
                            .foregroundColor(.orange)

                        Text("HivePulse")
                            .font(.largeTitle.bold())

                        Text(NSLocalizedString("login.subtitle", comment: ""))
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)

                        Spacer(minLength: 20)

                        VStack(spacing: 16) {
                            TextField(NSLocalizedString("field.email", comment: ""), text: $email)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                                .textFieldStyle(.roundedBorder)

                            SecureField(NSLocalizedString("field.password", comment: ""), text: $password)
                                .textFieldStyle(.roundedBorder)
                        }

                        if let error = authVM.errorMessage {
                            ErrorBanner(message: error) { authVM.errorMessage = nil }
                        }

                        Button {
                            Task { await authVM.login(email: email, password: password) }
                        } label: {
                            HStack {
                                if authVM.isLoading { ProgressView().tint(.white) }
                                Text(NSLocalizedString("action.login", comment: ""))
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.orange)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        .disabled(authVM.isLoading || email.isEmpty || password.isEmpty)

                        Button(NSLocalizedString("action.forgotPassword", comment: "")) {
                            showForgotPassword = true
                        }
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                        Button(NSLocalizedString("action.register", comment: "")) {
                            showRegister = true
                        }
                        .foregroundColor(.orange)

                        Spacer(minLength: 20)
                    }
                    .padding()
                    .frame(minHeight: geo.size.height)
                }
            }
            .navigationDestination(isPresented: $showRegister) {
                RegisterView().environmentObject(authVM)
            }
            .sheet(isPresented: $showForgotPassword) {
                if let url = URL(string: "https://hivepulse.app/dashboard/forgot-password") {
                    SafariView(url: url)
                        .ignoresSafeArea()
                }
            }
        }
    }
}
