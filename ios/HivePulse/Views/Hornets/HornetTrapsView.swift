import SwiftUI
import CoreLocation

// MARK: - Mode

private enum TrapMode {
    case home
    case nearby
    case search
    case register
    case trapDetail
}

// MARK: - HornetTrapsView

struct HornetTrapsView: View {
    @EnvironmentObject var vm: HornetViewModel
    @State private var mode: TrapMode = .home

    var body: some View {
        Group {
            switch mode {
            case .home:      TrapHomeView(mode: $mode)
            case .nearby:    TrapNearbyView(mode: $mode)
            case .search:    TrapSearchView(mode: $mode)
            case .register:  TrapRegisterView(mode: $mode)
            case .trapDetail:
                if let trap = vm.currentTrap {
                    TrapDetailView(trap: trap, mode: $mode)
                } else {
                    ProgressView()
                }
            }
        }
        .environmentObject(vm)
        .alert(NSLocalizedString("alert.error", comment: ""), isPresented: Binding(
            get: { vm.trapError != nil },
            set: { if !$0 { vm.trapError = nil } }
        )) {
            Button("OK", role: .cancel) { vm.trapError = nil }
        } message: {
            Text(vm.trapError ?? "")
        }
    }
}

// MARK: - Home

private struct TrapHomeView: View {
    @Binding var mode: TrapMode
    @EnvironmentObject var vm: HornetViewModel
    @StateObject private var locationHelper = LocationHelper()

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Text(NSLocalizedString("hornets.traps.title", comment: ""))
                    .font(.title2.bold())
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                    .padding(.top)

                Text(NSLocalizedString("hornets.traps.subtitle", comment: ""))
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)

                // Action cards
                VStack(spacing: 12) {
                    TrapActionCard(
                        icon: "location.fill",
                        color: .green,
                        title: NSLocalizedString("hornets.traps.nearby", comment: ""),
                        subtitle: NSLocalizedString("hornets.traps.nearbySearching", comment: "")
                    ) {
                        locationHelper.requestLocation { loc in
                            Task {
                                await vm.loadNearbyTraps(lat: loc.latitude, lon: loc.longitude)
                                mode = .nearby
                            }
                        }
                    }

                    TrapActionCard(
                        icon: "key.fill",
                        color: .orange,
                        title: NSLocalizedString("hornets.traps.search", comment: ""),
                        subtitle: NSLocalizedString("hornets.traps.searchCode", comment: "")
                    ) {
                        mode = .search
                    }

                    TrapActionCard(
                        icon: "plus.circle.fill",
                        color: .blue,
                        title: NSLocalizedString("hornets.traps.new", comment: ""),
                        subtitle: NSLocalizedString("hornets.traps.hint", comment: "")
                    ) {
                        mode = .register
                    }
                }
                .padding(.horizontal)
            }
            .padding(.bottom)
        }
    }
}

private struct TrapActionCard: View {
    let icon: String
    let color: Color
    let title: String
    let subtitle: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                    .frame(width: 36)

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(.primary)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.secondarySystemBackground))
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Nearby

private struct TrapNearbyView: View {
    @Binding var mode: TrapMode
    @EnvironmentObject var vm: HornetViewModel

    var body: some View {
        VStack(spacing: 0) {
            BackBar(title: NSLocalizedString("hornets.traps.nearby", comment: "")) {
                mode = .home
                vm.nearbyTraps = []
            }

            if vm.trapLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if vm.nearbyTraps.isEmpty {
                Text(NSLocalizedString("hornets.traps.noNearby", comment: ""))
                    .foregroundColor(.secondary)
                    .padding()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List(vm.nearbyTraps, id: \.accessCode) { nt in
                    NearbyTrapRow(trap: nt) {
                        Task {
                            await vm.loadTrap(accessCode: nt.accessCode)
                            mode = .trapDetail
                        }
                    }
                }
            }
        }
    }
}

private struct NearbyTrapRow: View {
    let trap: HornetTrapNearbyOut
    let onTap: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(trap.name).font(.headline)
                Spacer()
                Text("\(trap.distanceM) m")
                    .font(.caption)
                    .foregroundColor(.green)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.green.opacity(0.12))
                    .cornerRadius(8)
            }
            Text(NSLocalizedString("hornets.traps.total", comment: "") + ": \(trap.totalCaught)")
                .font(.caption)
                .foregroundColor(.secondary)
            Button(NSLocalizedString("hornets.traps.logCatch", comment: "") + " →", action: onTap)
                .font(.subheadline.bold())
                .foregroundColor(.orange)
                .padding(.top, 4)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Search

private struct TrapSearchView: View {
    @Binding var mode: TrapMode
    @EnvironmentObject var vm: HornetViewModel
    @State private var code = ""

    var body: some View {
        VStack(spacing: 0) {
            BackBar(title: NSLocalizedString("hornets.traps.search", comment: "")) { mode = .home }

            VStack(alignment: .leading, spacing: 16) {
                Text(NSLocalizedString("hornets.traps.searchCode", comment: ""))
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                HStack(spacing: 10) {
                    TextField(NSLocalizedString("hornets.traps.searchCode", comment: ""), text: $code)
                        .textFieldStyle(.roundedBorder)
                        .textCase(.uppercase)
                        .autocorrectionDisabled()
                        .onChange(of: code) { _, v in code = v.uppercased() }

                    Button(NSLocalizedString("hornets.traps.search", comment: "")) {
                        guard !code.isEmpty else { return }
                        Task {
                            await vm.loadTrap(accessCode: code)
                            if vm.currentTrap != nil { mode = .trapDetail }
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(vm.trapLoading || code.isEmpty)
                }

                if vm.trapLoading { ProgressView() }
            }
            .padding()

            Spacer()
        }
    }
}

// MARK: - Register

private struct TrapRegisterView: View {
    @Binding var mode: TrapMode
    @EnvironmentObject var vm: HornetViewModel
    @StateObject private var locationHelper = LocationHelper()

    @State private var name = ""
    @State private var lat = ""
    @State private var lon = ""
    @State private var notes = ""
    @State private var owner = ""
    @State private var createdTrap: HornetTrapOut? = nil
    @State private var codeCopied = false

    var body: some View {
        VStack(spacing: 0) {
            BackBar(title: NSLocalizedString("hornets.traps.new", comment: "")) { mode = .home }

            if let trap = createdTrap {
                // Success: show access code
                ScrollView {
                    VStack(spacing: 20) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.green)

                        Text(NSLocalizedString("hornets.traps.success", comment: ""))
                            .font(.title3.bold())

                        Text(trap.name)
                            .foregroundColor(.secondary)

                        VStack(spacing: 8) {
                            Text(NSLocalizedString("hornets.traps.code", comment: ""))
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .textCase(.uppercase)
                            Text(trap.accessCode)
                                .font(.system(size: 28, weight: .heavy, design: .monospaced))
                                .tracking(6)
                        }
                        .padding()
                        .background(Color(.secondarySystemBackground))
                        .cornerRadius(12)

                        HStack(spacing: 12) {
                            Button {
                                UIPasteboard.general.string = trap.accessCode
                                codeCopied = true
                                DispatchQueue.main.asyncAfter(deadline: .now() + 2) { codeCopied = false }
                            } label: {
                                Label(
                                    codeCopied
                                        ? NSLocalizedString("hornets.traps.codeCopied", comment: "")
                                        : NSLocalizedString("hornets.traps.codeCopy", comment: ""),
                                    systemImage: codeCopied ? "checkmark" : "doc.on.doc"
                                )
                            }
                            .buttonStyle(.bordered)

                            Button(NSLocalizedString("hornets.traps.logCatch", comment: "")) {
                                vm.currentTrap = trap
                                mode = .trapDetail
                            }
                            .buttonStyle(.borderedProminent)
                        }
                    }
                    .padding()
                }
            } else {
                // Registration form
                Form {
                    Section(NSLocalizedString("hornets.traps.name", comment: "")) {
                        TextField(NSLocalizedString("hornets.traps.namePlaceholder", comment: ""), text: $name)
                    }

                    Section(header: HStack {
                        Text(NSLocalizedString("report.location", comment: ""))
                        Spacer()
                        Button {
                            locationHelper.requestLocation { loc in
                                lat = String(format: "%.6f", loc.latitude)
                                lon = String(format: "%.6f", loc.longitude)
                            }
                        } label: {
                            Label(NSLocalizedString("traps.gps", comment: ""), systemImage: "location.fill")
                                .font(.caption)
                        }
                        .disabled(locationHelper.isLocating)
                    }) {
                        HStack {
                            TextField(NSLocalizedString("report.latitude", comment: ""), text: $lat)
                                .keyboardType(.decimalPad)
                            Divider()
                            TextField(NSLocalizedString("report.longitude", comment: ""), text: $lon)
                                .keyboardType(.decimalPad)
                        }
                    }

                    Section(NSLocalizedString("hornets.traps.notes", comment: "")) {
                        TextField("", text: $notes, axis: .vertical)
                            .lineLimit(3...5)
                    }

                    Section(NSLocalizedString("hornets.traps.owner", comment: "")) {
                        TextField(NSLocalizedString("report.namePlaceholder", comment: ""), text: $owner)
                    }

                    Section {
                        Button(NSLocalizedString("hornets.traps.submit", comment: "")) {
                            guard let latVal = Double(lat), let lonVal = Double(lon), !name.isEmpty else { return }
                            Task {
                                if let trap = await vm.createTrap(
                                    name: name, latitude: latVal, longitude: lonVal,
                                    notes: notes.isEmpty ? nil : notes,
                                    ownerName: owner.isEmpty ? nil : owner
                                ) {
                                    createdTrap = trap
                                }
                            }
                        }
                        .disabled(vm.trapLoading || name.isEmpty || lat.isEmpty || lon.isEmpty)
                        .frame(maxWidth: .infinity, alignment: .center)
                    }
                }
            }
        }
    }
}

// MARK: - Trap Detail

private struct TrapDetailView: View {
    let trap: HornetTrapOut
    @Binding var mode: TrapMode
    @EnvironmentObject var vm: HornetViewModel

    @State private var count = "1"
    @State private var date = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: Date())
    }()

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    var body: some View {
        VStack(spacing: 0) {
            BackBar(title: trap.name) {
                mode = .home
                vm.currentTrap = nil
            }

            List {
                // Trap info
                Section {
                    LabeledContent(NSLocalizedString("report.latitude", comment: ""),
                                   value: String(format: "%.4f", trap.latitude))
                    LabeledContent(NSLocalizedString("report.longitude", comment: ""),
                                   value: String(format: "%.4f", trap.longitude))
                    LabeledContent(NSLocalizedString("hornets.traps.total", comment: ""),
                                   value: "\(trap.totalCaught)")
                    HStack {
                        Text(NSLocalizedString("hornets.traps.code", comment: ""))
                        Spacer()
                        Text(trap.accessCode)
                            .font(.system(.body, design: .monospaced))
                            .foregroundColor(.secondary)
                    }
                    if let notes = trap.notes, !notes.isEmpty {
                        Text(notes).foregroundColor(.secondary)
                    }
                }

                // Log catch form
                Section(NSLocalizedString("hornets.traps.logCatch", comment: "")) {
                    HStack {
                        Text(NSLocalizedString("hornets.traps.count", comment: ""))
                        Spacer()
                        TextField("1", text: $count)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 60)
                    }
                    HStack {
                        Text(NSLocalizedString("hornets.traps.date", comment: ""))
                        Spacer()
                        TextField("YYYY-MM-DD", text: $date)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 120)
                    }
                    Button(NSLocalizedString("hornets.traps.logSubmit", comment: "")) {
                        guard let c = Int(count), c > 0 else { return }
                        Task {
                            await vm.addTrapCatch(
                                accessCode: trap.accessCode, count: c, date: date)
                        }
                    }
                    .disabled(vm.trapLoading)

                    if let s = vm.trapSuccess {
                        Text(s).foregroundColor(.green).font(.caption)
                    }
                }

                // Catch history
                if !trap.catches.isEmpty {
                    Section(NSLocalizedString("hornets.traps.history", comment: "")) {
                        ForEach(trap.catches.sorted { $0.caughtOn > $1.caughtOn }) { c in
                            HStack {
                                Text(c.caughtOn)
                                Spacer()
                                Text("\(c.count) 🐝")
                                    .font(.subheadline.bold())
                            }
                        }
                    }
                } else {
                    Section {
                        Text(NSLocalizedString("hornets.traps.noCatches", comment: ""))
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .task {
            // Use live vm.currentTrap which may be updated after addTrapCatch
        }
    }
}

// MARK: - Shared Components

private struct BackBar: View {
    let title: String
    let onBack: () -> Void

    var body: some View {
        HStack {
            Button(action: onBack) {
                HStack(spacing: 4) {
                    Image(systemName: "chevron.left")
                    Text(NSLocalizedString("hornets.traps.backToList", comment: ""))
                }
            }
            Spacer()
            Text(title)
                .font(.headline)
                .lineLimit(1)
            Spacer()
                .frame(minWidth: 70)  // balance the back button
        }
        .padding()
        .background(Color(.systemBackground))
        Divider()
    }
}

// MARK: - Location Helper

@MainActor
private final class LocationHelper: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var isLocating = false
    private let manager = CLLocationManager()
    private var completion: ((CLLocationCoordinate2D) -> Void)?

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    func requestLocation(completion: @escaping (CLLocationCoordinate2D) -> Void) {
        self.completion = completion
        isLocating = true
        manager.requestWhenInUseAuthorization()
        manager.requestLocation()
    }

    nonisolated func locationManager(_ manager: CLLocationManager,
                                     didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.first else { return }
        Task { @MainActor in
            self.isLocating = false
            self.completion?(loc.coordinate)
            self.completion = nil
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in self.isLocating = false }
    }
}
