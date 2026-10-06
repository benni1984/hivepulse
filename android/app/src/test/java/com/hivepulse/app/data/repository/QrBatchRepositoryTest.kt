package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.*
import io.mockk.*
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class QrBatchRepositoryTest {

    private val api = mockk<ApiService>()
    private lateinit var repo: QrBatchRepository

    @Before fun setUp()    { repo = QrBatchRepository(api) }
    @After  fun tearDown() = clearAllMocks()

    @Test
    fun `list unwraps items from paginated response`() = runTest {
        val batches = listOf(batchSummary("b1"), batchSummary("b2"))
        coEvery { api.listQrBatches(any(), any()) } returns PaginatedResponse(batches, 2, 1, 1)

        val result = repo.list()

        assertEquals(batches, result)
    }

    @Test
    fun `get delegates to api getQrBatch`() = runTest {
        val batch = batchOut("b1")
        coEvery { api.getQrBatch("b1") } returns batch

        val result = repo.get("b1")

        assertEquals(batch, result)
    }

    @Test
    fun `create sends correct count`() = runTest {
        val batch = batchOut("b1")
        coEvery { api.createQrBatch(QrBatchCreate(10)) } returns batch

        val result = repo.create(10)

        assertEquals(batch, result)
        coVerify { api.createQrBatch(QrBatchCreate(10)) }
    }

    @Test
    fun `delete succeeds when the server accepts it`() = runTest {
        coEvery { api.deleteQrBatch("b1") } returns retrofit2.Response.success(Unit)

        repo.delete("b1")

        coVerify { api.deleteQrBatch("b1") }
    }

    @Test
    fun `delete throws in_use on 409`() = runTest {
        val response = mockk<retrofit2.Response<Unit>> {
            every { isSuccessful } returns false
            every { code() } returns 409
        }
        coEvery { api.deleteQrBatch("b1") } returns response

        val ex = runCatching { repo.delete("b1") }.exceptionOrNull()

        assertEquals("in_use", ex?.message)
    }

    @Test
    fun `delete reports any other failure with its code`() = runTest {
        val response = mockk<retrofit2.Response<Unit>> {
            every { isSuccessful } returns false
            every { code() } returns 500
        }
        coEvery { api.deleteQrBatch("b1") } returns response

        val ex = runCatching { repo.delete("b1") }.exceptionOrNull()

        assertEquals("delete_failed_500", ex?.message)
    }

    private fun batchSummary(id: String) = QrBatchSummary(id, 5, "2024-01-01", 0)
    private fun batchOut(id: String)     = QrBatchOut(id, 5, "2024-01-01", emptyList())
}
