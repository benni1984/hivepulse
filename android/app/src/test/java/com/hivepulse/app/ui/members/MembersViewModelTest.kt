package com.hivepulse.app.ui.members

import com.hivepulse.app.data.api.PublicStats
import com.hivepulse.app.data.api.CommunityHeatmap
import com.hivepulse.app.data.api.UserOut
import com.hivepulse.app.data.repository.AuthRepository
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
class MembersViewModelTest {

    private val repo      = mockk<AuthRepository>()
    private val statsRepo = mockk<StatsRepository>()

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { statsRepo.getPublicStats() } returns somePublicStats()
        coEvery { statsRepo.communityHeatmap() } returns someHeatmap()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    @Test
    fun `init loads user on construction`() {
        coEvery { repo.getMe() } returns regularUser()

        val vm = MembersViewModel(repo, statsRepo)

        assertEquals(regularUser(), vm.state.value.user)
        assertFalse(vm.state.value.isLoading)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `init loads public stats on construction`() {
        coEvery { repo.getMe() } returns regularUser()

        val vm = MembersViewModel(repo, statsRepo)

        assertEquals(somePublicStats(), vm.state.value.publicStats)
    }

    @Test
    fun `init failure sets error and no user`() {
        coEvery { repo.getMe() } throws RuntimeException("Unauthorized")

        val vm = MembersViewModel(repo, statsRepo)

        assertEquals("Unauthorized", vm.state.value.error)
        assertNull(vm.state.value.user)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `public stats failure does not set error or block user load`() {
        coEvery { repo.getMe() } returns regularUser()
        coEvery { statsRepo.getPublicStats() } throws RuntimeException("network error")

        val vm = MembersViewModel(repo, statsRepo)

        assertEquals(regularUser(), vm.state.value.user)
        assertNull(vm.state.value.publicStats)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `regular user is not unlocked`() {
        coEvery { repo.getMe() } returns regularUser()

        val vm = MembersViewModel(repo, statsRepo)
        val user = vm.state.value.user

        assertFalse(user?.isSupporter == true || user?.isAdmin == true)
    }

    @Test
    fun `supporter user is unlocked`() {
        coEvery { repo.getMe() } returns supporterUser()

        val vm = MembersViewModel(repo, statsRepo)
        val user = vm.state.value.user

        assertTrue(user?.isSupporter == true || user?.isAdmin == true)
    }

    @Test
    fun `admin user is unlocked`() {
        coEvery { repo.getMe() } returns adminUser()

        val vm = MembersViewModel(repo, statsRepo)
        val user = vm.state.value.user

        assertTrue(user?.isSupporter == true || user?.isAdmin == true)
    }

    @Test
    fun `supporter loads community heatmap`() {
        coEvery { repo.getMe() } returns supporterUser()

        val vm = MembersViewModel(repo, statsRepo)

        assertEquals(someHeatmap(), vm.state.value.heatmap)
    }

    @Test
    fun `regular user never requests community heatmap`() {
        coEvery { repo.getMe() } returns regularUser()

        val vm = MembersViewModel(repo, statsRepo)

        assertNull(vm.state.value.heatmap)
        coVerify(exactly = 0) { statsRepo.communityHeatmap() }
    }

    @Test
    fun `heatmap failure is silent`() {
        coEvery { repo.getMe() } returns adminUser()
        coEvery { statsRepo.communityHeatmap() } throws RuntimeException("403")

        val vm = MembersViewModel(repo, statsRepo)

        assertNull(vm.state.value.heatmap)
        assertNull(vm.state.value.error)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `selectOverlay switches the heatmap overlay`() {
        coEvery { repo.getMe() } returns supporterUser()
        val vm = MembersViewModel(repo, statsRepo)
        assertEquals(HeatmapOverlay.VARROA, vm.state.value.overlay)

        vm.selectOverlay(HeatmapOverlay.SWARM)

        assertEquals(HeatmapOverlay.SWARM, vm.state.value.overlay)
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private fun regularUser()   = UserOut("u1", "a@b.com", "Alice", "en", "2024-01-01",
                                          isAdmin = false, isSupporter = false)
    private fun supporterUser() = UserOut("u2", "b@b.com", "Bob",   "en", "2024-01-01",
                                          isAdmin = false, isSupporter = true)
    private fun adminUser()     = UserOut("u3", "c@b.com", "Carol", "en", "2024-01-01",
                                          isAdmin = true,  isSupporter = false)

    private fun somePublicStats() = PublicStats(
        avgVarroaCount            = 2.8,
        moodDistribution          = mapOf("calm" to 410, "nervous" to 89, "aggressive" to 23),
        avgBroodFrames            = 5.2,
        avgInspectionIntervalDays = 14.3,
        apiaryCount               = 12,
        hiveCount                 = 87,
        inspectionCount           = 634
    )

    private fun someHeatmap() = CommunityHeatmap("FeatureCollection", emptyList())
}
