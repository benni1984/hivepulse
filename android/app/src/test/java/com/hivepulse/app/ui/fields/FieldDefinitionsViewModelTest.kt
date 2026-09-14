package com.hivepulse.app.ui.fields

import androidx.lifecycle.SavedStateHandle
import com.hivepulse.app.data.api.FieldDefinitionCreate
import com.hivepulse.app.data.api.FieldDefinitionOut
import com.hivepulse.app.data.api.FieldDefinitionUpdate
import com.hivepulse.app.data.repository.FieldDefinitionRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class FieldDefinitionsViewModelTest {

    private val repo = mockk<FieldDefinitionRepository>()

    @Before fun setUp()    { Dispatchers.setMain(UnconfinedTestDispatcher()) }
    @After  fun tearDown() { Dispatchers.resetMain(); clearAllMocks() }

    private fun vm(apiaryId: String? = null) =
        FieldDefinitionsViewModel(SavedStateHandle(mapOf("apiaryId" to (apiaryId ?: ""))), repo)

    @Test
    fun `blank apiary argument loads the user scope`() {
        coEvery { repo.list(null) } returns listOf(fd("f1"))

        val vm = vm()

        assertNull(vm.apiaryId)
        assertEquals(listOf(fd("f1")), vm.state.value.fields)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `apiary argument loads the apiary scope`() {
        coEvery { repo.list("a1") } returns listOf(fd("f1"))

        val vm = vm("a1")

        assertEquals("a1", vm.apiaryId)
        assertEquals(listOf(fd("f1")), vm.state.value.fields)
    }

    @Test
    fun `load failure sets error`() {
        coEvery { repo.list(null) } throws RuntimeException("offline")

        val vm = vm()

        assertEquals("offline", vm.state.value.error)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `create select field trims name, parses options and appends`() = runTest {
        coEvery { repo.list(null) } returns emptyList()
        val created = fd("f2", type = "select", options = listOf("A", "B"))
        coEvery { repo.create(null, any()) } returns created
        val vm = vm()
        var done = false

        vm.create("  Colour ", "hive", "select", "A\n\n B \n", required = true) { done = true }

        coVerify { repo.create(null, FieldDefinitionCreate("hive", "Colour", "select", listOf("A", "B"), true, 0)) }
        assertEquals(listOf(created), vm.state.value.fields)
        assertEquals(FieldMessage.CREATED, vm.state.value.message)
        assertTrue(done)
        assertFalse(vm.state.value.isSaving)
    }

    @Test
    fun `create non-select field ignores the options text`() = runTest {
        coEvery { repo.list("a1") } returns emptyList()
        coEvery { repo.create("a1", any()) } returns fd("f2", type = "number")
        val vm = vm("a1")

        vm.create("Weight", "inspection", "number", "leftover", required = false)

        coVerify { repo.create("a1", match { it.type == "number" && it.options.isEmpty() }) }
    }

    @Test
    fun `create failure sets error and keeps dialog open`() = runTest {
        coEvery { repo.list(null) } returns emptyList()
        coEvery { repo.create(null, any()) } throws RuntimeException("422")
        val vm = vm()
        var done = false

        vm.create("X", "inspection", "text", "", required = false) { done = true }

        assertEquals("422", vm.state.value.error)
        assertFalse(done)
        assertTrue(vm.state.value.fields.isEmpty())
    }

    @Test
    fun `update sends options only for select fields and replaces the row`() = runTest {
        val existing = fd("f1", type = "number")
        coEvery { repo.list(null) } returns listOf(existing)
        coEvery { repo.update(null, "f1", any()) } returns existing.copy(name = "Weight", required = true)
        val vm = vm()

        vm.update(existing, " Weight ", "ignored", required = true)

        coVerify { repo.update(null, "f1", FieldDefinitionUpdate(name = "Weight", options = null, required = true)) }
        assertEquals("Weight", vm.state.value.fields.single().name)
        assertEquals(FieldMessage.SAVED, vm.state.value.message)
    }

    @Test
    fun `update select field sends parsed options`() = runTest {
        val existing = fd("f1", type = "select", options = listOf("A"))
        coEvery { repo.list(null) } returns listOf(existing)
        coEvery { repo.update(null, "f1", any()) } returns existing.copy(options = listOf("A", "C"))
        val vm = vm()

        vm.update(existing, "Colour", "A\nC", required = false)

        coVerify { repo.update(null, "f1", match { it.options == listOf("A", "C") }) }
    }

    @Test
    fun `delete removes the field`() = runTest {
        coEvery { repo.list("a1") } returns listOf(fd("f1"), fd("f2"))
        coEvery { repo.delete("a1", "f1") } just runs
        val vm = vm("a1")

        vm.delete("f1")

        assertEquals(listOf(fd("f2")), vm.state.value.fields)
    }

    @Test
    fun `delete failure keeps the field and sets error`() = runTest {
        coEvery { repo.list(null) } returns listOf(fd("f1"))
        coEvery { repo.delete(null, "f1") } throws RuntimeException("delete_failed_500")
        val vm = vm()

        vm.delete("f1")

        assertEquals(listOf(fd("f1")), vm.state.value.fields)
        assertEquals("delete_failed_500", vm.state.value.error)
    }

    @Test
    fun `parseOptions trims and drops blank lines`() {
        assertEquals(listOf("A", "B"), parseOptions(" A \n\n\tB\n  "))
        assertTrue(parseOptions("\n \n").isEmpty())
    }

    private fun fd(id: String, type: String = "text", options: List<String> = emptyList()) =
        FieldDefinitionOut(id, "user", null, "inspection", "Field $id", type, options, false, 0)
}
