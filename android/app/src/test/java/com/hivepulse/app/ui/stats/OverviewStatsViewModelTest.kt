package com.hivepulse.app.ui.stats

import com.hivepulse.app.data.api.ApiaryStatsSummary
import com.hivepulse.app.data.api.OverviewStats
import com.hivepulse.app.data.api.StatsPeriod
import com.hivepulse.app.data.repository.StatsRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class OverviewStatsViewModelTest {

    private val repo = mockk<StatsRepository>()

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { repo.overviewStats("365d") } returns overview("365d")
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    @Test
    fun `init loads last year by default`() {
        val vm = OverviewStatsViewModel(repo)

        assertEquals(overview("365d"), vm.state.value.stats)
        assertEquals("365d", vm.state.value.preset)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `load with preset refetches and remembers the selection`() = runTest {
        coEvery { repo.overviewStats("30d") } returns overview("30d")
        val vm = OverviewStatsViewModel(repo)

        vm.load("30d")

        assertEquals("30d", vm.state.value.preset)
        assertEquals("30d", vm.state.value.stats?.period?.preset)
        coVerify { repo.overviewStats("30d") }
    }

    @Test
    fun `load failure sets error and keeps previous stats`() = runTest {
        coEvery { repo.overviewStats("all") } throws RuntimeException("network")
        val vm = OverviewStatsViewModel(repo)

        vm.load("all")

        assertEquals("network", vm.state.value.error)
        assertEquals(overview("365d"), vm.state.value.stats)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `clearError removes error`() = runTest {
        coEvery { repo.overviewStats("all") } throws RuntimeException("network")
        val vm = OverviewStatsViewModel(repo)
        vm.load("all")

        vm.clearError()

        assertNull(vm.state.value.error)
    }

    private fun overview(preset: String) = OverviewStats(
        period = StatsPeriod("2025-01-01", "2025-12-31", preset),
        apiaryCount = 2, hiveCount = 7, inspectionsTotal = 31,
        perApiary = listOf(
            ApiaryStatsSummary("a1", "Home Yard", 4, 20),
            ApiaryStatsSummary("a2", "Forest", 3, 11)
        )
    )
}
