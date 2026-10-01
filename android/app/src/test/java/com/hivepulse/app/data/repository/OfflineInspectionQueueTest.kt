package com.hivepulse.app.data.repository

import com.google.gson.Gson
import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.InspectionCreateRequest
import com.hivepulse.app.data.api.InspectionOut
import com.hivepulse.app.data.local.PendingInspection
import com.hivepulse.app.data.local.PendingInspectionDao
import io.mockk.*
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response
import java.io.IOException

/**
 * An inspection recorded at the apiary must never be lost, must never be stored twice,
 * and a rejection from the server must not disappear into the queue.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class OfflineInspectionQueueTest {

    private val api = mockk<ApiService>()
    private val dao = mockk<PendingInspectionDao>(relaxed = true)
    private val gson = Gson()
    private lateinit var queue: OfflineInspectionQueue

    private val request = InspectionCreateRequest(
        date = "2026-04-23", queenSeen = true, queenColor = null, broodFrames = 5,
        honeyFrames = 2, mood = "calm", populationStrength = 3, varroaLevel = 1,
        swarmCellsSeen = false, treatmentApplied = null, feedingDone = false,
        feedingType = null, weightKg = null, notes = "Ruhig",
    )

    private fun saved(id: String = "i1", clientId: String? = null) = InspectionOut(
        id = id, hiveId = "h1", date = "2026-04-23", queenSeen = true, queenColor = null,
        broodFrames = 5, honeyFrames = 2, mood = "calm", populationStrength = 3,
        varroaLevel = 1, varroaCount = null, swarmCellsSeen = false, treatmentApplied = null,
        feedingDone = false, feedingType = null, weightKg = null, notes = "Ruhig",
        customFields = emptyMap(), clientId = clientId, createdAt = "2026-04-23T10:00:00",
    )

    @Before
    fun setUp() {
        queue = OfflineInspectionQueue(api, dao, gson)
    }

    @After
    fun tearDown() = clearAllMocks()

    @Test
    fun `online save reaches the server and leaves nothing queued`() = runTest {
        val sent = slot<InspectionCreateRequest>()
        coEvery { api.createInspection("h1", capture(sent)) } returns saved()

        val result = queue.submit("h1", request)

        assertEquals("i1", result.id)
        assertFalse(result.isPending())
        assertNotNull("a client_id is always sent", sent.captured.clientId)
        coVerify { dao.delete(sent.captured.clientId!!) }
    }

    @Test
    fun `without a connection the visit is queued and returned as pending`() = runTest {
        coEvery { api.createInspection(any(), any()) } throws IOException("no network")
        val stored = slot<PendingInspection>()
        coEvery { dao.put(capture(stored)) } just Runs

        val result = queue.submit("h1", request)

        assertTrue(result.isPending())
        assertEquals("2026-04-23", result.date)
        assertEquals(5, result.broodFrames)
        assertEquals("h1", stored.captured.hiveId)
        coVerify(exactly = 0) { dao.delete(any()) }
    }

    @Test
    fun `a rejection from the server is reported, not queued`() = runTest {
        val http = HttpException(Response.error<Any>(422, okhttp3.ResponseBody.create(null, "bad")))
        coEvery { api.createInspection(any(), any()) } throws http
        val stored = slot<PendingInspection>()
        coEvery { dao.put(capture(stored)) } just Runs

        try {
            queue.submit("h1", request)
            fail("expected the HTTP error to surface")
        } catch (e: HttpException) {
            assertEquals(422, e.code())
        }
        coVerify { dao.delete(stored.captured.clientId) }
    }

    @Test
    fun `flush uploads every queued visit with its original client_id`() = runTest {
        val entries = listOf(
            PendingInspection("c1", "h1", gson.toJson(request.copy(clientId = "c1")), 1L),
            PendingInspection("c2", "h2", gson.toJson(request.copy(clientId = "c2")), 2L),
        )
        coEvery { dao.all() } returns entries
        coEvery { dao.count() } returns 0
        val sent = mutableListOf<InspectionCreateRequest>()
        coEvery { api.createInspection(any(), capture(sent)) } returns saved()

        assertEquals(0, queue.flush())

        assertEquals(listOf("c1", "c2"), sent.map { it.clientId })
        coVerify { dao.delete("c1") }
        coVerify { dao.delete("c2") }
    }

    @Test
    fun `flush stops at the first offline failure and keeps the entry`() = runTest {
        val entries = listOf(
            PendingInspection("c1", "h1", gson.toJson(request.copy(clientId = "c1")), 1L),
            PendingInspection("c2", "h2", gson.toJson(request.copy(clientId = "c2")), 2L),
        )
        coEvery { dao.all() } returns entries
        coEvery { dao.count() } returns 2
        coEvery { api.createInspection(any(), any()) } throws IOException("still offline")

        assertEquals(2, queue.flush())

        coVerify(exactly = 1) { api.createInspection(any(), any()) }
        coVerify { dao.recordFailure("c1", any()) }
        coVerify(exactly = 0) { dao.delete(any()) }
    }

    @Test
    fun `flush drops an entry the server refuses so it cannot block the queue`() = runTest {
        val entry = PendingInspection("c1", "h1", gson.toJson(request.copy(clientId = "c1")), 1L)
        coEvery { dao.all() } returns listOf(entry)
        coEvery { dao.count() } returns 0
        coEvery { api.createInspection(any(), any()) } throws
            HttpException(Response.error<Any>(404, okhttp3.ResponseBody.create(null, "gone")))

        queue.flush()

        coVerify { dao.delete("c1") }
    }

    @Test
    fun `a queued visit shows up in the hive's list`() = runTest {
        coEvery { dao.forHive("h1") } returns listOf(
            PendingInspection("c1", "h1", gson.toJson(request.copy(clientId = "c1")), 1L)
        )
        val pending = queue.pendingForHive("h1")
        assertEquals(1, pending.size)
        assertTrue(pending[0].isPending())
        assertEquals("c1", pending[0].clientId)
    }
}
