import SwiftUI

/// Lists custom fields for the user (Settings) or one apiary (apiary toolbar); tap to edit, swipe to delete.
struct FieldDefinitionsView: View {
    @StateObject private var vm: FieldDefinitionsViewModel
    @State private var showCreate = false
    @State private var editing: FieldDefinitionOut?
    @State private var deleting: FieldDefinitionOut?

    init(apiaryId: String? = nil) {
        _vm = StateObject(wrappedValue: FieldDefinitionsViewModel(apiaryId: apiaryId))
    }

    private var isApiaryScope: Bool { vm.apiaryId != nil }

    var body: some View {
        List {
            Section {
                Text(NSLocalizedString(isApiaryScope ? "fielddefs.apiarySubtitle" : "fielddefs.subtitle", comment: ""))
                    .font(.dmSans(15, relativeTo: .subheadline))
                    .foregroundColor(.hpStone500)
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets(top: 4, leading: 4, bottom: 4, trailing: 4))
            }

            if let error = vm.errorMessage, !showCreate, editing == nil {
                Section {
                    ErrorBanner(message: error) { vm.errorMessage = nil }
                        .listRowBackground(Color.clear)
                        .listRowInsets(EdgeInsets())
                }
            }

            if vm.isLoading && vm.fields.isEmpty {
                Section { ProgressView().frame(maxWidth: .infinity) }
            } else if vm.fields.isEmpty {
                Section {
                    Text(NSLocalizedString("fielddefs.empty", comment: ""))
                        .font(.dmSans(15, relativeTo: .subheadline))
                        .foregroundColor(.hpStone500)
                }
            } else {
                Section {
                    ForEach(vm.fields) { field in
                        Button { editing = field } label: { FieldDefinitionRow(field: field) }
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button(role: .destructive) { deleting = field } label: {
                                    Label(NSLocalizedString("action.delete", comment: ""), systemImage: "trash")
                                }
                            }
                    }
                }
            }
        }
        .hpScreenBackground()
        .navigationTitle(NSLocalizedString(isApiaryScope ? "fielddefs.apiaryTitle" : "fielddefs.title", comment: ""))
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button { showCreate = true } label: { Image(systemName: "plus") }
                    .accessibilityLabel(NSLocalizedString("fielddefs.new", comment: ""))
                    .accessibilityIdentifier("newFieldButton")
            }
        }
        .overlay(alignment: .bottom) {
            if let message = vm.message {
                Text(NSLocalizedString(message == .created ? "fielddefs.createSuccess" : "fielddefs.saveSuccess", comment: ""))
                    .font(.dmSans(15, weight: .medium, relativeTo: .subheadline))
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color.hpStone900.opacity(0.9))
                    .clipShape(Capsule())
                    .padding(.bottom, 24)
                    .transition(.opacity)
            }
        }
        .task { await vm.load() }
        .task(id: vm.message) {
            guard vm.message != nil else { return }
            try? await Task.sleep(for: .seconds(2))
            withAnimation { vm.message = nil }
        }
        .refreshable { await vm.load() }
        .sheet(isPresented: $showCreate) {
            FieldDefinitionFormView(vm: vm, existing: nil) { showCreate = false }
        }
        .sheet(item: $editing) { field in
            FieldDefinitionFormView(vm: vm, existing: field) { editing = nil }
        }
        .alert(
            deleting?.name ?? "",
            isPresented: Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } }),
            presenting: deleting
        ) { field in
            Button(NSLocalizedString("action.delete", comment: ""), role: .destructive) {
                Task { await vm.delete(field) }
            }
            Button(NSLocalizedString("action.cancel", comment: ""), role: .cancel) {}
        } message: { _ in
            Text(NSLocalizedString("fielddefs.deleteConfirm", comment: ""))
        }
    }
}

private struct FieldDefinitionRow: View {
    let field: FieldDefinitionOut

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(field.name)
                .font(.dmSans(17, weight: .bold, relativeTo: .headline))
                .foregroundColor(.hpStone900)
            Text(summary)
                .font(.dmSans(13, relativeTo: .footnote))
                .foregroundColor(.hpStone500)
            if field.type == "select" && !field.options.isEmpty {
                Text(field.options.joined(separator: ", "))
                    .font(.dmSans(13, relativeTo: .footnote))
                    .foregroundColor(.hpStone500)
                    .lineLimit(1)
            }
        }
        .padding(.vertical, 2)
    }

    private var summary: String {
        var parts = [FieldDefinitionFormView.targetLabel(field.target), FieldDefinitionFormView.typeLabel(field.type)]
        if field.required { parts.append(NSLocalizedString("fielddefs.required", comment: "")) }
        return parts.joined(separator: " · ")
    }
}

struct FieldDefinitionFormView: View {
    @ObservedObject var vm: FieldDefinitionsViewModel
    let existing: FieldDefinitionOut?
    let onDone: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name: String
    @State private var target: String
    @State private var type: String
    @State private var optionsText: String
    @State private var required: Bool

    init(vm: FieldDefinitionsViewModel, existing: FieldDefinitionOut?, onDone: @escaping () -> Void) {
        self.vm = vm
        self.existing = existing
        self.onDone = onDone
        _name        = State(initialValue: existing?.name ?? "")
        _target      = State(initialValue: existing?.target ?? "inspection")
        _type        = State(initialValue: existing?.type ?? "text")
        _optionsText = State(initialValue: existing?.options.joined(separator: "\n") ?? "")
        _required    = State(initialValue: existing?.required ?? false)
    }

    private var isCreate: Bool { existing == nil }

    static func targetLabel(_ key: String) -> String { NSLocalizedString("fielddefs.target.\(key)", comment: "") }
    static func typeLabel(_ key: String) -> String { NSLocalizedString("fielddefs.type.\(key)", comment: "") }

    var body: some View {
        NavigationStack {
            Form {
                if let error = vm.errorMessage {
                    Section {
                        ErrorBanner(message: error) { vm.errorMessage = nil }
                            .listRowBackground(Color.clear)
                            .listRowInsets(EdgeInsets())
                    }
                }
                Section {
                    TextField(NSLocalizedString("fielddefs.name", comment: ""), text: $name)
                        .onChange(of: name) { _, value in
                            if value.count > 200 { name = String(value.prefix(200)) }
                        }
                        .accessibilityIdentifier("fieldNameField")
                    if isCreate {
                        Picker(NSLocalizedString("fielddefs.target", comment: ""), selection: $target) {
                            ForEach(FieldDefinitionsViewModel.targets, id: \.self) { Text(Self.targetLabel($0)).tag($0) }
                        }
                        Picker(NSLocalizedString("fielddefs.type", comment: ""), selection: $type) {
                            ForEach(FieldDefinitionsViewModel.types, id: \.self) { Text(Self.typeLabel($0)).tag($0) }
                        }
                    }
                    if type == "select" {
                        TextField(NSLocalizedString("fielddefs.options", comment: ""), text: $optionsText, axis: .vertical)
                            .lineLimit(3...8)
                            .accessibilityIdentifier("fieldOptionsField")
                    }
                    Toggle(NSLocalizedString("fielddefs.required", comment: ""), isOn: $required)
                        .tint(.hpAmber)
                }
            }
            .hpScreenBackground()
            .navigationTitle(NSLocalizedString(isCreate ? "fielddefs.createTitle" : "fielddefs.editTitle", comment: ""))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(NSLocalizedString("action.cancel", comment: "")) {
                        vm.errorMessage = nil
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(NSLocalizedString(isCreate ? "fielddefs.createBtn" : "fielddefs.saveBtn", comment: "")) {
                        Task { await submit() }
                    }
                    .disabled(vm.isSaving || !FieldDefinitionsViewModel.canSubmit(name: name, type: type, optionsText: optionsText))
                }
            }
        }
    }

    private func submit() async {
        let ok: Bool
        if let field = existing {
            ok = await vm.update(field, name: name, optionsText: optionsText, required: required)
        } else {
            ok = await vm.create(name: name, target: target, type: type, optionsText: optionsText, required: required)
        }
        if ok { onDone() }
    }
}
