import SwiftUI

struct ErrorBanner: View {
    let message: String
    var onDismiss: (() -> Void)?

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.white)
            Text(message)
                .font(.dmSans(14, weight: .medium, relativeTo: .subheadline))
                .foregroundColor(.white)
            Spacer()
            if let dismiss = onDismiss {
                Button { dismiss() } label: {
                    Image(systemName: "xmark")
                        .foregroundColor(.white)
                }
            }
        }
        .padding(14)
        .background(Color.hpRed)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .padding(.horizontal)
    }
}

struct LoadingOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.3).ignoresSafeArea()
            ProgressView()
                .progressViewStyle(.circular)
                .scaleEffect(1.5)
                .tint(.white)
        }
    }
}
