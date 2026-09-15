import XCTest
@testable import HivePulse

private func makeField(id: String = "fd-1", name: String = "Temperament", type: String = "text",
                       options: [String] = [], required: Bool = false, apiaryId: String? = nil) -> FieldDefinitionOut {
    FieldDefinitionOut(id: id, scope: apiaryId == nil ? "user" : "apiary", apiaryId: apiaryId,
                       target: "inspection", name: name, type: type, options: options,
                       required: required, sortOrder: 0)
}

private final class MockFieldDefinitionService: FieldDefinitionManaging {
    var listResult: Result<[FieldDefinitionOut], Error> = .success([])
    var createResult: Result<FieldDefinitionOut, Error>?
    var updateResult: Result<FieldDefinitionOut, Error>?
    var deleteError: Error?

    private(set) var scopes: [String?] = []
    private(set) var lastCreate: FieldDefinitionCreate?
    private(set) var lastUpdate: (id: String, body: FieldDefinitionUpdate)?
    private(set) var deletedIds: [String] = []

    func list(apiaryId: String?) async throws -> [FieldDefinitionOut] {
        scopes.append(apiaryId)
        return try listResult.get()
    }

    func create(apiaryId: String?, body: FieldDefinitionCreate) async throws -> FieldDefinitionOut {
        scopes.append(apiaryId)
        lastCreate = body
        if let result = createResult { return try result.get() }
        return makeField(id: "new", name: body.name, type: body.type, options: body.options,
                         required: body.required, apiaryId: apiaryId)
    }

    func update(apiaryId: String?, id: String, body: FieldDefinitionUpdate) async throws -> FieldDefinitionOut {
        scopes.append(apiaryId)
        lastUpdate = (id, body)
        if let result = updateResult { return try result.get() }
        return makeField(id: id, name: body.name ?? "", required: body.required ?? false, apiaryId: apiaryId)
    }

    func delete(apiaryId: String?, id: String) async throws {
        scopes.append(apiaryId)
        if let err = deleteError { throw err }
        deletedIds.append(id)
    }
}

private let failure = NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "Boom"])

@MainActor
final class FieldDefinitionsViewModelTests: XCTestCase {

    // MARK: - Helpers

    func test_parseOptions_trimsAndDropsBlankLines() {
        XCTAssertEqual(FieldDefinitionsViewModel.parseOptions(" calm \n\n nervous\n  \naggressive "),
                       ["calm", "nervous", "aggressive"])
    }

    func test_canSubmit_requiresNameAndOptionsForSelect() {
        XCTAssertFalse(FieldDefinitionsViewModel.canSubmit(name: "  ", type: "text", optionsText: ""))
        XCTAssertTrue(FieldDefinitionsViewModel.canSubmit(name: "Temp", type: "number", optionsText: ""))
        XCTAssertFalse(FieldDefinitionsViewModel.canSubmit(name: "Mood", type: "select", optionsText: " \n "))
        XCTAssertTrue(FieldDefinitionsViewModel.canSubmit(name: "Mood", type: "select", optionsText: "calm"))
    }

    // MARK: - Load

    func test_load_userScope_listsUserFields() async {
        let svc = MockFieldDefinitionService()
        svc.listResult = .success([makeField()])
        let vm = FieldDefinitionsViewModel(service: svc)

        await vm.load()

        XCTAssertEqual(vm.fields.map(\.id), ["fd-1"])
        XCTAssertEqual(svc.scopes, [nil])
        XCTAssertFalse(vm.isLoading)
    }

    func test_load_apiaryScope_passesApiaryId() async {
        let svc = MockFieldDefinitionService()
        let vm = FieldDefinitionsViewModel(apiaryId: "a-1", service: svc)

        await vm.load()

        XCTAssertEqual(svc.scopes, ["a-1"])
    }

    func test_load_failure_setsError() async {
        let svc = MockFieldDefinitionService()
        svc.listResult = .failure(failure)
        let vm = FieldDefinitionsViewModel(service: svc)

        await vm.load()

        XCTAssertEqual(vm.errorMessage, "Boom")
        XCTAssertTrue(vm.fields.isEmpty)
    }

    // MARK: - Create

    func test_create_select_sendsParsedOptions_andAppends() async {
        let svc = MockFieldDefinitionService()
        let vm = FieldDefinitionsViewModel(apiaryId: "a-1", service: svc)

        let ok = await vm.create(name: "  Mood ", target: "hive", type: "select", optionsText: "calm\nnervous\n", required: true)

        XCTAssertTrue(ok)
        XCTAssertEqual(svc.lastCreate?.name, "Mood")
        XCTAssertEqual(svc.lastCreate?.target, "hive")
        XCTAssertEqual(svc.lastCreate?.options, ["calm", "nervous"])
        XCTAssertEqual(svc.lastCreate?.required, true)
        XCTAssertEqual(svc.scopes, ["a-1"])
        XCTAssertEqual(vm.fields.map(\.id), ["new"])
        XCTAssertEqual(vm.message, .created)
        XCTAssertFalse(vm.isSaving)
    }

    func test_create_nonSelect_dropsOptions() async {
        let svc = MockFieldDefinitionService()
        let vm = FieldDefinitionsViewModel(service: svc)

        await vm.create(name: "Temp", target: "inspection", type: "number", optionsText: "leftover", required: false)

        XCTAssertEqual(svc.lastCreate?.options, [])
    }

    func test_create_failure_keepsListAndReturnsFalse() async {
        let svc = MockFieldDefinitionService()
        svc.createResult = .failure(failure)
        let vm = FieldDefinitionsViewModel(service: svc)

        let ok = await vm.create(name: "Temp", target: "inspection", type: "text", optionsText: "", required: false)

        XCTAssertFalse(ok)
        XCTAssertEqual(vm.errorMessage, "Boom")
        XCTAssertTrue(vm.fields.isEmpty)
        XCTAssertNil(vm.message)
    }

    // MARK: - Update

    func test_update_replacesField_andOnlySendsOptionsForSelect() async {
        let svc = MockFieldDefinitionService()
        svc.listResult = .success([makeField(id: "fd-1", name: "Old"), makeField(id: "fd-2", name: "Other")])
        let vm = FieldDefinitionsViewModel(service: svc)
        await vm.load()

        let ok = await vm.update(vm.fields[0], name: " New ", optionsText: "ignored", required: true)

        XCTAssertTrue(ok)
        XCTAssertEqual(svc.lastUpdate?.id, "fd-1")
        XCTAssertEqual(svc.lastUpdate?.body.name, "New")
        XCTAssertNil(svc.lastUpdate?.body.options)
        XCTAssertEqual(svc.lastUpdate?.body.required, true)
        XCTAssertEqual(vm.fields.map(\.name), ["New", "Other"])
        XCTAssertEqual(vm.message, .saved)
    }

    func test_update_selectField_sendsOptions() async {
        let svc = MockFieldDefinitionService()
        let vm = FieldDefinitionsViewModel(service: svc)

        await vm.update(makeField(type: "select", options: ["a"]), name: "Mood", optionsText: "a\nb", required: false)

        XCTAssertEqual(svc.lastUpdate?.body.options, ["a", "b"])
    }

    // MARK: - Delete

    func test_delete_removesField() async {
        let svc = MockFieldDefinitionService()
        svc.listResult = .success([makeField(id: "fd-1"), makeField(id: "fd-2")])
        let vm = FieldDefinitionsViewModel(apiaryId: "a-1", service: svc)
        await vm.load()

        await vm.delete(vm.fields[0])

        XCTAssertEqual(svc.deletedIds, ["fd-1"])
        XCTAssertEqual(vm.fields.map(\.id), ["fd-2"])
    }

    func test_delete_failure_keepsFieldAndSetsError() async {
        let svc = MockFieldDefinitionService()
        svc.listResult = .success([makeField(id: "fd-1")])
        svc.deleteError = failure
        let vm = FieldDefinitionsViewModel(service: svc)
        await vm.load()

        await vm.delete(vm.fields[0])

        XCTAssertEqual(vm.fields.map(\.id), ["fd-1"])
        XCTAssertEqual(vm.errorMessage, "Boom")
    }
}
