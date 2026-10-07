import SwiftUI

/// What a beekeeper wants to know on opening the app, as sections at the top of the apiary list:
/// what is due, how the hives are, what is coming up, and an announcement the server can switch on.
struct HomeSummarySections: View {
    @ObservedObject var vm: HomeSummaryViewModel

    var body: some View {
        if vm.isVisible, let home = vm.home {
            if !home.inSeason {
                Section {
                    Text(NSLocalizedString("home.outOfSeason", comment: ""))
                        .font(.caption).foregroundColor(.secondary)
                }
            }
            inspections(home.inspections)
            health(home.health)
            treatments(home.treatments)
            if let ad = home.ad {
                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(ad.label)
                            .font(.caption2).padding(.horizontal, 6).padding(.vertical, 2)
                            .background(Color.secondary.opacity(0.15)).cornerRadius(4)
                        Text(ad.title).font(.headline)
                        Text(ad.body).font(.subheadline).foregroundColor(.secondary)
                        if let url = ad.url, let link = URL(string: url) {
                            Link(url.replacingOccurrences(of: "https://", with: "").replacingOccurrences(of: "http://", with: ""),
                                 destination: link)
                                .font(.subheadline)
                        }
                    }
                    .accessibilityIdentifier("homeAd")
                }
            }
        }
    }

    // MARK: Next inspection

    @ViewBuilder
    private func inspections(_ inspections: HomeInspections) -> some View {
        Section(NSLocalizedString("home.nextInspection", comment: "")) {
            if inspections.overdueCount > 0 {
                Text(String(format: NSLocalizedString("home.overdue", comment: ""), inspections.overdueCount))
                    .font(.dmSans(20, weight: .bold, relativeTo: .title3)).foregroundColor(.hpRed)
            } else if let first = inspections.next.first {
                Text(String(format: NSLocalizedString("home.dueOn", comment: ""), DayFormat.string(from: first.dueOn)))
                    .font(.dmSans(20, weight: .bold, relativeTo: .title3))
                if inspections.dueSoonCount > 0 {
                    Text(String(format: NSLocalizedString("home.dueSoon", comment: ""), inspections.dueSoonCount))
                        .font(.caption).foregroundColor(.secondary)
                }
            }
            ForEach(inspections.next, id: \.hiveId) { item in
                NavigationLink(destination: HiveByIdView(hiveId: item.hiveId)) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.hiveName).font(.dmSans(16, weight: .bold, relativeTo: .headline))
                        Text(item.apiaryName).font(.caption).foregroundColor(.secondary)
                        HStack(spacing: 6) {
                            Text(item.overdueDays > 0
                                 ? String(format: NSLocalizedString("home.dueSince", comment: ""), DayFormat.string(from: item.dueOn))
                                 : DayFormat.string(from: item.dueOn))
                                .foregroundColor(item.overdueDays > 0 ? .hpRed : .secondary)
                            if item.lastInspectionOn == nil {
                                Text("· " + NSLocalizedString("home.neverInspected", comment: "")).foregroundColor(.secondary)
                            }
                        }
                        .font(.caption)
                    }
                }
            }
        }
        .accessibilityIdentifier("homeInspections")
    }

    // MARK: Health

    @ViewBuilder
    private func health(_ health: HomeHealth) -> some View {
        Section(NSLocalizedString("home.health", comment: "")) {
            HStack(spacing: 12) {
                Text(String(format: NSLocalizedString("home.healthOk", comment: ""), health.ok)).foregroundColor(.hpGreen)
                Text(String(format: NSLocalizedString("home.healthWatch", comment: ""), health.watch)).foregroundColor(.hpAmberDark)
                Text(String(format: NSLocalizedString("home.healthAlert", comment: ""), health.alert)).foregroundColor(.hpRed)
                Text(String(format: NSLocalizedString("home.healthUnknown", comment: ""), health.unknown)).foregroundColor(.secondary)
            }
            .font(.caption.weight(.semibold))
            if health.attention.isEmpty {
                Text(NSLocalizedString("home.noConcerns", comment: "")).font(.subheadline).foregroundColor(.secondary)
            }
            ForEach(health.attention, id: \.hiveId) { item in
                NavigationLink(destination: HiveByIdView(hiveId: item.hiveId)) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.hiveName).font(.dmSans(16, weight: .bold, relativeTo: .headline))
                        Text(item.apiaryName).font(.caption).foregroundColor(.secondary)
                        Text(item.reasons.map(HomeSummaryViewModel.reasonText).joined(separator: ", "))
                            .font(.caption).foregroundColor(item.status == "alert" ? .hpRed : .hpAmberDark)
                    }
                }
            }
        }
        .accessibilityIdentifier("homeHealth")
    }

    // MARK: Treatments

    @ViewBuilder
    private func treatments(_ treatments: HomeTreatments) -> some View {
        Section(NSLocalizedString("home.treatments", comment: "")) {
            if treatments.overdueCount > 0 {
                Text(String(format: NSLocalizedString("home.treatmentsOverdue", comment: ""), treatments.overdueCount))
                    .font(.dmSans(18, weight: .bold, relativeTo: .headline)).foregroundColor(.hpRed)
            }
            if treatments.upcoming.isEmpty {
                Text(NSLocalizedString("home.noTreatments", comment: "")).font(.subheadline).foregroundColor(.secondary)
            }
            ForEach(treatments.upcoming) { item in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.product).font(.dmSans(16, weight: .bold, relativeTo: .headline))
                        Text(item.target.name).font(.caption).foregroundColor(.secondary)
                        Text(item.overdue
                             ? String(format: NSLocalizedString("home.dueSince", comment: ""), DayFormat.string(from: item.dueOn))
                             : DayFormat.string(from: item.dueOn))
                            .font(.caption).foregroundColor(item.overdue ? .hpRed : .secondary)
                    }
                    Spacer()
                    Button(NSLocalizedString("home.markDone", comment: "")) {
                        Task { await vm.markDone(item) }
                    }
                    .buttonStyle(.bordered)
                    .accessibilityIdentifier("homeMarkDone")
                }
            }
        }
        .accessibilityIdentifier("homeTreatments")
    }
}

/// Opens a hive from its id: the summary knows which hive it means, the hive screen needs the hive itself.
struct HiveByIdView: View {
    let hiveId: String
    @State private var hive: HiveOut?
    @State private var failed = false

    var body: some View {
        Group {
            if let hive {
                HiveDetailView(hive: hive, apiaryId: hive.apiaryId)
            } else if failed {
                Text(NSLocalizedString("alert.error", comment: "")).foregroundColor(.secondary)
            } else {
                ProgressView()
            }
        }
        .task {
            do { hive = try await HiveService().get(hiveId) } catch { failed = true }
        }
    }
}

/// The treatments planned for one hive or for every hive of an apiary: what is coming, what is done, and the
/// form to plan another.
struct TreatmentsView: View {
    @StateObject private var vm: TreatmentsViewModel
    private let isHive: Bool
    @State private var treatmentToDelete: PlannedTreatmentOut?

    init(target: TreatmentTargetKind) {
        _vm = StateObject(wrappedValue: TreatmentsViewModel(target: target))
        if case .hive = target { isHive = true } else { isHive = false }
    }

    var body: some View {
        List {
            Section {
                TextField(NSLocalizedString("treatments.product", comment: ""), text: $vm.product)
                    .accessibilityIdentifier("treatmentProduct")
                DatePicker(NSLocalizedString("treatments.dueOn", comment: ""), selection: $vm.dueOn, displayedComponents: .date)
                TextField(NSLocalizedString("treatments.note", comment: ""), text: $vm.note)
                Button {
                    Task { _ = await vm.plan() }
                } label: {
                    HStack {
                        if vm.isSaving { ProgressView() }
                        Text(NSLocalizedString("treatments.plan", comment: ""))
                    }
                }
                .disabled(!vm.canPlan)
                .accessibilityIdentifier("treatmentPlan")
            } footer: {
                Text(NSLocalizedString(isHive ? "treatments.introHive" : "treatments.introApiary", comment: ""))
            }

            Section {
                if vm.open.isEmpty && !vm.isLoading {
                    Text(NSLocalizedString("treatments.empty", comment: "")).foregroundColor(.secondary)
                }
                ForEach(vm.open) { item in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(item.product).font(.dmSans(16, weight: .bold, relativeTo: .headline))
                        Text(item.overdue
                             ? String(format: NSLocalizedString("treatments.overdue", comment: ""), DayFormat.string(from: item.dueOn))
                             : String(format: NSLocalizedString("treatments.dueOnDate", comment: ""), DayFormat.string(from: item.dueOn)))
                            .font(.caption).foregroundColor(item.overdue ? .hpRed : .secondary)
                        if let note = item.note, !note.isEmpty {
                            Text(note).font(.caption).foregroundColor(.secondary)
                        }
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        Button(role: .destructive) { treatmentToDelete = item } label: {
                            Label(NSLocalizedString("action.delete", comment: ""), systemImage: "trash")
                        }
                    }
                    .swipeActions(edge: .leading) {
                        Button { Task { await vm.markDone(item) } } label: {
                            Label(NSLocalizedString("home.markDone", comment: ""), systemImage: "checkmark")
                        }
                        .tint(.hpGreen)
                    }
                }
            }

            if !vm.done.isEmpty {
                Section(NSLocalizedString("treatments.doneTitle", comment: "")) {
                    ForEach(vm.done) { item in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.product)
                                Text(String(format: NSLocalizedString("treatments.doneOn", comment: ""), DayFormat.string(from: item.doneOn)))
                                    .font(.caption).foregroundColor(.secondary)
                            }
                            Spacer()
                            Button(NSLocalizedString("treatments.reopen", comment: "")) {
                                Task { await vm.reopen(item) }
                            }
                            .buttonStyle(.bordered)
                        }
                    }
                }
            }
        }
        .navigationTitle(NSLocalizedString("treatments.title", comment: ""))
        .hpScreenBackground()
        .task { await vm.load() }
        .refreshable { await vm.load() }
        .confirmationDialog(
            NSLocalizedString("treatments.confirmDelete", comment: ""),
            isPresented: Binding(get: { treatmentToDelete != nil }, set: { if !$0 { treatmentToDelete = nil } }),
            titleVisibility: .visible
        ) {
            Button(NSLocalizedString("action.delete", comment: ""), role: .destructive) {
                if let item = treatmentToDelete { Task { await vm.delete(item) } }
                treatmentToDelete = nil
            }
            Button(NSLocalizedString("action.cancel", comment: ""), role: .cancel) { treatmentToDelete = nil }
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
