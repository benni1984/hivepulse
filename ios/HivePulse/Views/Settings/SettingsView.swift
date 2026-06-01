import SwiftUI
import UIKit

struct SettingsView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var showLogoutConfirm = false
    @State private var name = ""
    @State private var locale = "en"
    @State private var isSaving = false

    // Password change
    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var isChangingPassword = false
    @State private var passwordError: String?
    @State private var passwordSuccess = false

    // Delete account
    @State private var showDeleteConfirm = false
    @State private var isDeleting = false

    // Reminder settings
    @State private var reminderEnabled = true
    @State private var reminderIntervalDays = 7
    @State private var reminderSeasonStart = 4
    @State private var reminderSeasonEnd = 8
    @State private var isSavingReminder = false
    @State private var reminderSaveSuccess = false

    // Export
    @State private var apiaries: [ApiaryOut] = []
    @State private var showExportSheet = false
    @State private var exportApiaryIndex = 0
    @State private var exportFormat = "json"
    @State private var isExporting = false
    @State private var exportError: String?
    @State private var shareItems: [Any] = []
    @State private var showShareSheet = false

    private let locales = [("en", "English"), ("fr", "Français"), ("de", "Deutsch"), ("es", "Español")]
    private let apiaryService = ApiaryService()
    private let exportService = ExportService()

    var body: some View {
        Form {
            // MARK: - QR Codes
            Section {
                NavigationLink(destination: QRBatchListView()) {
                    Label(NSLocalizedString("screen.qrBatches", comment: ""), systemImage: "printer")
                }
            }

            // MARK: - Profile
            Section(NSLocalizedString("section.profile", comment: "")) {
                if let user = authVM.currentUser {
                    Text(user.email).foregroundColor(.secondary)
                }
                TextField(NSLocalizedString("field.name", comment: ""), text: $name)
                Picker(NSLocalizedString("field.language", comment: ""), selection: $locale) {
                    ForEach(locales, id: \.0) { code, label in
                        Text(label).tag(code)
                    }
                }
            }

            Section {
                Button {
                    Task { await save() }
                } label: {
                    HStack {
                        if isSaving { ProgressView() }
                        Text(NSLocalizedString("action.saveProfile", comment: ""))
                    }
                }
                .disabled(isSaving)
            }

            // MARK: - Change Password
            Section(NSLocalizedString("section.changePassword", comment: "")) {
                SecureField(NSLocalizedString("field.currentPassword", comment: ""), text: $currentPassword)
                    .accessibilityIdentifier("currentPasswordField")
                SecureField(NSLocalizedString("field.newPassword", comment: ""), text: $newPassword)
                    .accessibilityIdentifier("newPasswordField")
                SecureField(NSLocalizedString("field.confirmPassword", comment: ""), text: $confirmPassword)
                    .accessibilityIdentifier("confirmPasswordField")

                if let err = passwordError {
                    Text(err).foregroundColor(.red).font(.caption)
                }
                if passwordSuccess {
                    Text(NSLocalizedString("alert.passwordChanged", comment: ""))
                        .foregroundColor(.green).font(.caption)
                }
            }

            Section {
                Button {
                    Task { await doChangePassword() }
                } label: {
                    HStack {
                        if isChangingPassword { ProgressView() }
                        Text(NSLocalizedString("action.changePassword", comment: ""))
                    }
                }
                .disabled(isChangingPassword || currentPassword.isEmpty || newPassword.isEmpty || confirmPassword.isEmpty)
            }

            // MARK: - Inspection Reminders
            Section(NSLocalizedString("section.reminders", comment: "")) {
                Toggle(NSLocalizedString("reminder.enabled", comment: ""), isOn: $reminderEnabled)
                    .accessibilityIdentifier("reminderEnabledToggle")
                if reminderEnabled {
                    Stepper(
                        String(format: NSLocalizedString("reminder.intervalFormat", comment: ""), reminderIntervalDays),
                        value: $reminderIntervalDays, in: 1...365
                    )
                    Picker(NSLocalizedString("reminder.seasonStart", comment: ""), selection: $reminderSeasonStart) {
                        ForEach(1...12, id: \.self) { m in Text(monthName(m)).tag(m) }
                    }
                    Picker(NSLocalizedString("reminder.seasonEnd", comment: ""), selection: $reminderSeasonEnd) {
                        ForEach(1...12, id: \.self) { m in Text(monthName(m)).tag(m) }
                    }
                }
                if reminderSaveSuccess {
                    Text(NSLocalizedString("reminder.saved", comment: ""))
                        .foregroundColor(.green).font(.caption)
                }
            }

            Section {
                Button {
                    Task { await saveReminderSettings() }
                } label: {
                    HStack {
                        if isSavingReminder { ProgressView() }
                        Text(NSLocalizedString("reminder.saveButton", comment: ""))
                    }
                }
                .disabled(isSavingReminder)
                .accessibilityIdentifier("saveReminderButton")
            }

            // MARK: - Export
            if !apiaries.isEmpty {
                Section(NSLocalizedString("section.export", comment: "")) {
                    Button {
                        showExportSheet = true
                    } label: {
                        Label(NSLocalizedString("action.exportData", comment: ""), systemImage: "square.and.arrow.up")
                    }
                }
            }

            if let err = exportError {
                Section {
                    Text(err).foregroundColor(.red).font(.caption)
                }
            }

            // MARK: - Admin
            if authVM.currentUser?.isAdmin == true {
                Section {
                    NavigationLink(destination: AdminView()) {
                        Label(NSLocalizedString("admin.title", comment: ""), systemImage: "shield.lefthalf.filled")
                    }
                }
            }

            // MARK: - Log Out
            Section {
                Button(role: .destructive) {
                    showLogoutConfirm = true
                } label: {
                    Label(NSLocalizedString("action.logout", comment: ""), systemImage: "rectangle.portrait.and.arrow.right")
                }
            }

            // MARK: - Danger Zone
            Section(NSLocalizedString("section.dangerZone", comment: "")) {
                Button(role: .destructive) {
                    showDeleteConfirm = true
                } label: {
                    HStack {
                        if isDeleting { ProgressView() }
                        Label(NSLocalizedString("action.deleteAccount", comment: ""),
                              systemImage: "trash")
                    }
                }
                .disabled(isDeleting)
            }

            Section {
                HStack {
                    Text("HivePulse").foregroundColor(.secondary)
                    Spacer()
                    Text("v1.0").foregroundColor(.secondary)
                }
            }
        }
        .navigationTitle(NSLocalizedString("tab.settings", comment: ""))
        .task {
            name   = authVM.currentUser?.name ?? ""
            locale = authVM.currentUser?.locale ?? "en"
            apiaries = (try? await apiaryService.list().items) ?? []
            await authVM.loadReminderSettings()
            if let r = authVM.reminderSettings {
                reminderEnabled       = r.reminderEnabled
                reminderIntervalDays  = r.reminderIntervalDays
                reminderSeasonStart   = r.reminderSeasonStart
                reminderSeasonEnd     = r.reminderSeasonEnd
            }
        }
        .confirmationDialog(
            NSLocalizedString("alert.logoutConfirm", comment: ""),
            isPresented: $showLogoutConfirm,
            titleVisibility: .visible
        ) {
            Button(NSLocalizedString("action.logout", comment: ""), role: .destructive) {
                Task { await authVM.logout() }
            }
        }
        .alert(
            NSLocalizedString("alert.deleteAccountConfirm", comment: ""),
            isPresented: $showDeleteConfirm
        ) {
            Button(NSLocalizedString("alert.deleteAccountAction", comment: ""), role: .destructive) {
                Task { await doDeleteAccount() }
            }
            Button(NSLocalizedString("action.cancel", comment: ""), role: .cancel) {}
        } message: {
            Text(NSLocalizedString("alert.deleteAccountMessage", comment: ""))
        }
        .sheet(isPresented: $showExportSheet) {
            ExportPickerView(
                apiaries: apiaries,
                selectedIndex: $exportApiaryIndex,
                format: $exportFormat,
                isExporting: isExporting,
                onExport: {
                    Task { await doExport() }
                }
            )
        }
        .sheet(isPresented: $showShareSheet) {
            ShareSheet(items: shareItems)
        }
    }

    // MARK: - Actions

    private func save() async {
        isSaving = true
        await authVM.updateProfile(name: name, locale: locale)
        isSaving = false
    }

    private func doChangePassword() async {
        passwordError = nil
        passwordSuccess = false

        guard newPassword == confirmPassword else {
            passwordError = NSLocalizedString("alert.passwordMismatch", comment: "")
            return
        }
        guard newPassword.count >= 8 else {
            passwordError = NSLocalizedString("alert.passwordTooShort", comment: "")
            return
        }

        isChangingPassword = true
        await authVM.changePassword(currentPassword: currentPassword, newPassword: newPassword)
        isChangingPassword = false

        if authVM.errorMessage == nil {
            passwordSuccess = true
            currentPassword = ""
            newPassword = ""
            confirmPassword = ""
        } else {
            passwordError = authVM.errorMessage
            authVM.errorMessage = nil
        }
    }

    private func doDeleteAccount() async {
        isDeleting = true
        await authVM.deleteAccount()
        isDeleting = false
    }

    private func saveReminderSettings() async {
        isSavingReminder = true
        reminderSaveSuccess = false
        let update = ReminderSettingsUpdate(
            reminderEnabled:      reminderEnabled,
            reminderIntervalDays: reminderIntervalDays,
            reminderSeasonStart:  reminderSeasonStart,
            reminderSeasonEnd:    reminderSeasonEnd
        )
        await authVM.updateReminderSettings(update)
        isSavingReminder = false
        if authVM.errorMessage == nil {
            reminderSaveSuccess = true
        }
    }

    private func monthName(_ month: Int) -> String {
        let fmt = DateFormatter()
        fmt.locale = Locale.current
        return fmt.monthSymbols[month - 1]
    }

    private func doExport() async {
        guard exportApiaryIndex < apiaries.count else { return }
        let apiary = apiaries[exportApiaryIndex]
        isExporting = true
        exportError = nil
        showExportSheet = false
        do {
            let data = try await exportService.exportApiary(apiaryId: apiary.id, format: exportFormat)
            let ext = exportFormat == "csv" ? "csv" : "json"
            let safe = apiary.name.replacingOccurrences(of: "[^a-zA-Z0-9_-]", with: "_", options: .regularExpression)
            let filename = "HivePulse_\(safe)_inspections.\(ext)"
            let url = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
            try data.write(to: url)
            shareItems = [url]
            showShareSheet = true
        } catch {
            exportError = error.localizedDescription
        }
        isExporting = false
    }
}

// MARK: - Export picker sheet

private struct ExportPickerView: View {
    let apiaries: [ApiaryOut]
    @Binding var selectedIndex: Int
    @Binding var format: String
    let isExporting: Bool
    let onExport: () -> Void
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            Form {
                if apiaries.count > 1 {
                    Section(NSLocalizedString("label.selectApiary", comment: "")) {
                        Picker("", selection: $selectedIndex) {
                            ForEach(apiaries.indices, id: \.self) { i in
                                Text(apiaries[i].name).tag(i)
                            }
                        }
                        .pickerStyle(.wheel)
                        .labelsHidden()
                    }
                }

                Section(NSLocalizedString("label.selectFormat", comment: "")) {
                    Picker("", selection: $format) {
                        Text("JSON").tag("json")
                        Text("CSV").tag("csv")
                    }
                    .pickerStyle(.segmented)
                    .labelsHidden()
                }

                Section {
                    Button {
                        onExport()
                    } label: {
                        HStack {
                            if isExporting { ProgressView() }
                            Text(NSLocalizedString("action.download", comment: ""))
                        }
                    }
                    .disabled(isExporting)
                }
            }
            .navigationTitle(NSLocalizedString("action.exportData", comment: ""))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(NSLocalizedString("action.cancel", comment: "")) { dismiss() }
                }
            }
        }
    }
}

// MARK: - UIActivityViewController wrapper

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
