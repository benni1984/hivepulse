import SwiftUI
import QuickLook

struct QRBatchListView: View {
    @State private var batches: [QrBatchSummary] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showCreate = false
    @State private var newCount = 5

    private let service = QrBatchService()

    var body: some View {
        Group {
            if isLoading && batches.isEmpty {
                ProgressView()
            } else if batches.isEmpty {
                if #available(iOS 17, *) {
                    ContentUnavailableView(
                        NSLocalizedString("empty.batches.title", comment: ""),
                        systemImage: "printer",
                        description: Text(NSLocalizedString("empty.batches.description", comment: ""))
                    )
                } else {
                    VStack(spacing: 12) {
                        Image(systemName: "printer").font(.largeTitle).foregroundColor(.secondary)
                        Text(NSLocalizedString("empty.batches.title", comment: "")).font(.headline)
                        Text(NSLocalizedString("empty.batches.description", comment: "")).font(.subheadline).foregroundColor(.secondary)
                    }
                    .padding()
                }
            } else {
                List(batches) { batch in
                    NavigationLink(destination: QRBatchDetailView(batchId: batch.id)) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(batch.createdAt, style: .date).font(.headline)
                            Text("\(batch.linkedCount)/\(batch.count) \(NSLocalizedString("label.linked", comment: ""))")
                                .font(.subheadline).foregroundColor(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
        }
        .navigationTitle(NSLocalizedString("screen.qrBatches", comment: ""))
        .hpScreenBackground()
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Button { showCreate = true } label: { Image(systemName: "plus") }
            }
        }
        .task { await load() }
        .refreshable { await load() }
        .alert(NSLocalizedString("action.newBatch", comment: ""), isPresented: $showCreate) {
            TextField(NSLocalizedString("field.count", comment: ""), value: $newCount, format: .number)
                .keyboardType(.numberPad)
            Button(NSLocalizedString("action.generate", comment: "")) {
                Task { await createBatch() }
            }
            Button(NSLocalizedString("action.cancel", comment: ""), role: .cancel) {}
        } message: {
            Text(NSLocalizedString("alert.batchCountHint", comment: ""))
        }
    }

    private func load() async {
        isLoading = true
        do {
            batches = try await service.list().items
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func createBatch() async {
        do {
            _ = try await service.create(count: max(1, min(50, newCount)))
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct QRBatchDetailView: View {
    @StateObject private var vm: QRBatchDetailViewModel

    init(batchId: String) {
        _vm = StateObject(wrappedValue: QRBatchDetailViewModel(batchId: batchId))
    }

    var body: some View {
        Group {
            if vm.isLoading && vm.batch == nil {
                ProgressView()
            } else if let batch = vm.batch {
                List {
                    Section {
                        Button {
                            Task { await vm.downloadPdf() }
                        } label: {
                            HStack(spacing: 8) {
                                if vm.isDownloading {
                                    ProgressView().tint(Color.hpStone900)
                                } else {
                                    Image(systemName: "arrow.down.doc")
                                }
                                Text(NSLocalizedString("action.downloadPDF", comment: ""))
                            }
                        }
                        .buttonStyle(HPPrimaryButtonStyle())
                        .disabled(vm.isDownloading)
                        .accessibilityIdentifier("downloadPdfButton")
                        .listRowBackground(Color.clear)
                        .listRowInsets(EdgeInsets())
                    }

                    Section {
                        ForEach(batch.tokens) { token in
                            HStack {
                                Image(systemName: token.isLinked ? "link.circle.fill" : "link.circle")
                                    .foregroundColor(token.isLinked ? .green : .secondary)
                                Text(token.token)
                                    .font(.caption)
                                    .lineLimit(1)
                                Spacer()
                                if token.isLinked {
                                    Text(NSLocalizedString("label.linked", comment: ""))
                                        .font(.caption2).foregroundColor(.green)
                                }
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle(NSLocalizedString("screen.batchDetail", comment: ""))
        .hpScreenBackground()
        .task { await vm.load() }
        // Opens the downloaded PDF right away; Quick Look offers print and share
        .quickLookPreview($vm.pdfURL)
        .alert(NSLocalizedString("alert.error", comment: ""), isPresented: Binding(
            get: { vm.errorMessage != nil },
            set: { if !$0 { vm.errorMessage = nil } }
        )) {
            Button("OK", role: .cancel) { vm.errorMessage = nil }
        } message: {
            Text(vm.errorMessage ?? "")
        }
    }
}
