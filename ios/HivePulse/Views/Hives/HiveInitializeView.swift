import SwiftUI

struct HiveInitializeView: View {
    let qrToken: String
    let apiaries: [ApiaryOut]
    let onDone: (HiveOut) -> Void
    /// Creating an apiary from here: without one the hive cannot be saved, and sending the user away
    /// meant losing the scanned code and starting over.
    var onCreateApiary: ((String, String?, Double?, Double?, String?) async throws -> Void)? = nil

    @Environment(\.dismiss) var dismiss
    @StateObject private var hiveVM = HiveViewModel()
    @State private var name = ""
    @State private var hiveType = "langstroth"
    @State private var selectedApiaryId = ""
    @State private var notes = ""
    @State private var latitude: Double?
    @State private var longitude: Double?
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showCreateApiary = false

    private let hiveTypes = ["langstroth", "dadant", "top_bar", "warre", "other"]

    var body: some View {
        NavigationStack {
            Form {
                Section(NSLocalizedString("section.newHive", comment: "")) {
                    TextField(NSLocalizedString("field.hiveName", comment: ""), text: $name)

                    Picker(NSLocalizedString("field.hiveType", comment: ""), selection: $hiveType) {
                        ForEach(hiveTypes, id: \.self) { t in
                            Text(t.replacingOccurrences(of: "_", with: " ").capitalized).tag(t)
                        }
                    }

                    if apiaries.isEmpty {
                        // Without an apiary the hive cannot be saved — say so instead of leaving a
                        // permanently greyed-out Save button with no explanation.
                        VStack(alignment: .leading, spacing: 4) {
                            Text(NSLocalizedString("empty.apiaries.title", comment: ""))
                                .font(.dmSans(15, weight: .bold, relativeTo: .subheadline))
                                .foregroundColor(.hpStone900)
                            Text(NSLocalizedString("empty.apiaries.description", comment: ""))
                                .font(.dmSans(13, relativeTo: .footnote))
                                .foregroundColor(.hpStone500)
                        }
                        .accessibilityIdentifier("noApiariesHint")
                        if onCreateApiary != nil {
                            Button(NSLocalizedString("action.newApiary", comment: "")) {
                                showCreateApiary = true
                            }
                            .accessibilityIdentifier("createApiaryButton")
                        }
                    } else {
                        Picker(NSLocalizedString("field.apiary", comment: ""), selection: $selectedApiaryId) {
                            ForEach(apiaries) { a in
                                Text(a.name).tag(a.id)
                            }
                        }
                    }
                }

                Section(NSLocalizedString("section.location", comment: "")) {
                    if let lat = latitude, let lon = longitude {
                        Label(String(format: "%.4f, %.4f", lat, lon), systemImage: "location.fill")
                            .foregroundColor(.green)
                    } else {
                        Label(NSLocalizedString("label.locationAutoFilled", comment: ""), systemImage: "location")
                            .foregroundColor(.secondary)
                    }
                }

                Section(NSLocalizedString("section.notes", comment: "")) {
                    TextField(NSLocalizedString("field.notes", comment: ""), text: $notes, axis: .vertical)
                        .lineLimit(4)
                }

                if let err = errorMessage {
                    Section {
                        ErrorBanner(message: err) { errorMessage = nil }
                    }
                    .listRowBackground(Color.clear).listRowInsets(.init())
                }
            }
            .navigationTitle(NSLocalizedString("screen.initializeHive", comment: ""))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(NSLocalizedString("action.cancel", comment: "")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(NSLocalizedString("action.save", comment: "")) {
                        Task { await save() }
                    }
                    .disabled(name.isEmpty || selectedApiaryId.isEmpty || isSaving)
                }
            }
            .onAppear {
                selectedApiaryId = Self.resolvedApiaryId(current: selectedApiaryId, apiaries: apiaries)
                Task { await autoFillLocation() }
            }
            // The apiary list loads asynchronously in MainTabView; onAppear alone left the selection
            // empty forever when the sheet opened first, which silently disabled Save.
            .onChange(of: apiaries.map(\.id)) { _, _ in
                selectedApiaryId = Self.resolvedApiaryId(current: selectedApiaryId, apiaries: apiaries)
            }
            .sheet(isPresented: $showCreateApiary) {
                ApiaryFormView(mode: .create) { name, description, latitude, longitude, address in
                    try await onCreateApiary?(name, description, latitude, longitude, address)
                    showCreateApiary = false
                }
            }
        }
    }

    /// Keeps a valid selection: preselects the first apiary, and re-selects when the list arrives late
    /// or no longer contains the current choice.
    static func resolvedApiaryId(current: String, apiaries: [ApiaryOut]) -> String {
        if apiaries.contains(where: { $0.id == current }) { return current }
        return apiaries.first?.id ?? ""
    }

    private func save() async {
        isSaving = true
        do {
            let hive = try await hiveVM.initialize(
                qrToken: qrToken,
                apiaryId: selectedApiaryId,
                name: name,
                hiveType: hiveType,
                latitude: latitude,
                longitude: longitude,
                acquisitionDate: nil,
                notes: notes.isEmpty ? nil : notes
            )
            onDone(hive)
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }

    private func autoFillLocation() async {
        let locator = OneTimeLocator()
        if let loc = await locator.locate() {
            latitude  = loc.coordinate.latitude
            longitude = loc.coordinate.longitude
        }
    }
}
