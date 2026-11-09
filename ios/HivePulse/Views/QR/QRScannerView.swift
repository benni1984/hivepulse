import SwiftUI
import VisionKit

struct QRScannerView: UIViewControllerRepresentable {
    let onScan: (String) -> Void

    func makeUIViewController(context: Context) -> DataScannerViewController {
        let vc = DataScannerViewController(
            recognizedDataTypes: [.barcode(symbologies: [.qr])],
            qualityLevel: .balanced,
            isHighlightingEnabled: true
        )
        vc.delegate = context.coordinator
        try? vc.startScanning()
        return vc
    }

    func updateUIViewController(_ vc: DataScannerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(onScan: onScan) }

    final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        let onScan: (String) -> Void
        private var scanned = false

        init(onScan: @escaping (String) -> Void) { self.onScan = onScan }

        func dataScanner(_ dataScanner: DataScannerViewController, didTapOn item: RecognizedItem) {
            guard !scanned, case .barcode(let barcode) = item, let value = barcode.payloadStringValue else { return }
            scanned = true
            dataScanner.stopScanning()
            onScan(value)
        }
    }
}

/// The aiming frame and the line that says what to aim at, drawn over the camera image.
///
/// The twin of Android's `ScanViewfinder` (`ui/qr/QRScanScreen.kt`) down to the numbers: a 240pt
/// frame, 3pt amber, 20pt corners, and the instruction under it on its own scrim because it sits
/// over whatever the camera happens to be looking at. Changing one of them means changing the
/// other; `backend/tests/test_scan_screen_parity.py` is what notices if only one moves.
struct ScanViewfinder: View {
    var body: some View {
        VStack(spacing: 24) {
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.hpAmber, lineWidth: 3)
                .frame(width: 240, height: 240)
                .accessibilityElement()
                .accessibilityIdentifier("scanViewfinder")
                .accessibilityLabel(NSLocalizedString("scan.viewfinder", comment: ""))

            Text(NSLocalizedString("scan.instruction", comment: ""))
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                // A scrim, not a brand surface: it has to carry its own contrast.
                .background(Color.black.opacity(0.55), in: RoundedRectangle(cornerRadius: 12))
                .accessibilityIdentifier("scanInstruction")
        }
        .padding(24)
    }
}

/// The Scan tab.
///
/// Opening it opens the camera, as on Android (#425). It used to be a page with a large glyph, a
/// sentence and an amber button that opened the scanner in a sheet — kinder, and one tap too many:
/// at the hive, in gloves, the tab *is* the request to scan. What that page said is kept, drawn
/// over the preview, so nothing is lost but the tap.
struct QRScanEntryView: View {
    @EnvironmentObject var apiaryVM: ApiaryViewModel
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var scannedToken: String?
    @State private var showInitialize = false
    @State private var linkedHive: HiveOut?
    @State private var navigateToHive = false
    @State private var cameraUsable = false
    /// The scanner stops itself after a hit so one code is not read twice. As a sheet it was torn
    /// down on dismissal and came back fresh; as the tab's own content it would stay stopped for
    /// good, so a new generation builds a new coordinator once the scan has been dealt with.
    @State private var scanGeneration = 0

    /// DEBUG only: `DataScannerViewController` is unsupported in the simulator, so without this the
    /// Scan tab there is permanently the "no camera" page and nothing above can be tested or
    /// photographed. It replaces the live preview, never the overlay.
    static var usesMockPreview: Bool {
        #if DEBUG
        return ProcessInfo.processInfo.arguments.contains("-mockCameraPreview")
        #else
        return false
        #endif
    }

    private static var cameraIsUsable: Bool {
        if usesMockPreview { return true }
        // `isAvailable` is false when the person has refused the camera, so this covers the
        // refusal as well as a device that cannot do it at all.
        return DataScannerViewController.isSupported && DataScannerViewController.isAvailable
    }

    var body: some View {
        ZStack {
            if cameraUsable {
                cameraLayer
                    .ignoresSafeArea(edges: .bottom)
                ScanViewfinder()
            } else {
                cameraUnavailable
            }

            if let err = errorMessage {
                VStack {
                    Spacer()
                    ErrorBanner(message: err) { errorMessage = nil }
                        .padding()
                }
            }
        }
        .navigationTitle(NSLocalizedString("scan.title", comment: ""))
        // Re-read on every appearance: the person may have granted or refused the camera in
        // Settings since the last time this tab was open.
        .onAppear { cameraUsable = Self.cameraIsUsable }
        .sheet(isPresented: $showInitialize) {
            if let token = scannedToken {
                HiveInitializeView(
                    qrToken: token,
                    apiaries: apiaryVM.apiaries,
                    onDone: { newHive in
                        linkedHive = newHive
                        navigateToHive = true
                    },
                    onCreateApiary: { name, description, latitude, longitude, address, isPublic in
                        _ = try await apiaryVM.create(name: name, description: description,
                                                      latitude: latitude, longitude: longitude,
                                                      address: address, isPublic: isPublic)
                    }
                )
            }
        }
        .navigationDestination(isPresented: $navigateToHive) {
            if let hive = linkedHive {
                HiveDetailView(hive: hive, apiaryId: hive.apiaryId)
            }
        }
        .overlay { if isLoading { LoadingOverlay() } }
    }

    @ViewBuilder private var cameraLayer: some View {
        if Self.usesMockPreview {
            Color.hpStone900
        } else {
            QRScannerView { token in
                Task { await handleScan(token: token) }
            }
            .id(scanGeneration)
        }
    }

    private var cameraUnavailable: some View {
        VStack(spacing: 24) {
            Image(systemName: "qrcode.viewfinder")
                .font(.system(size: 96))
                .foregroundColor(.hpAmberDark)

            Text(NSLocalizedString("error.cameraNotAvailable", comment: ""))
                .font(.title3)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal, 32)
                .accessibilityIdentifier("scanCameraUnavailable")
        }
    }

    private func handleScan(token: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let result = try await HiveService().resolveQR(token: token)
            switch result {
            case .linked(let hive):
                linkedHive = hive
                navigateToHive = true
            case .unlinked(let t):
                scannedToken = t
                showInitialize = true
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
        // Whatever happened, the next code should be readable without leaving the tab.
        scanGeneration += 1
    }
}
