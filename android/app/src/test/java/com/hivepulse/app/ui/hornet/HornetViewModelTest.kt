package com.hivepulse.app.ui.hornet

import com.hivepulse.app.data.api.*
import com.hivepulse.app.data.repository.HornetRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class HornetViewModelTest {

    private val repo = mockk<HornetRepository>()
    private lateinit var vm: HornetViewModel

    private fun stats() = HornetStats(42, 7, 2, 3, 5, 4)
    private fun trap(code: String = "ABCD1234") = com.hivepulse.app.data.api.HornetTrapOut(
        id = "t-1", accessCode = code, name = "Garden trap",
        latitude = 48.85, longitude = 2.35, notes = null, ownerName = null,
        createdAt = "2026-05-01T10:00:00", totalCaught = 7,
        catches = listOf(
            com.hivepulse.app.data.api.HornetTrapCatchOut("c-1", "t-1", 4, "2026-05-10", "2026-05-10T12:00:00"),
            com.hivepulse.app.data.api.HornetTrapCatchOut("c-2", "t-1", 3, "2026-05-11", "2026-05-11T12:00:00")
        )
    )
    private fun nearby() = com.hivepulse.app.data.api.HornetTrapNearbyOut(
        accessCode = "ABCD1234", name = "Garden trap",
        latitude = 48.85, longitude = 2.35, distanceM = 15, totalCaught = 7
    )
    private fun nestGeoJSON() = HornetNestGeoJSON(
        "FeatureCollection", listOf(
            HornetNestFeature(
                "Feature",
                HornetNestGeometry("Point", listOf(2.35, 48.85)),
                HornetNestProperties("n-1", "found", null, null, null, "2026-05-01")
            )
        )
    )
    private fun sighting(id: String = "s-1") = HornetSightingOut(
        id = id, photoUrl = "https://example.com/s.jpg",
        description = null, reporterName = null,
        status = "pending", yesVotes = 0, noVotes = 0,
        createdAt = "2026-05-01T10:00:00", latitude = null, longitude = null
    )
    private fun paginated(items: List<HornetSightingOut>, page: Int = 1, pages: Int = 1) =
        PaginatedResponse(items, items.size, page, pages)

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        vm = HornetViewModel(repo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    // MARK: - loadStats

    @Test
    fun `loadStats populates stats`() = runTest {
        coEvery { repo.getStats() } returns stats()
        vm.loadStats()
        assertEquals(42, vm.state.value.stats?.totalCaught)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `loadStats failure sets error`() = runTest {
        coEvery { repo.getStats() } throws RuntimeException("Stats failed")
        vm.loadStats()
        assertNull(vm.state.value.stats)
        assertEquals("Stats failed", vm.state.value.error)
    }

    // MARK: - loadNests

    @Test
    fun `loadNests populates nests`() = runTest {
        coEvery { repo.getNests() } returns nestGeoJSON()
        vm.loadNests()
        assertNotNull(vm.state.value.nests)
        assertEquals(1, vm.state.value.nests!!.features.size)
    }

    @Test
    fun `loadNests failure sets error`() = runTest {
        coEvery { repo.getNests() } throws RuntimeException("Nests failed")
        vm.loadNests()
        assertNull(vm.state.value.nests)
        assertEquals("Nests failed", vm.state.value.error)
    }

    // MARK: - loadSightings

    @Test
    fun `loadSightings page1 sets sightings`() = runTest {
        coEvery { repo.getSightings(1) } returns paginated(listOf(sighting()))
        vm.loadSightings(1)
        assertEquals(1, vm.state.value.sightings.size)
        assertEquals("s-1", vm.state.value.sightings[0].id)
    }

    @Test
    fun `loadSightings page2 appends sightings`() = runTest {
        val s1 = sighting("s-1")
        val s2 = sighting("s-2")
        coEvery { repo.getSightings(1) } returns paginated(listOf(s1), 1, 2)
        coEvery { repo.getSightings(2) } returns paginated(listOf(s2), 2, 2)
        vm.loadSightings(1)
        vm.loadSightings(2)
        assertEquals(2, vm.state.value.sightings.size)
    }

    @Test
    fun `loadSightings failure sets error`() = runTest {
        coEvery { repo.getSightings(any()) } throws RuntimeException("Sightings failed")
        vm.loadSightings()
        assertEquals("Sightings failed", vm.state.value.error)
    }

    // MARK: - submitCatch

    @Test
    fun `submitCatch calls onSuccess on success`() = runTest {
        coEvery { repo.submitCatch(3, null, null, null) } returns
            HornetCatchOut("c-1", 3, null, null, "2026-05-01")
        var called = false
        vm.submitCatch(3, onSuccess = { called = true })
        assertTrue(called)
    }

    @Test
    fun `submitCatch failure sets error`() = runTest {
        coEvery { repo.submitCatch(any(), any(), any(), any()) } throws RuntimeException("Submit failed")
        vm.submitCatch(1)
        assertEquals("Submit failed", vm.state.value.error)
    }

    // MARK: - submitNest

    @Test
    fun `submitNest calls onSuccess on success`() = runTest {
        coEvery { repo.submitNest(48.85, 2.35, null, null, null) } returns
            HornetNestOut("n-new", 48.85, 2.35, "found", null, null, null, "2026-05-01", "2026-05-01")
        var called = false
        vm.submitNest(48.85, 2.35, onSuccess = { called = true })
        assertTrue(called)
    }

    // MARK: - submitSighting

    @Test
    fun `submitSighting prepends sighting to list`() = runTest {
        val existing = sighting("s-existing")
        coEvery { repo.getSightings(1) } returns paginated(listOf(existing))
        vm.loadSightings(1)
        val newSighting = sighting("s-new")
        coEvery { repo.submitSighting(any(), any(), any(), any(), any()) } returns newSighting
        vm.submitSighting("https://example.com/x.jpg")
        assertEquals("s-new", vm.state.value.sightings[0].id)
        assertEquals(2, vm.state.value.sightings.size)
    }

    // MARK: - vote

    @Test
    fun `vote reloads sightings on success`() = runTest {
        coEvery { repo.vote("s-1", "yes") } just runs
        coEvery { repo.getSightings(1) } returns paginated(listOf(sighting()))
        vm.vote("s-1", "yes")
        assertEquals(1, vm.state.value.sightings.size)
    }

    @Test
    fun `vote failure sets error`() = runTest {
        coEvery { repo.vote(any(), any()) } throws RuntimeException("Vote failed")
        vm.vote("s-1", "yes")
        assertEquals("Vote failed", vm.state.value.error)
    }

    // MARK: - clearError

    @Test
    fun `clearError removes error from state`() = runTest {
        coEvery { repo.getStats() } throws RuntimeException("err")
        vm.loadStats()
        assertNotNull(vm.state.value.error)
        vm.clearError()
        assertNull(vm.state.value.error)
    }

    // MARK: - loadNearbyTraps

    @Test
    fun `loadNearbyTraps populates nearbyTraps`() = runTest {
        coEvery { repo.getNearbyTraps(48.85, 2.35, 50) } returns listOf(nearby())
        vm.loadNearbyTraps(48.85, 2.35)
        assertEquals(1, vm.state.value.nearbyTraps.size)
        assertEquals("ABCD1234", vm.state.value.nearbyTraps[0].accessCode)
        assertNull(vm.state.value.trapError)
        assertFalse(vm.state.value.trapLoading)
    }

    @Test
    fun `loadNearbyTraps failure sets trapError`() = runTest {
        coEvery { repo.getNearbyTraps(any(), any(), any()) } throws RuntimeException("GPS failed")
        vm.loadNearbyTraps(0.0, 0.0)
        assertTrue(vm.state.value.nearbyTraps.isEmpty())
        assertEquals("GPS failed", vm.state.value.trapError)
    }

    // MARK: - loadTrap

    @Test
    fun `loadTrap sets currentTrap`() = runTest {
        coEvery { repo.getTrap("ABCD1234") } returns trap()
        vm.loadTrap("ABCD1234")
        assertNotNull(vm.state.value.currentTrap)
        assertEquals("ABCD1234", vm.state.value.currentTrap!!.accessCode)
        assertEquals(7, vm.state.value.currentTrap!!.totalCaught)
        assertNull(vm.state.value.trapError)
    }

    @Test
    fun `loadTrap failure sets trapError`() = runTest {
        coEvery { repo.getTrap(any()) } throws RuntimeException("Not found")
        vm.loadTrap("XXXXXXXX")
        assertNull(vm.state.value.currentTrap)
        assertEquals("Not found", vm.state.value.trapError)
    }

    // MARK: - createTrap

    @Test
    fun `createTrap calls onSuccess with created trap`() = runTest {
        coEvery { repo.createTrap("Garden trap", 48.85, 2.35, null, null) } returns trap()
        var received: com.hivepulse.app.data.api.HornetTrapOut? = null
        vm.createTrap("Garden trap", 48.85, 2.35, onSuccess = { received = it })
        assertNotNull(received)
        assertEquals("ABCD1234", received!!.accessCode)
        assertNotNull(vm.state.value.trapSuccess)
    }

    @Test
    fun `createTrap failure sets trapError`() = runTest {
        coEvery { repo.createTrap(any(), any(), any(), any(), any()) } throws RuntimeException("Create failed")
        vm.createTrap("", 0.0, 0.0)
        assertNull(vm.state.value.trapSuccess)
        assertEquals("Create failed", vm.state.value.trapError)
    }

    // MARK: - addTrapCatch

    @Test
    fun `addTrapCatch sets trapSuccess and refreshes trap`() = runTest {
        val catchOut = com.hivepulse.app.data.api.HornetTrapCatchOut("c-new", "t-1", 5, "2026-05-15", "2026-05-15T12:00:00")
        coEvery { repo.addTrapCatch("ABCD1234", 5, "2026-05-15") } returns catchOut
        coEvery { repo.getTrap("ABCD1234") } returns trap()
        vm.addTrapCatch("ABCD1234", 5, "2026-05-15")
        assertNotNull(vm.state.value.trapSuccess)
        assertNull(vm.state.value.trapError)
        // currentTrap refreshed from getTrap
        assertNotNull(vm.state.value.currentTrap)
    }

    @Test
    fun `addTrapCatch failure sets trapError`() = runTest {
        coEvery { repo.addTrapCatch(any(), any(), any()) } throws RuntimeException("Catch failed")
        vm.addTrapCatch("ABCD1234", 1, "2026-05-15")
        assertEquals("Catch failed", vm.state.value.trapError)
    }

    // MARK: - clearTrapState

    @Test
    fun `clearTrapState resets trap state`() = runTest {
        coEvery { repo.getTrap("ABCD1234") } returns trap()
        vm.loadTrap("ABCD1234")
        assertNotNull(vm.state.value.currentTrap)
        vm.clearTrapState()
        assertNull(vm.state.value.currentTrap)
        assertTrue(vm.state.value.nearbyTraps.isEmpty())
    }
}
