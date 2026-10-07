import SwiftUI

/// Takes hives from this apiary to another place. Reached from the owner's toolbar only.
struct MoveHivesView: View {
    @StateObject private var vm: MoveHivesViewModel
    @Environment(\.dismiss) private var dismiss
    /// Called once the server took the move, so the apiary can reload its hives.
    let onMoved: (MoveResult) -> Void

    init(apiaryId: String, hives: [HiveOut], onMoved: @escaping (MoveResult) -> Void) {
        _vm = StateObject(wrappedValue: MoveHivesViewModel(apiaryId: apiaryId, hives: hives))
        self.onMoved = onMoved
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Button(NSLocalizedString("moves.selectAll", comment: "")) { vm.toggleAll() }
                        .accessibilityIdentifier("moveSelectAll")
                    ForEach(vm.hives) { hive in
                        Button { vm.toggle(hive.id) } label: {
                            HStack {
                                Image(systemName: vm.selected.contains(hive.id) ? "checkmark.circle.fill" : "circle")
                                    .foregroundColor(vm.selected.contains(hive.id) ? .hpAmberDark : .secondary)
                                Text(hive.name).foregroundColor(.primary)
                            }
                        }
                    }
                } header: {
                    Text(NSLocalizedString("moves.selectHives", comment: ""))
                }

                Section {
                    Picker(NSLocalizedString("moves.target", comment: ""), selection: $vm.target) {
                        Text(NSLocalizedString("moves.targetChoose", comment: "")).tag("")
                        ForEach(vm.targets) { apiary in Text(apiary.name).tag(apiary.id) }
                        Text(NSLocalizedString("moves.targetNew", comment: "")).tag(MoveHivesViewModel.newPlace)
                    }
                    .accessibilityIdentifier("moveTargetPicker")
                    if vm.target == MoveHivesViewModel.newPlace {
                        TextField(NSLocalizedString("moves.newName", comment: ""), text: $vm.newName)
                            .accessibilityIdentifier("moveNewName")
                        TextField(NSLocalizedString("moves.newAddress", comment: ""), text: $vm.newAddress)
                    }
                } footer: {
                    if vm.target == MoveHivesViewModel.newPlace {
                        Text(NSLocalizedString("moves.newAddressHint", comment: ""))
                    }
                }

                Section {
                    DatePicker(NSLocalizedString("moves.date", comment: ""), selection: $vm.movedOn,
                               in: ...Date(), displayedComponents: .date)
                    Picker(NSLocalizedString("moves.forage", comment: ""), selection: $vm.forage) {
                        Text(NSLocalizedString("moves.forageNone", comment: "")).tag("")
                        ForEach(Forage.keys.filter { $0 != "other" }, id: \.self) { key in
                            Text(Forage.label(for: key)).tag(key)
                        }
                        Text(Forage.label(for: "other")).tag(MoveHivesViewModel.otherForage)
                    }
                    if vm.forage == MoveHivesViewModel.otherForage {
                        TextField(NSLocalizedString("moves.forageOther", comment: ""), text: $vm.otherForage)
                    }
                    TextField(NSLocalizedString("moves.note", comment: ""), text: $vm.note, axis: .vertical)
                }

                if let message = vm.errorMessage {
                    Section { Text(message).foregroundColor(.hpRed) }
                }
            }
            .navigationTitle(NSLocalizedString("moves.title", comment: ""))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(NSLocalizedString("action.cancel", comment: "")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(String(format: NSLocalizedString("moves.submit", comment: ""), vm.selected.count)) {
                        Task {
                            if let result = await vm.submit() {
                                onMoved(result)
                                dismiss()
                            }
                        }
                    }
                    .disabled(!vm.canSubmit)
                    .accessibilityIdentifier("moveSubmit")
                }
            }
            .task { await vm.loadTargets() }
        }
    }
}

/// Where one hive has stood: its journey on a map where the places have positions, and the list of its moves.
struct HiveMovesView: View {
    @StateObject private var vm: HiveMovesViewModel

    init(hiveId: String) {
        _vm = StateObject(wrappedValue: HiveMovesViewModel(hiveId: hiveId))
    }

    var body: some View {
        List {
            if vm.loaded && vm.moves.isEmpty {
                Text(NSLocalizedString("moves.historyEmpty", comment: "")).foregroundColor(.secondary)
            }
            if MoveRoutes.hasPositions(vm.routes) {
                Section {
                    MovesMapView(routes: vm.routes)
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                }
            }
            if !vm.moves.isEmpty {
                Section {
                    ForEach(vm.moves) { move in MoveRow(move: move) }
                }
            }
        }
        .navigationTitle(NSLocalizedString("moves.historyTitle", comment: ""))
        .hpScreenBackground()
        .task { await vm.load() }
        .refreshable { await vm.load() }
    }
}

/// The map of all journeys: every move of every hive the signed-in beekeeper owns, optionally within a date range.
struct MovesOverviewView: View {
    @StateObject private var vm = MovesOverviewViewModel()
    @State private var useFrom = false
    @State private var useTo = false
    @State private var fromDate = Date()
    @State private var toDate = Date()

    var body: some View {
        List {
            Section {
                Toggle(NSLocalizedString("moves.from", comment: ""), isOn: $useFrom)
                if useFrom {
                    DatePicker("", selection: $fromDate, displayedComponents: .date).labelsHidden()
                }
                Toggle(NSLocalizedString("moves.to", comment: ""), isOn: $useTo)
                if useTo {
                    DatePicker("", selection: $toDate, displayedComponents: .date).labelsHidden()
                }
            } header: {
                Text(NSLocalizedString("moves.range", comment: ""))
            } footer: {
                Text(NSLocalizedString("moves.overviewIntro", comment: ""))
            }

            if vm.moves.isEmpty && !vm.isLoading && vm.errorMessage == nil {
                Text(NSLocalizedString("moves.overviewEmpty", comment: "")).foregroundColor(.secondary)
            }
            if let message = vm.errorMessage {
                Text(message).foregroundColor(.hpRed)
            }
            if !vm.moves.isEmpty {
                if MoveRoutes.hasPositions(vm.routes) {
                    Section {
                        MovesMapView(routes: vm.routes)
                            .listRowInsets(EdgeInsets())
                            .listRowBackground(Color.clear)
                    }
                } else {
                    Text(NSLocalizedString("moves.noPositionAtAll", comment: "")).foregroundColor(.secondary)
                }
                Section {
                    ForEach(vm.moves) { move in MoveRow(move: move, showHive: true) }
                }
            }
        }
        .navigationTitle(NSLocalizedString("moves.overviewTitle", comment: ""))
        .hpScreenBackground()
        .task { await vm.load() }
        .refreshable { await vm.load() }
        .onChange(of: useFrom) { _, _ in applyRange() }
        .onChange(of: useTo) { _, _ in applyRange() }
        .onChange(of: fromDate) { _, _ in applyRange() }
        .onChange(of: toDate) { _, _ in applyRange() }
    }

    private func applyRange() {
        vm.from = useFrom ? fromDate : nil
        vm.to = useTo ? toDate : nil
        Task { await vm.load() }
    }
}
