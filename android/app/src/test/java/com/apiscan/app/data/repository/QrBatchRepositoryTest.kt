package com.apiscan.app.data.repository

import com.apiscan.app.data.api.*
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

    private fun batchSummary(id: String) = QrBatchSummary(id, 5, "2024-01-01", 0)
    private fun batchOut(id: String)     = QrBatchOut(id, 5, "2024-01-01", emptyList())
}
