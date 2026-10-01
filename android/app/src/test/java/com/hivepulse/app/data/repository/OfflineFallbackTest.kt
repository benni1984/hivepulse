package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.*
import com.hivepulse.app.data.local.OfflineCache
import io.mockk.*
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.*
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response
import java.io.IOException

/**
 * At the apiary there is often no signal. Reads must then come from the local copy —
 * but only for connection failures: a 404 or an expired session is a real answer and
 * has to keep surfacing as an error instead of showing stale data.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class OfflineFallbackTest {

    private val api = mockk<ApiService>()
    private val cache = mockk<OfflineCache>(relaxed = true)
    private val queue = mockk<OfflineInspectionQueue>(relaxed = true)

    private val apiaryRepo = ApiaryRepository(api, cache)
    private val hiveRepo = HiveRepository(api, cache)
    private val inspectionRepo = InspectionRepository(api, cache, queue)

    private val offline = IOException("no network")
    private fun http(code: Int) =
        HttpException(Response.error<Any>(code, okhttp3.ResponseBody.create(null, "")))

    private fun apiary(id: String) = ApiaryOut(id, "Meadow", null, null, null, null, 2, false, "2026-01-01T00:00:00")
    private fun hive(id: String) = HiveOut(
        id = id, qrToken = "tok-$id", apiaryId = "a1", name = "Hive", hiveType = "langstroth",
        latitude = null, longitude = null, acquisitionDate = null, notes = null,
        customFields = emptyMap(), initializedAt = "2026-01-01T00:00:00",
        lastInspectionAt = null, createdAt = "2026-01-01T00:00:00",
    )
    private fun inspection(id: String) = InspectionOut(
        id, "h1", "2026-04-23", null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, emptyMap(), null, "2026-04-23T10:00:00",
    )

    @After fun tearDown() = clearAllMocks()

    @Test
    fun `apiary list falls back to the cached copy when offline`() = runTest {
        coEvery { api.listApiaries(any(), any()) } throws offline
        coEvery { cache.apiaries() } returns listOf(apiary("a1"))

        assertEquals(listOf(apiary("a1")), apiaryRepo.list())
    }

    @Test
    fun `a successful apiary list refreshes the cache`() = runTest {
        coEvery { api.listApiaries(any(), any()) } returns PaginatedResponse(listOf(apiary("a1")), 1, 1, 1)

        apiaryRepo.list()

        coVerify { cache.putApiaries(listOf(apiary("a1"))) }
    }

    @Test
    fun `a server error is not answered from the cache`() = runTest {
        coEvery { api.listApiaries(any(), any()) } throws http(401)

        try {
            apiaryRepo.list()
            fail("expected the 401 to surface")
        } catch (e: HttpException) {
            assertEquals(401, e.code())
        }
        coVerify(exactly = 0) { cache.apiaries() }
    }

    @Test
    fun `an empty cache rethrows instead of pretending there is nothing`() = runTest {
        coEvery { api.listApiaries(any(), any()) } throws offline
        coEvery { cache.apiaries() } returns emptyList()

        try {
            apiaryRepo.list()
            fail("expected the offline error to surface")
        } catch (e: IOException) {
            assertEquals("no network", e.message)
        }
    }

    @Test
    fun `hives of an apiary come from the cache when offline`() = runTest {
        coEvery { api.listHives("a1", any(), any()) } throws offline
        coEvery { cache.hivesForApiary("a1") } returns listOf(hive("h1"))

        assertEquals(listOf(hive("h1")), hiveRepo.listForApiary("a1"))
    }

    @Test
    fun `a scanned QR code finds its hive offline`() = runTest {
        coEvery { api.resolveQR("tok-h1") } throws offline
        coEvery { cache.hiveByQrToken("tok-h1") } returns hive("h1")

        val result = hiveRepo.resolveQR("tok-h1")

        assertTrue(result is QRScanResult.Linked)
        assertEquals("h1", (result as QRScanResult.Linked).hive.id)
    }

    @Test
    fun `an unknown QR code offline still reports the failure`() = runTest {
        coEvery { api.resolveQR("tok-x") } throws offline
        coEvery { cache.hiveByQrToken("tok-x") } returns null

        try {
            hiveRepo.resolveQR("tok-x")
            fail("expected the offline error to surface")
        } catch (e: IOException) {
            assertEquals("no network", e.message)
        }
    }

    @Test
    fun `the inspection list shows queued visits above the stored ones`() = runTest {
        val pending = inspection("pending:c1").copy(id = "${PENDING_ID_PREFIX}c1")
        coEvery { queue.pendingForHive("h1") } returns listOf(pending)
        coEvery { api.listInspections("h1", 1) } returns
            PaginatedResponse(listOf(inspection("i1")), 1, 1, 1)

        val result = inspectionRepo.list("h1")

        assertEquals(2, result.items.size)
        assertTrue(result.items.first().isPending())
        assertEquals(2, result.total)
    }

    @Test
    fun `offline the inspection list combines queued and cached visits`() = runTest {
        coEvery { queue.pendingForHive("h1") } returns listOf(inspection("${PENDING_ID_PREFIX}c1"))
        coEvery { api.listInspections("h1", 1) } throws offline
        coEvery { cache.inspectionsForHive("h1") } returns listOf(inspection("i1"))

        val result = inspectionRepo.list("h1")

        assertEquals(listOf("${PENDING_ID_PREFIX}c1", "i1"), result.items.map { it.id })
    }

    @Test
    fun `custom fields come from the cache so the form stays complete offline`() = runTest {
        val definition = FieldDefinitionOut(
            id = "f1", scope = "user", apiaryId = null, target = "inspection",
            name = "Weather", type = "text", options = emptyList(), required = false, sortOrder = 0,
        )
        coEvery { api.listFieldDefinitions() } throws offline
        coEvery { cache.fieldDefinitions(null) } returns listOf(definition)

        assertEquals(listOf(definition), inspectionRepo.listFieldDefinitions())
    }
}
