import SwiftUI
import QuickLook

struct QRBatchListView: View {
    @StateObject private var vm = QRBatchListViewModel()
    @State private var batchToDelete: QrBatchSummary?
    @State private var showCreate = false
    @State private var newCount = 5

    var body: some View {
        Group {
            if vm.isLoading && vm.batches.isEmpty {
                ProgressView()
            } else if vm.batches.isEmpty {
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
                List(vm.batches) { batch in
                    NavigationLink(destination: QRBatchDetailView(batchId: batch.id)) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(batch.createdAt, style: .date).font(.headline)
                            Text("\(batch.linkedCount)/\(batch.count) \(NSLocalizedString("label.linked", comment: ""))")
                                .font(.subheadline).foregroundColor(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        // Only where the server would accept it: a code on a hive keeps its batch.
                        if vm.canDelete(batch) {
                            Button(role: .destructive) {
                                batchToDelete = batch
                            } label: {
                                Label(NSLocalizedString("action.delete", comment: ""), systemImage: "trash")
                            }
                            .accessibilityIdentifier("deleteBatchButton")
                        }
                    }
                }
            }
        }
        .navigationTitle(NSLocalizedString("screen.qrBatches", comment: ""))
        .hpScreenBackground()
        .hpFloatingButton(NSLocalizedString("action.newBatch", comment: ""), identifier: "newBatchButton") {
            showCreate = true
        }
        .task { await vm.load() }
        .refreshable { await vm.load() }
        .alert(NSLocalizedString("action.newBatch", comment: ""), isPresented: $showCreate) {
            TextField(NSLocalizedString("field.count", comment: ""), value: $newCount, format: .number)
                .keyboardType(.numberPad)
            Button(NSLocalizedString("action.generate", comment: "")) {
                Task { await vm.create(count: newCount) }
            }
            Button(NSLocalizedString("action.cancel", comment: ""), role: .cancel) {}
        } message: {
            Text(NSLocalizedString("alert.batchCountHint", comment: ""))
        }
        .confirmationDialog(
            NSLocalizedString("confirm.deleteBatch.title", comment: ""),
            isPresented: Binding(
                get: { batchToDelete != nil },
                set: { if !$0 { batchToDelete = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button(NSLocalizedString("action.delete", comment: ""), role: .destructive) {
                if let batch = batchToDelete { Task { await vm.delete(batch) } }
                batchToDelete = nil
            }
            Button(NSLocalizedString("action.cancel", comment: ""), role: .cancel) { batchToDelete = nil }
        } message: {
            Text(NSLocalizedString("confirm.deleteBatch.message", comment: ""))
        }
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

struct QRBatchDetailView: View {
    @StateObject private var vm: QRBatchDetailViewModel

    init(batchId: String) {
        _vm = StateObject(wrappedValue: QRBatchDetailViewModel(batchId: batchId))
    }

    var body: some View {
        Group {
            // Never leave the Group empty before the first load: an empty Group has no view to attach `.task` to,
            // so the load would never start.
            if vm.batch == nil {
                if vm.errorMessage == nil {
                    ProgressView()
                } else {
                    Color.clear
                }
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
