import SwiftUI

/// Edits a hive's name, type, acquisition date and notes (PUT /hives/{id}), or collects them for a new one
/// (POST /apiaries/{id}/hives) when no hive is given.
struct HiveEditView: View {
    let hive: HiveOut?
    let title: String
    let onSave: (_ name: String, _ hiveType: String, _ acquisitionDate: String?, _ notes: String?) async throws -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name: String
    @State private var hiveType: String
    @State private var hasAcquisitionDate: Bool
    @State private var acquisitionDate: Date
    @State private var notes: String
    @State private var isSaving = false
    @State private var errorMessage: String?

    static let hiveTypes = ["langstroth", "dadant", "top_bar", "warre", "other"]

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    init(hive: HiveOut? = nil,
         title: String? = nil,
         onSave: @escaping (_ name: String, _ hiveType: String, _ acquisitionDate: String?, _ notes: String?) async throws -> Void) {
        self.hive = hive
        self.title = title ?? NSLocalizedString(hive == nil ? "section.newHive" : "screen.editHive", comment: "")
        self.onSave = onSave
        _name = State(initialValue: hive?.name ?? "")
        _hiveType = State(initialValue: hive.map { Self.hiveTypes.contains($0.hiveType) ? $0.hiveType : "other" } ?? "langstroth")
        let parsed = hive?.acquisitionDate.flatMap { Self.dateFormatter.date(from: $0) }
        _hasAcquisitionDate = State(initialValue: parsed != nil)
        _acquisitionDate = State(initialValue: parsed ?? Date())
        _notes = State(initialValue: hive?.notes ?? "")
    }

    /// Trimmed values in the shape the API expects; nil when the name is blank.
    static func request(name: String, hasAcquisitionDate: Bool, acquisitionDate: Date, notes: String)
        -> (name: String, acquisitionDate: String?, notes: String?)? {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        let trimmedNotes = notes.trimmingCharacters(in: .whitespacesAndNewlines)
        return (trimmed,
                hasAcquisitionDate ? dateFormatter.string(from: acquisitionDate) : nil,
                trimmedNotes.isEmpty ? nil : trimmedNotes)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField(NSLocalizedString("field.hiveName", comment: ""), text: $name)
                        .accessibilityIdentifier("hiveEditName")
                    Picker(NSLocalizedString("field.hiveType", comment: ""), selection: $hiveType) {
                        ForEach(Self.hiveTypes, id: \.self) { t in
                            Text(NSLocalizedString("hiveType.\(t)", comment: "")).tag(t)
                        }
                    }
                    Toggle(NSLocalizedString("field.acquisitionDate", comment: ""), isOn: $hasAcquisitionDate)
                    if hasAcquisitionDate {
                        DatePicker(NSLocalizedString("field.acquisitionDate", comment: ""),
                                   selection: $acquisitionDate, displayedComponents: .date)
                            .labelsHidden()
                    }
                }
                Section(NSLocalizedString("field.notes", comment: "")) {
                    TextField(NSLocalizedString("field.notes", comment: ""), text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
                if let errorMessage {
                    Section { Text(errorMessage).foregroundColor(.hpRed) }
                }
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(NSLocalizedString("action.cancel", comment: "")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(NSLocalizedString("action.save", comment: "")) {
                        Task { await save() }
                    }
                    .disabled(isSaving || name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .accessibilityIdentifier("hiveEditSave")
                }
            }
        }
    }

    private func save() async {
        guard let values = Self.request(name: name, hasAcquisitionDate: hasAcquisitionDate,
                                        acquisitionDate: acquisitionDate, notes: notes) else { return }
        isSaving = true
        defer { isSaving = false }
        do {
            try await onSave(values.name, hiveType, values.acquisitionDate, values.notes)
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
