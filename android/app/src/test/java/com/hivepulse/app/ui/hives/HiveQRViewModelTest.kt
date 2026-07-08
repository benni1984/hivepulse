package com.hivepulse.app.ui.hives

import androidx.lifecycle.SavedStateHandle
import com.hivepulse.app.data.api.HiveOut
import com.hivepulse.app.data.repository.HiveRepository
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class HiveQRViewModelTest {

    private val hiveRepo = mockk<HiveRepository>()

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `init loads hive name and qr png bytes`() {
        coEvery { hiveRepo.get("h1") } returns hive()
        coEvery { hiveRepo.getQrPng("h1") } returns byteArrayOf(1, 2, 3)

        val vm = HiveQRViewModel(SavedStateHandle(mapOf("hiveId" to "h1")), hiveRepo)

        assertEquals("Hive 1", vm.state.value.hiveName)
        assertArrayEquals(byteArrayOf(1, 2, 3), vm.state.value.qrPngBytes)
        assertFalse(vm.state.value.isLoading)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `load failure sets error`() {
        coEvery { hiveRepo.get("h1") } throws RuntimeException("not found")

        val vm = HiveQRViewModel(SavedStateHandle(mapOf("hiveId" to "h1")), hiveRepo)

        assertEquals("not found", vm.state.value.error)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `clearError removes error from state`() {
        coEvery { hiveRepo.get("h1") } throws RuntimeException("err")
        val vm = HiveQRViewModel(SavedStateHandle(mapOf("hiveId" to "h1")), hiveRepo)
        assertNotNull(vm.state.value.error)

        vm.clearError()

        assertNull(vm.state.value.error)
    }

    private fun hive() = HiveOut(
        id = "h1", qrToken = "tok", apiaryId = "a1", name = "Hive 1",
        hiveType = "langstroth", latitude = null, longitude = null,
        acquisitionDate = null, notes = null, customFields = emptyMap(),
        initializedAt = "2024-01-01", lastInspectionAt = null, createdAt = "2024-01-01"
    )
}
