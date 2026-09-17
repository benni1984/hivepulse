package com.hivepulse.app.ui.hives

import androidx.lifecycle.SavedStateHandle
import com.hivepulse.app.data.api.*
import com.hivepulse.app.data.repository.HiveRepository
import com.hivepulse.app.data.repository.InspectionRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class HiveDetailViewModelTest {

    private val hiveRepo = mockk<HiveRepository>()
    private val inspRepo = mockk<InspectionRepository>()
    private lateinit var vm: HiveDetailViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { hiveRepo.get("h1") } returns hive()
        coEvery { inspRepo.list("h1") } returns PaginatedResponse(emptyList(), 0, 1, 0)
        vm = HiveDetailViewModel(SavedStateHandle(mapOf("hiveId" to "h1")), hiveRepo, inspRepo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    @Test
    fun `init loads hive and inspections`() {
        val inspections = listOf(inspection("i1"), inspection("i2"))
        coEvery { inspRepo.list("h1") } returns PaginatedResponse(inspections, 2, 1, 1)
        val vm = HiveDetailViewModel(
            SavedStateHandle(mapOf("hiveId" to "h1")), hiveRepo, inspRepo
        )

        assertEquals(hive(), vm.state.value.hive)
        assertEquals(inspections, vm.state.value.inspections)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `load failure sets error`() = runTest {
        coEvery { hiveRepo.get(any()) } throws RuntimeException("not found")
        val vm = HiveDetailViewModel(
            SavedStateHandle(mapOf("hiveId" to "h1")), hiveRepo, inspRepo
        )

        assertEquals("not found", vm.state.value.error)
    }

    @Test
    fun `deleteInspection removes inspection from state`() = runTest {
        val inspections = listOf(inspection("i1"), inspection("i2"))
        coEvery { inspRepo.list("h1") } returns PaginatedResponse(inspections, 2, 1, 1)
        vm.load()
        coEvery { inspRepo.delete("i1") } returns Unit

        vm.deleteInspection("i1")

        assertEquals(listOf(inspection("i2")), vm.state.value.inspections)
    }

    @Test
    fun `deleteInspection failure sets error`() = runTest {
        coEvery { inspRepo.delete(any()) } throws RuntimeException("server error")

        vm.deleteInspection("i1")

        assertEquals("server error", vm.state.value.error)
    }

    @Test
    fun `clearError removes error from state`() = runTest {
        coEvery { hiveRepo.get(any()) } throws RuntimeException("err")
        val vm = HiveDetailViewModel(
            SavedStateHandle(mapOf("hiveId" to "h1")), hiveRepo, inspRepo
        )
        assertNotNull(vm.state.value.error)

        vm.clearError()

        assertNull(vm.state.value.error)
    }

    @Test
    fun `updateHive saves trimmed values and shows the updated hive`() {
        val updated = hive().copy(name = "Linde 3", hiveType = "dadant", acquisitionDate = "2025-04-09", notes = "Swarm")
        val sent = slot<HiveUpdateRequest>()
        coEvery { hiveRepo.update("h1", capture(sent)) } returns updated

        vm.updateHive("  Linde 3 ", "dadant", " 2025-04-09 ", " Swarm ")

        assertEquals("Linde 3", sent.captured.name)
        assertEquals("dadant", sent.captured.hiveType)
        assertEquals("2025-04-09", sent.captured.acquisitionDate)
        assertEquals("Swarm", sent.captured.notes)
        assertNull(sent.captured.apiaryId)
        assertEquals(updated, vm.state.value.hive)
    }

    @Test
    fun `updateHive sends an empty string to clear notes and no blank date`() {
        val sent = slot<HiveUpdateRequest>()
        coEvery { hiveRepo.update("h1", capture(sent)) } returns hive()

        vm.updateHive("Hive 1", "langstroth", "  ", null)

        assertNull(sent.captured.acquisitionDate)
        assertEquals("", sent.captured.notes)
    }

    @Test
    fun `updateHive ignores a blank name`() {
        vm.updateHive("   ", "langstroth", null, null)
        coVerify(exactly = 0) { hiveRepo.update(any(), any()) }
    }

    @Test
    fun `updateHive failure sets error`() {
        coEvery { hiveRepo.update(any(), any()) } throws RuntimeException("offline")
        vm.updateHive("Hive 1", "langstroth", null, null)
        assertEquals("offline", vm.state.value.error)
    }

    @Test
    fun `acquisition date must be empty or YYYY-MM-DD`() {
        assertTrue(isValidAcquisitionDate(""))
        assertTrue(isValidAcquisitionDate("2025-04-09"))
        assertFalse(isValidAcquisitionDate("9.4.2025"))
        assertFalse(isValidAcquisitionDate("2025-4-9"))
    }

    private fun hive() = HiveOut(
        id = "h1", qrToken = "tok", apiaryId = "a1", name = "Hive 1",
        hiveType = "langstroth", latitude = null, longitude = null,
        acquisitionDate = null, notes = null, customFields = emptyMap(),
        initializedAt = "2024-01-01", lastInspectionAt = null, createdAt = "2024-01-01"
    )

    private fun inspection(id: String) = InspectionOut(
        id = id, hiveId = "h1", date = "2024-06-01", queenSeen = null,
        queenColor = null, broodFrames = null, honeyFrames = null, mood = null,
        populationStrength = null, varroaCount = null, swarmCellsSeen = null,
        treatmentApplied = null, feedingDone = null, feedingType = null,
        weightKg = null, notes = null, customFields = emptyMap(), createdAt = "2024-06-01"
    )
}
