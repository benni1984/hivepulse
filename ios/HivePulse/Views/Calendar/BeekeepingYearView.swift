import SwiftUI

/// The beekeeper's year as an endless timeline: what to do when, month by month, moved to the beekeeper's place.
/// It opens at today and loads the next and the previous stretch of the year as it is scrolled.
struct BeekeepingYearView: View {
    @StateObject private var vm = BeekeepingYearViewModel()
    @StateObject private var regionVM = RegionViewModel()
    /// Set once the list has been scrolled to today: before that the top of the list is on screen and would ask for
    /// earlier months at once.
    @State private var positioned = false
    @State private var showRegion = false

    var body: some View {
        ScrollViewReader { proxy in
            List {
                Section {
                    Text(NSLocalizedString("calendar.intro", comment: ""))
                        .font(.footnote).foregroundColor(.secondary)
                    if let region = vm.region { regionRow(region) }
                }

                if vm.failed && !vm.isLoaded {
                    Section { Text(NSLocalizedString("calendar.loadError", comment: "")).foregroundColor(.hpRed) }
                }

                if vm.isLoaded {
                    Color.clear.frame(height: 1)
                        .listRowBackground(Color.clear).listRowSeparator(.hidden)
                        .onAppear { if positioned { loadEarlier(proxy) } }

                    ForEach(vm.items) { item in
                        row(item)
                            .id(item.id)
                            .listRowBackground(Color.clear).listRowSeparator(.hidden)
                            .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                    }

                    Color.clear.frame(height: 1)
                        .listRowBackground(Color.clear).listRowSeparator(.hidden)
                        .onAppear { if positioned { Task { await vm.loadLater() } } }

                    Text(NSLocalizedString("calendar.disclaimer", comment: ""))
                        .font(.footnote).foregroundColor(.secondary)
                        .listRowBackground(Color.clear)
                }
            }
            .listStyle(.plain)
            .accessibilityIdentifier("beekeepingYearList")
            .task {
                await vm.load()
                guard vm.isLoaded, !positioned else { return }
                // The list has to have laid the rows out before it can be scrolled to one.
                try? await Task.sleep(nanoseconds: 300_000_000)
                proxy.scrollTo("today", anchor: .center)
                positioned = true
            }
        }
        .navigationTitle(NSLocalizedString("calendar.title", comment: ""))
        .navigationBarTitleDisplayMode(.inline)
        .hpScreenBackground()
        .sheet(isPresented: $showRegion, onDismiss: { Task { await vm.load() } }) {
            NavigationStack {
                Form { RegionSettingsSections(vm: regionVM) }
                    .navigationTitle(NSLocalizedString("region.title", comment: ""))
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .confirmationAction) {
                            Button(NSLocalizedString("action.done", comment: "")) { showRegion = false }
                        }
                    }
            }
        }
    }

    // MARK: - Pieces

    private func loadEarlier(_ proxy: ScrollViewProxy) {
        let anchor = vm.items.first?.id
        Task {
            await vm.loadEarlier()
            // Rows put in front would push what was on screen away.
            if let anchor { proxy.scrollTo(anchor, anchor: .top) }
        }
    }

    private func regionRow(_ region: RegionOut) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(BeekeepingYear.regionLine(region)).font(.subheadline)
            if !region.located {
                Text(NSLocalizedString("calendar.notLocated", comment: ""))
                    .font(.footnote.weight(.semibold)).foregroundColor(.hpRed)
            }
            Button(NSLocalizedString(region.source == "default" ? "calendar.setRegion" : "calendar.changeRegion", comment: "")) {
                showRegion = true
            }
            .font(.subheadline.weight(.semibold))
            .accessibilityIdentifier("changeRegionButton")
        }
        .accessibilityIdentifier("calendarRegion")
    }

    @ViewBuilder
    private func row(_ item: TimelineItem) -> some View {
        switch item.kind {
        case .month(let month):
            Text(BeekeepingYear.monthName(month))
                .font(.dmSans(22, weight: .bold, relativeTo: .title2))
                .foregroundColor(.hpStone900)
                .padding(.top, 14)
        case .today:
            HStack(spacing: 10) {
                Rectangle().fill(Color.hpAmber).frame(height: 2)
                Text(String(format: NSLocalizedString("calendar.today", comment: ""), BeekeepingYear.shortDay(vm.today)))
                    .font(.footnote.weight(.bold)).foregroundColor(.hpAmberDark).fixedSize()
                Rectangle().fill(Color.hpAmber).frame(height: 2)
            }
            .accessibilityIdentifier("calendarToday")
        case .entry(let entry):
            EntryCard(entry: entry)
        }
    }
}

/// One entry of the timeline: the kind of task, what it is, when, and what it says.
private struct EntryCard: View {
    let entry: CalendarEntryOut

    private var tint: Color {
        switch entry.category {
        case "inspection", "bloom": return .hpGreen
        case "swarm", "varroa": return .hpRed
        case "feeding", "harvest": return .hpAmberDark
        default: return .hpStone500
        }
    }

    private func chip(_ text: String, color: Color, filled: Bool = false) -> some View {
        Text(text)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 10).padding(.vertical, 3)
            .background(filled ? color : color.opacity(0.15))
            .foregroundColor(filled ? .white : color)
            .clipShape(Capsule())
    }

    var body: some View {
        HStack(spacing: 0) {
            Rectangle().fill(tint).frame(width: 5)
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    chip(NSLocalizedString("calendar.category." + entry.category, comment: ""), color: tint)
                    if entry.active { chip(NSLocalizedString("calendar.now", comment: ""), color: .hpAmber, filled: true) }
                    if let honey = entry.honey { chip(Forage.label(for: honey), color: .hpAmberDark) }
                    Spacer(minLength: 0)
                    Text(BeekeepingYear.shortDay(entry.start) + " – " + BeekeepingYear.shortDay(entry.end))
                        .font(.caption).foregroundColor(.secondary)
                }
                if let interval = entry.intervalDays {
                    chip(String(format: NSLocalizedString("calendar.interval", comment: ""), interval), color: .hpRed)
                }
                Text(entry.title).font(.dmSans(17, weight: .bold, relativeTo: .headline))
                Text(entry.body).font(.subheadline).foregroundColor(.secondary)
            }
            .padding(14)
            Spacer(minLength: 0)
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous)
            .stroke(entry.active ? Color.hpAmber : Color.hpStone200, lineWidth: entry.active ? 2 : 1))
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("calendarEntry")
    }
}

/// Country, postal code and the hand adjustment: where the year is moved to. Sections for a Form, used by the
/// settings and by the sheet on the timeline.
struct RegionSettingsSections: View {
    @ObservedObject var vm: RegionViewModel

    private var countries: [(code: String, name: String)] {
        let language = BeekeepingYear.appLanguage
        return BeekeepingYear.countryCodes
            .map { (code: $0, name: BeekeepingYear.countryName($0, language: language)) }
            .sorted { $0.name.localizedCompare($1.name) == .orderedAscending }
    }

    var body: some View {
        Group {
            if vm.isLoaded {
                Section {
                    Picker(NSLocalizedString("region.country", comment: ""), selection: $vm.country) {
                        Text(NSLocalizedString("region.countryNone", comment: "")).tag("")
                        ForEach(countries, id: \.code) { country in Text(country.name).tag(country.code) }
                    }
                    .accessibilityIdentifier("regionCountryPicker")
                    TextField(NSLocalizedString("region.postal", comment: ""), text: $vm.postalCode)
                        .textContentType(.postalCode)
                        .textInputAutocapitalization(.characters)
                        .accessibilityIdentifier("regionPostalField")
                    Stepper(value: $vm.adjustDays, in: -28...28) {
                        Text(NSLocalizedString("region.adjust", comment: "") + ": \(vm.adjustDays)")
                    }
                    .accessibilityIdentifier("regionAdjustStepper")
                } header: {
                    Text(NSLocalizedString("region.title", comment: ""))
                } footer: {
                    Text(NSLocalizedString("region.intro", comment: "") + "\n" + NSLocalizedString("region.adjustHint", comment: ""))
                }

                Section {
                    Button {
                        Task { await vm.save() }
                    } label: {
                        HStack {
                            if vm.isSaving { ProgressView() }
                            Text(NSLocalizedString("region.save", comment: ""))
                        }
                    }
                    .disabled(vm.isSaving)
                    .accessibilityIdentifier("saveRegionButton")
                    if let message = vm.message {
                        switch message {
                        case .saved:
                            Text(NSLocalizedString("region.saved", comment: "")).foregroundColor(.green).font(.caption)
                        case .notLocated:
                            Text(NSLocalizedString("region.notLocated", comment: "")).foregroundColor(.hpRed).font(.caption)
                        case .failed:
                            Text(NSLocalizedString("region.error", comment: "")).foregroundColor(.hpRed).font(.caption)
                        }
                    }
                }
            }
        }
        .task { await vm.load() }
    }
}
