import SwiftUI

/// The beekeeper's year as an endless timeline: what to do when, month by month, moved to the beekeeper's place.
/// It opens at today and loads the next and the previous stretch of the year as it is scrolled.
/// Which of the two views of the year is on screen.
///
/// `list` answers "what do I do now", month by month, with the whole text of every entry.
/// `ribbon` answers what the list cannot: how the year hangs together, as one picture.
enum YearView: String, CaseIterable {
    case list, ribbon
}

struct BeekeepingYearView: View {
    @StateObject private var vm = BeekeepingYearViewModel()
    @StateObject private var regionVM = RegionViewModel()
    @StateObject private var ribbonVM = YearRibbonViewModel()
    @State private var view: YearView = .list
    @State private var picked: YearRibbon.Bar?
    /// Set once the list has been scrolled to today: before that the top of the list is on screen and would ask for
    /// earlier months at once.
    @State private var positioned = false
    @State private var showRegion = false

    var body: some View {
        Group {
            if view == .ribbon { ribbonPane } else { timeline }
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

    /// The two views of the year, as a segmented picker with the hint of the chosen one under it.
    ///
    /// Both are the same year; neither is a filter of the other. The hint says which question each
    /// one answers, because "List" and "Overview" on their own do not.
    private var viewSwitch: some View {
        VStack(alignment: .leading, spacing: 4) {
            Picker("", selection: $view) {
                Text(NSLocalizedString("calendar.viewList", comment: "")).tag(YearView.list)
                    .accessibilityIdentifier("yearViewList")
                Text(NSLocalizedString("calendar.viewRibbon", comment: "")).tag(YearView.ribbon)
                    .accessibilityIdentifier("yearViewRibbon")
            }
            .pickerStyle(.segmented)
            .accessibilityIdentifier("yearViewSwitch")
            Text(NSLocalizedString(view == .list ? "calendar.viewListHint" : "calendar.viewRibbonHint", comment: ""))
                .font(.caption).foregroundColor(.hpStone500)
        }
    }

    /// The ribbon, with the switch above it and the tapped entry under it.
    private var ribbonPane: some View {
        ScrollViewReader { proxy in
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                viewSwitch
                if !ribbonVM.state.isLoaded && !ribbonVM.state.failed {
                    ProgressView().frame(maxWidth: .infinity).padding(.vertical, 40)
                } else if ribbonVM.state.failed && !ribbonVM.state.isLoaded {
                    Text(NSLocalizedString("calendar.loadError", comment: "")).foregroundColor(.hpRed)
                } else if ribbonVM.state.rows.isEmpty {
                    Text(NSLocalizedString("calendar.ribbonEmpty", comment: "")).foregroundColor(.hpStone500)
                } else {
                    YearRibbonView(state: ribbonVM.state, picked: $picked)
                    if let picked { RibbonDetail(bar: picked).id("ribbonDetail") }
                    Text(NSLocalizedString("calendar.disclaimer", comment: ""))
                        .font(.footnote).foregroundColor(.secondary).padding(.top, 6)
                }
            }
            .padding(16)
        }
        .task { await ribbonVM.load() }
        .onChange(of: picked) { _, bar in
            guard bar != nil else { return }
            withAnimation { proxy.scrollTo("ribbonDetail", anchor: .bottom) }
        }
        }
    }

    private var timeline: some View {
        VStack(spacing: 0) {
            // Above the list, not the first row of it: the list opens scrolled to today, a List
            // is lazy, and as a row the switch was simply gone -- a beekeeper would have had to
            // scroll back through the year to find the other view.
            viewSwitch
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, 4)
            timelineList
        }
    }

    private var timelineList: some View {
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
                // A photograph of the thing itself, when there is one: the plant in flower, a
                // capped queen cell, the mite on a bee. The text says what to do; this says what
                // you are looking for. It is in the app, so it is there at the apiary where there
                // is no signal.
                if let photo = YearPhotos.of(entry.key, honey: entry.honey) {
                    YearPhotoFigure(photo: photo)
                }
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
