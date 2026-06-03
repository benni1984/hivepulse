package com.hivepulse.app.ui.apiaries

import android.content.Context
import com.hivepulse.app.R
import com.hivepulse.app.data.api.ApiaryOut
import com.hivepulse.app.data.repository.ApiaryRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class ApiaryViewModelTest {

    private val repo    = mockk<ApiaryRepository>()
    private val context = mockk<Context>(relaxed = true)
    private lateinit var vm: ApiaryViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { repo.list() } returns emptyList()
        every { context.getString(R.string.error_apiary_has_hives) } returns
            "Please delete all hives in this apiary before deleting it."
        vm = ApiaryViewModel(repo, context)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    @Test
    fun `init loads apiaries on construction`() = runTest {
        val apiaries = listOf(apiary("a1"), apiary("a2"))
        coEvery { repo.list() } returns apiaries
        val vm = ApiaryViewModel(repo, context)

        assertEquals(apiaries, vm.state.value.apiaries)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `load failure sets error`() = runTest {
        coEvery { repo.list() } throws RuntimeException("Server error")
        val vm = ApiaryViewModel(repo, context)

        assertEquals("Server error", vm.state.value.error)
        assertTrue(vm.state.value.apiaries.isEmpty())
    }

    @Test
    fun `create adds apiary to list and calls onDone with id`() = runTest {
        val newApiary = apiary("a1")
        coEvery { repo.create("Meadow", null, null, null, null, false) } returns newApiary
        var receivedId = ""

        vm.create("Meadow", null, null, null, null, false) { id -> receivedId = id }

        assertTrue(vm.state.value.apiaries.contains(newApiary))
        assertEquals("a1", receivedId)
    }

    @Test
    fun `create failure sets error`() = runTest {
        coEvery { repo.create(any(), any(), any(), any(), any(), any()) } throws RuntimeException("conflict")

        vm.create("Meadow", null, null, null, null, false) {}

        assertEquals("conflict", vm.state.value.error)
    }

    @Test
    fun `update replaces apiary in list`() = runTest {
        val original = apiary("a1")
        val updated = original.copy(name = "Updated")
        coEvery { repo.list() } returns listOf(original)
        vm.load()
        coEvery { repo.update("a1", "Updated", null, null, null, null, false) } returns updated

        vm.update("a1", "Updated", null, null, null, null, false) {}

        assertEquals("Updated", vm.state.value.apiaries.first().name)
    }

    @Test
    fun `delete removes apiary from list`() = runTest {
        val a1 = apiary("a1")
        val a2 = apiary("a2")
        coEvery { repo.list() } returns listOf(a1, a2)
        vm.load()
        coEvery { repo.delete("a1") } just runs

        vm.delete("a1")

        assertEquals(listOf(a2), vm.state.value.apiaries)
    }

    @Test
    fun `delete failure sets error`() = runTest {
        coEvery { repo.delete(any()) } throws RuntimeException("not found")

        vm.delete("a1")

        assertEquals("not found", vm.state.value.error)
    }

    @Test
    fun `delete with has_hives error shows friendly message`() = runTest {
        coEvery { repo.delete(any()) } throws RuntimeException("has_hives")

        vm.delete("a1")

        assertEquals(
            "Please delete all hives in this apiary before deleting it.",
            vm.state.value.error
        )
    }

    @Test
    fun `clearError removes error from state`() = runTest {
        coEvery { repo.list() } throws RuntimeException("err")
        vm.load()
        assertNotNull(vm.state.value.error)

        vm.clearError()

        assertNull(vm.state.value.error)
    }

    private fun apiary(id: String) = ApiaryOut(
        id = id, name = "Apiary $id", description = null,
        latitude = null, longitude = null, address = null,
        hiveCount = 0, isPublic = false, createdAt = "2024-01-01"
    )
}
