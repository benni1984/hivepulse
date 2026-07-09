import SwiftUI
import UIKit

struct HiveQRView: View {
    let hive: HiveOut
    private let service: any HiveServiceProtocol
    @Environment(\.dismiss) var dismiss

    @State private var qrImage: UIImage?
    @State private var loadFailed = false

    init(hive: HiveOut, service: any HiveServiceProtocol = HiveService()) {
        self.hive = hive
        self.service = service
    }

    var body: some View {
        VStack(spacing: 24) {
            Text(hive.name).font(.title2.bold())

            Group {
                if let qrImage {
                    Image(uiImage: qrImage).resizable().scaledToFit().frame(width: 250, height: 250)
                } else if loadFailed {
                    Image(systemName: "qrcode").font(.system(size: 100)).foregroundColor(.secondary)
                        .frame(width: 250, height: 250)
                } else {
                    ProgressView().frame(width: 250, height: 250)
                }
            }
            .padding()
            .background(Color.white)
            .cornerRadius(16)
            .shadow(radius: 4)

            Text(hive.qrToken)
                .font(.caption2)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Spacer()
        }
        .padding()
        .navigationTitle(NSLocalizedString("screen.qrCode", comment: ""))
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button(NSLocalizedString("action.done", comment: "")) { dismiss() }
            }
        }
        .task { await loadQR() }
    }

    private func loadQR() async {
        do {
            let data = try await service.qrImageData(hiveId: hive.id)
            qrImage = UIImage(data: data)
            loadFailed = (qrImage == nil)
        } catch {
            loadFailed = true
        }
    }
}
