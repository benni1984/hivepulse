package com.apiscan.app.ui.qr

import androidx.lifecycle.SavedStateHandle
import com.apiscan.app.data.api.*
import com.apiscan.app.data.local.TokenStore
import com.apiscan.app.data.repository.HiveRepository
import com.apiscan.app.data.repository.QrBatchRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class QRViewModelTest {

    private val hiveRepo   = mockk<HiveRepository>()
    private val batchRepo  = mockk<QrBatchRepository>()
    private val tokenStore = mockk<TokenStore>(relaxed = true)

    @Before fun setUp()    { Dispatchers.setMain(UnconfinedTestDispatcher()) }
    @After  fun tearDown() { Dispatchers.resetMain(); clearAllMocks() }

    // ── QRScanViewModel ──────────────────────────────────────────────────────

    @Test
    fun `resolve calls onLinked with hive id when result is Linked`() = runTest {
        coEvery { hiveRepo.resolveQR("token-abc") } returns QRScanResult.Linked(hive())
        val vm = QRScanViewModel(hiveRepo)
        var linkedId = ""

        vm.resolve("token-abc", onLinked = { linkedId = it }, onUnlinked = {})

        assertEquals("h1", linkedId)
        assertFalse(vm.state.value.isLoading)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `resolve calls onUnlinked with token when result is Unlinked`() = runTest {
        coEvery { hiveRepo.resolveQR("new-token") } returns QRScanResult.Unlinked("new-token")
        val vm = QRScanViewModel(hiveRepo)
        var unlinkedToken = ""

        vm.resolve("new-token", onLinked = {}, onUnlinked = { unlinkedToken = it })

        assertEquals("new-token", unlinkedToken)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `resolve failure sets error`() = runTest {
        coEvery { hiveRepo.resolveQR(any()) } throws RuntimeException("Token not found")
        val vm = QRScanViewModel(hiveRepo)

        vm.resolve("bad-token", onLinked = {}, onUnlinked = {})

        assertEquals("Token not found", vm.state.value.error)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `QRScanViewModel clearError removes error from state`() = runTest {
        coEvery { hiveRepo.resolveQR(any()) } throws RuntimeException("err")
        val vm = QRScanViewModel(hiveRepo)
        vm.resolve("x", {}, {})

        vm.clearError()

        assertNull(vm.state.value.error)
    }

    // ── QRBatchListViewModel ─────────────────────────────────────────────────

    @Test
    fun `QRBatchListViewModel init loads batches on construction`() = runTest {
        val batches = listOf(batchSummary("b1"), batchSummary("b2"))
        coEvery { batchRepo.list() } returns batches

        val vm = QRBatchListViewModel(batchRepo)

        assertEquals(batches, vm.state.value.batches)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `QRBatchListViewModel load failure sets error`() = runTest {
        coEvery { batchRepo.list() } throws RuntimeException("Server error")

        val vm = QRBatchListViewModel(batchRepo)

        assertEquals("Server error", vm.state.value.error)
        assertTrue(vm.state.value.batches.isEmpty())
    }

    @Test
    fun `create prepends new batch summary to list`() = runTest {
        val existing = batchSummary("b1")
        coEvery { batchRepo.list() } returns listOf(existing)
        coEvery { batchRepo.create(5) } returns batchOut("b2")
        val vm = QRBatchListViewModel(batchRepo)

        vm.create(5)

        assertEquals("b2", vm.state.value.batches.first().id)
        assertEquals(2, vm.state.value.batches.size)
        assertFalse(vm.state.value.isCreating)
    }

    @Test
    fun `create failure sets error`() = runTest {
        coEvery { batchRepo.list() } returns emptyList()
        coEvery { batchRepo.create(any()) } throws RuntimeException("limit reached")
        val vm = QRBatchListViewModel(batchRepo)

        vm.create(10)

        assertEquals("limit reached", vm.state.value.error)
        assertFalse(vm.state.value.isCreating)
    }

    @Test
    fun `QRBatchListViewModel clearError removes error from state`() = runTest {
        coEvery { batchRepo.list() } throws RuntimeException("err")
        val vm = QRBatchListViewModel(batchRepo)

        vm.clearError()

        assertNull(vm.state.value.error)
    }

    // ── QRBatchDetailViewModel ───────────────────────────────────────────────

    @Test
    fun `QRBatchDetailViewModel init loads batch by id`() = runTest {
        val batch = batchOut("b1")
        coEvery { batchRepo.get("b1") } returns batch
        val vm = QRBatchDetailViewModel(SavedStateHandle(mapOf("batchId" to "b1")), batchRepo, tokenStore)

        assertEquals(batch, vm.state.value.batch)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `QRBatchDetailViewModel load failure sets error`() = runTest {
        coEvery { batchRepo.get("b1") } throws RuntimeException("not found")
        val vm = QRBatchDetailViewModel(SavedStateHandle(mapOf("batchId" to "b1")), batchRepo, tokenStore)

        assertEquals("not found", vm.state.value.error)
        assertNull(vm.state.value.batch)
    }

    @Test
    fun `accessToken reads from token store`() = runTest {
        coEvery { batchRepo.get(any()) } returns batchOut("b1")
        every { tokenStore.accessToken } returns "my-access-token"
        val vm = QRBatchDetailViewModel(SavedStateHandle(mapOf("batchId" to "b1")), batchRepo, tokenStore)

        assertEquals("my-access-token", vm.accessToken)
    }

    @Test
    fun `QRBatchDetailViewModel clearError removes error from state`() = runTest {
        coEvery { batchRepo.get("b1") } throws RuntimeException("err")
        val vm = QRBatchDetailViewModel(SavedStateHandle(mapOf("batchId" to "b1")), batchRepo, tokenStore)

        vm.clearError()

        assertNull(vm.state.value.error)
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private fun hive() = HiveOut(
        id = "h1", qrToken = "token-abc", apiaryId = "a1",
        name = "Hive 1", hiveType = "Langstroth",
        latitude = null, longitude = null,
        acquisitionDate = null, notes = null,
        customFields = emptyMap(),
        initializedAt = "2024-01-01T00:00:00",
        lastInspectionAt = null,
        createdAt = "2024-01-01T00:00:00"
    )

    private fun batchSummary(id: String) = QrBatchSummary(id, 5, "2024-01-01", 0)
    private fun batchOut(id: String)     = QrBatchOut(id, 5, "2024-01-01", emptyList())
}
