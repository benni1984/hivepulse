package com.hivepulse.app.ui.apiaries

import androidx.lifecycle.SavedStateHandle
import com.hivepulse.app.data.api.ApiaryOut
import com.hivepulse.app.data.api.HiveCreateRequest
import com.hivepulse.app.data.api.HiveOut
import com.hivepulse.app.data.repository.ApiaryRepository
import com.hivepulse.app.data.repository.HiveRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class ApiaryDetailViewModelTest {

    private val apiaryRepo = mockk<ApiaryRepository>()
    private val hiveRepo = mockk<HiveRepository>()
    private lateinit var vm: ApiaryDetailViewModel

    private val stored = ApiaryOut(
        id = "a1", name = "Meadow", description = "Old", latitude = 48.1, longitude = 11.5,
        address = "Main St", hiveCount = 2, isPublic = false, createdAt = "2026-01-01T00:00:00",
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { apiaryRepo.get("a1") } returns stored
        coEvery { hiveRepo.listForApiary("a1") } returns emptyList()
        vm = ApiaryDetailViewModel(SavedStateHandle(mapOf("apiaryId" to "a1")), apiaryRepo, hiveRepo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    @Test
    fun `load keeps the apiary for editing`() {
        assertEquals(stored, vm.state.value.apiary)
        assertEquals("Meadow", vm.state.value.apiaryName)
    }

    @Test
    fun `updateApiary makes an existing apiary public and keeps its coordinates`() {
        val updated = stored.copy(name = "Meadow 2", isPublic = true)
        coEvery { apiaryRepo.update(any(), any(), any(), any(), any(), any(), any()) } returns updated
        var done = false

        vm.updateApiary(" Meadow 2 ", "  ", " Main St ", isPublic = true) { done = true }

        coVerify { apiaryRepo.update("a1", "Meadow 2", null, 48.1, 11.5, "Main St", true) }
        assertTrue(done)
        assertEquals(updated, vm.state.value.apiary)
        assertEquals("Meadow 2", vm.state.value.apiaryName)
    }

    @Test
    fun `updateApiary can make a public apiary private again`() {
        coEvery { apiaryRepo.update(any(), any(), any(), any(), any(), any(), any()) } returns stored
        vm.updateApiary("Meadow", "Old", "Main St", isPublic = false)
        coVerify { apiaryRepo.update("a1", "Meadow", "Old", 48.1, 11.5, "Main St", false) }
    }

    @Test
    fun `updateApiary ignores a blank name`() {
        vm.updateApiary("  ", null, null, isPublic = true)
        coVerify(exactly = 0) { apiaryRepo.update(any(), any(), any(), any(), any(), any(), any()) }
    }

    @Test
    fun `updateApiary failure sets error and keeps the stored apiary`() {
        coEvery { apiaryRepo.update(any(), any(), any(), any(), any(), any(), any()) } throws RuntimeException("offline")
        var done = false
        vm.updateApiary("Meadow", null, null, isPublic = true) { done = true }
        assertEquals("offline", vm.state.value.error)
        assertEquals(stored, vm.state.value.apiary)
        assertFalse(done)
    }

    private fun created(name: String) = HiveOut(
        "h-new", "tok", "a1", name, "dadant", null, null, null, null, emptyMap(),
        "2026-01-01T00:00:00", null, "2026-01-01T00:00:00",
    )

    @Test
    fun `createHive sends the hive to the apiary and puts it in the list`() {
        val requests = mutableListOf<HiveCreateRequest>()
        coEvery { hiveRepo.create("a1", capture(requests)) } returns created("Nicole II")
        var done = false

        vm.createHive("  Nicole II ", "dadant", "2026-04-01", " from a swarm ") { done = true }

        assertEquals(HiveCreateRequest("Nicole II", "dadant", "2026-04-01", "from a swarm"), requests.single())
        assertEquals(listOf("Nicole II"), vm.state.value.hives.map { it.name })
        assertTrue(done)
    }

    @Test
    fun `createHive leaves out an empty date and note`() {
        val requests = mutableListOf<HiveCreateRequest>()
        coEvery { hiveRepo.create("a1", capture(requests)) } returns created("H")

        vm.createHive("H", "langstroth", "", "  ")

        assertEquals(HiveCreateRequest("H", "langstroth", null, null), requests.single())
    }

    @Test
    fun `createHive ignores a blank name`() {
        vm.createHive("  ", "langstroth", null, null)

        coVerify(exactly = 0) { hiveRepo.create(any(), any()) }
    }

    @Test
    fun `createHive refused shows the reason and keeps the list`() {
        coEvery { hiveRepo.create(any(), any()) } throws RuntimeException("Only the owner can do this.")
        var done = false

        vm.createHive("H", "langstroth", null, null) { done = true }

        assertEquals("Only the owner can do this.", vm.state.value.error)
        assertTrue(vm.state.value.hives.isEmpty())
        assertFalse(done)
    }
}
