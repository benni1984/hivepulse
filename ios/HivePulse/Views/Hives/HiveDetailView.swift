import SwiftUI

struct HiveDetailView: View {
    @State private var hive: HiveOut
    let apiaryId: String
    @StateObject private var inspectionVM = InspectionViewModel()
    @StateObject private var hiveVM = HiveViewModel()
    @State private var showAddInspection = false
    @State private var showEdit = false
    @State private var showMove = false
    /// The hives of this apiary, so the form can offer them with this one ticked.
    @State private var siblings: [HiveOut] = []

    init(hive: HiveOut, apiaryId: String) {
        _hive = State(initialValue: hive)
        self.apiaryId = apiaryId
    }
    @State private var showStats = false
    @State private var showQR = false

    var body: some View {
        List {
            Section {
                HiveInfoRow(icon: "hexagon", label: NSLocalizedString("field.hiveType", comment: ""), value: NSLocalizedString("hiveType.\(hive.hiveType)", comment: ""))
                if let date = hive.acquisitionDate {
                    HiveInfoRow(icon: "calendar", label: NSLocalizedString("field.acquisitionDate", comment: ""), value: date)
                }
                if let lat = hive.latitude, let lon = hive.longitude {
                    HiveInfoRow(icon: "location", label: NSLocalizedString("field.location", comment: ""), value: String(format: "%.4f, %.4f", lat, lon))
                }
                if let notes = hive.notes, !notes.isEmpty {
                    HiveInfoRow(icon: "note.text", label: NSLocalizedString("field.notes", comment: ""), value: notes)
                }
            }

            if !hive.customFields.isEmpty {
                Section(NSLocalizedString("section.customFields", comment: "")) {
                    ForEach(hive.customFields.sorted(by: { $0.key < $1.key }), id: \.key) { key, value in
                        HiveInfoRow(icon: "tag", label: key, value: value.displayString)
                    }
                }
            }

            Section {
                NavigationLink(destination: HiveMovesView(hiveId: hive.id)) {
                    Label(NSLocalizedString("moves.historyTitle", comment: ""), systemImage: "arrow.left.arrow.right")
                }
                .accessibilityIdentifier("hiveMovesLink")
                if hive.isOwner {
                    Button {
                        Task {
                            await hiveVM.load(apiaryId: apiaryId)
                            siblings = hiveVM.hives.contains(where: { $0.id == hive.id }) ? hiveVM.hives : [hive] + hiveVM.hives
                            showMove = true
                        }
                    } label: {
                        Label(NSLocalizedString("moves.moveHive", comment: ""), systemImage: "arrow.triangle.swap")
                    }
                    .accessibilityIdentifier("moveThisHiveButton")
                }
                NavigationLink(destination: TreatmentsView(target: .hive(hive.id))) {
                    Label(NSLocalizedString("treatments.title", comment: ""), systemImage: "cross.case")
                }
                .accessibilityIdentifier("hiveTreatmentsLink")
            }

            Section(NSLocalizedString("section.inspections", comment: "")) {
                if inspectionVM.inspections.isEmpty && !inspectionVM.isLoading {
                    Text(NSLocalizedString("empty.inspections", comment: ""))
                        .foregroundColor(.secondary)
                } else {
                    ForEach(inspectionVM.inspections) { insp in
                        if insp.isPending {
                            // Recorded at the apiary without a connection: it exists only on
                            // this device until the upload succeeds, so there is nothing to
                            // open or delete on the server yet.
                            InspectionRow(inspection: insp)
                        } else {
                            NavigationLink(destination: InspectionDetailView(inspection: insp, hiveId: hive.id, apiaryId: apiaryId, inspectionVM: inspectionVM)) {
                                InspectionRow(inspection: insp)
                            }
                        }
                    }
                    .onDelete { indices in
                        Task {
                            for i in indices {
                                let inspection = inspectionVM.inspections[i]
                                guard !inspection.isPending else { continue }
                                try? await inspectionVM.delete(inspection.id)
                            }
                        }
                    }
                    if inspectionVM.isLoading {
                        HStack { Spacer(); ProgressView(); Spacer() }
                    }
                }
            }
        }
        .navigationTitle(hive.name)
        .hpScreenBackground()
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                if hive.isOwner {
                    NavigationLink(destination: SharingView(target: .hive(hive.id), isHive: true)) {
                        Image(systemName: "person.2")
                    }
                    .accessibilityLabel(NSLocalizedString("sharing.title", comment: ""))
                    .accessibilityIdentifier("shareHiveButton")
                }
                Button { showEdit = true } label: { Image(systemName: "pencil") }
                    .accessibilityLabel(NSLocalizedString("screen.editHive", comment: ""))
                    .accessibilityIdentifier("editHiveButton")
                Button { showQR = true } label: { Image(systemName: "qrcode") }
                Button { showStats = true } label: { Image(systemName: "chart.xyaxis.line") }
                    .accessibilityIdentifier("hiveStatsButton")
            }
        }
        .hpFloatingButton(NSLocalizedString("action.newInspection", comment: ""), identifier: "newInspectionButton") {
            showAddInspection = true
        }
        .task { await inspectionVM.load(hiveId: hive.id) }
        .refreshable { await inspectionVM.load(hiveId: hive.id) }
        .sheet(isPresented: $showAddInspection) {
            InspectionFormView(hiveId: hive.id, apiaryId: apiaryId, mode: .create) { req in
                _ = try await inspectionVM.create(hiveId: hive.id, request: req)
                showAddInspection = false
            }
        }
        .sheet(isPresented: $showEdit) {
            HiveEditView(hive: hive) { name, hiveType, acquisitionDate, notes in
                hive = try await hiveVM.update(hive.id, name: name, hiveType: hiveType,
                                               notes: notes, acquisitionDate: acquisitionDate)
            }
        }
        .sheet(isPresented: $showMove) {
            MoveHivesView(apiaryId: apiaryId, hives: siblings, selected: [hive.id]) { _ in
                // The hive stands in another apiary now.
                Task { if let moved = try? await HiveService().get(hive.id) { hive = moved } }
            }
        }
        .sheet(isPresented: $showStats) {
            NavigationStack { HiveStatsView(hiveId: hive.id, hiveName: hive.name) }
        }
        .sheet(isPresented: $showQR) {
            NavigationStack { HiveQRView(hive: hive) }
        }
    }
}

private struct HiveInfoRow: View {
    let icon: String
    let label: String
    let value: String
    var body: some View {
        Label {
            HStack {
                Text(label).foregroundColor(.secondary)
                Spacer()
                Text(value).multilineTextAlignment(.trailing)
            }
        } icon: {
            Image(systemName: icon).foregroundColor(.hpAmberDark)
        }
    }
}

private struct InspectionRow: View {
    let inspection: InspectionOut
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                Text(inspection.date).font(.dmSans(16, weight: .bold, relativeTo: .headline))
                if let author = inspection.createdByName {
                    Text(String(format: NSLocalizedString("label.recordedBy", comment: ""), author))
                        .font(.caption).foregroundColor(.secondary)
                }
                if inspection.isPending {
                    Label(NSLocalizedString("offline.pendingUpload", comment: ""), systemImage: "icloud.and.arrow.up")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .accessibilityIdentifier("pendingUploadBadge")
                }
            }
            HStack(spacing: 12) {
                if let mood = inspection.mood {
                    Label(mood.capitalized, systemImage: moodIcon(mood))
                        .font(.caption).foregroundColor(moodColor(mood))
                }
                if let level = inspection.varroaLevel {
                    Label(InspectionScale.varroaLabel(level), systemImage: "ant").font(.caption).foregroundColor(.secondary)
                }
                if inspection.queenSeen == true {
                    Label(NSLocalizedString("label.queenSeen", comment: ""), systemImage: "crown")
                        .font(.caption).foregroundColor(.hpAmberDark)
                }
            }
        }
        .padding(.vertical, 2)
    }

    private func moodIcon(_ mood: String) -> String {
        switch mood {
        case "calm": return "face.smiling"
        case "nervous": return "face.dashed"
        case "aggressive": return "bolt.circle"
        default: return "face.smiling"
        }
    }

    private func moodColor(_ mood: String) -> Color {
        switch mood {
        case "calm": return .hpGreen
        case "nervous": return .hpAmberDark
        case "aggressive": return .hpRed
        default: return .secondary
        }
    }
}
