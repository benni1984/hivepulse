package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.*
import io.mockk.*
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class StatsRepositoryTest {

    private val api = mockk<ApiService>()
    private lateinit var repo: StatsRepository

    @Before fun setUp()    { repo = StatsRepository(api) }
    @After  fun tearDown() = clearAllMocks()

    @Test
    fun `hiveStats delegates with all parameters`() = runTest {
        val stats = hiveStats()
        coEvery { api.hiveStats("h1", "30d", "2024-01-01", "2024-01-31") } returns stats

        val result = repo.hiveStats("h1", "30d", "2024-01-01", "2024-01-31")

        assertEquals(stats, result)
    }

    @Test
    fun `hiveStats passes null optional params when omitted`() = runTest {
        val stats = hiveStats()
        coEvery { api.hiveStats("h1", null, null, null) } returns stats

        val result = repo.hiveStats("h1")

        assertEquals(stats, result)
    }

    @Test
    fun `apiaryStats delegates with all parameters`() = runTest {
        val stats = apiaryStats()
        coEvery { api.apiaryStats("a1", "30d", "2024-01-01", "2024-01-31") } returns stats

        val result = repo.apiaryStats("a1", "30d", "2024-01-01", "2024-01-31")

        assertEquals(stats, result)
    }

    @Test
    fun `apiaryStats passes null optional params when omitted`() = runTest {
        val stats = apiaryStats()
        coEvery { api.apiaryStats("a1", null, null, null) } returns stats

        val result = repo.apiaryStats("a1")

        assertEquals(stats, result)
    }

    private fun period() = StatsPeriod("2024-01-01", "2024-01-31", "30d")

    private fun hiveStats() = HiveStats(
        hiveId = "h1", period = period(),
        inspectionCount = 3, daysSinceLastInspection = 5,
        queenSeenRate = 0.8,
        moodDistribution = mapOf("calm" to 2, "nervous" to 1),
        swarmCellsCount = 0,
        varroaTrend = emptyList(), broodFramesTrend = emptyList(),
        honeyFramesTrend = emptyList(), populationStrengthTrend = emptyList(),
        weightTrend = emptyList()
    )

    private fun apiaryStats() = ApiaryStats(
        apiaryId = "a1", period = period(),
        hiveCount = 3, inspectionsTotal = 9,
        hivesInspectedLast30d = 2, hivesNotInspected30d = 1,
        averageVarroa = 2.5, averageBroodFrames = 4.0, averageHoneyFrames = 2.0,
        moodDistribution = mapOf("calm" to 6),
        swarmAlerts = 0
    )
}
