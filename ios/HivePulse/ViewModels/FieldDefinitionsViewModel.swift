import Foundation

/// Create, edit and delete custom fields — iOS counterpart of the web/Android field definition screens.
@MainActor
final class FieldDefinitionsViewModel: ObservableObject {
    enum Message: Equatable { case created, saved }

    static let targets = ["inspection", "hive"]
    static let types = ["text", "number", "boolean", "date", "select"]

    /// nil → the user's own fields; otherwise fields that only apply inside this apiary.
    let apiaryId: String?

    @Published var fields: [FieldDefinitionOut] = []
    @Published var isLoading = false
    @Published var isSaving = false
    @Published var errorMessage: String?
    @Published var message: Message?

    private let service: any FieldDefinitionManaging

    init(apiaryId: String? = nil, service: any FieldDefinitionManaging = FieldDefinitionService()) {
        self.apiaryId = apiaryId
        self.service = service
    }

    /// Select options are entered one per line, like on the web.
    static func parseOptions(_ text: String) -> [String] {
        text.split(whereSeparator: \.isNewline)
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
    }

    static func canSubmit(name: String, type: String, optionsText: String) -> Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
            && (type != "select" || !parseOptions(optionsText).isEmpty)
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            fields = try await service.list(apiaryId: apiaryId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    @discardableResult
    func create(name: String, target: String, type: String, optionsText: String, required: Bool) async -> Bool {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }
        let body = FieldDefinitionCreate(
            target: target,
            name: name.trimmingCharacters(in: .whitespaces),
            type: type,
            options: type == "select" ? Self.parseOptions(optionsText) : [],
            required: required,
            sortOrder: 0
        )
        do {
            fields.append(try await service.create(apiaryId: apiaryId, body: body))
            message = .created
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    /// Target and type are fixed after creation (the API only accepts name, options and required).
    @discardableResult
    func update(_ field: FieldDefinitionOut, name: String, optionsText: String, required: Bool) async -> Bool {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }
        let body = FieldDefinitionUpdate(
            name: name.trimmingCharacters(in: .whitespaces),
            options: field.type == "select" ? Self.parseOptions(optionsText) : nil,
            required: required
        )
        do {
            let updated = try await service.update(apiaryId: apiaryId, id: field.id, body: body)
            fields = fields.map { $0.id == updated.id ? updated : $0 }
            message = .saved
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func delete(_ field: FieldDefinitionOut) async {
        errorMessage = nil
        do {
            try await service.delete(apiaryId: apiaryId, id: field.id)
            fields.removeAll { $0.id == field.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
