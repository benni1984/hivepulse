package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.*
import io.mockk.*
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Response

class HornetRepositoryTest {

    private val api = mockk<ApiService>()
    private lateinit var repo: HornetRepository

    @Before
    fun setUp() { repo = HornetRepository(api) }

    private fun stats() = HornetStats(42, 7, 2, 3, 5)
    private fun nestGeoJSON() = HornetNestGeoJSON(
        type = "FeatureCollection",
        features = listOf(
            HornetNestFeature(
                type = "Feature",
                geometry = HornetNestGeometry("Point", listOf(2.35, 48.85)),
                properties = HornetNestProperties("n-1", "found", null, null, null, "2026-05-01")
            )
        )
    )
    private fun sighting(id: String = "s-1") = HornetSightingOut(
        id = id, photoUrl = "https://example.com/s.jpg",
        description = "Near flowers", reporterName = "Alice",
        status = "pending", yesVotes = 2, noVotes = 1,
        createdAt = "2026-05-01T10:00:00", latitude = 48.85, longitude = 2.35
    )
    private fun paginated(items: List<HornetSightingOut>) = PaginatedResponse(
        items = items, total = items.size, page = 1, pages = 1
    )

    @Test
    fun `getStats returns stats from api`() = runTest {
        coEvery { api.hornetStats() } returns stats()
        val result = repo.getStats()
        assertEquals(42, result.totalCaught)
        assertEquals(7, result.totalNests)
    }

    @Test
    fun `submitCatch delegates to api`() = runTest {
        val out = HornetCatchOut("c-1", 3, null, null, "2026-05-01")
        coEvery { api.submitHornetCatch(any()) } returns out
        val result = repo.submitCatch(3, null, null, null)
        assertEquals("c-1", result.id)
        coVerify { api.submitHornetCatch(HornetCatchCreate(null, null, 3, null)) }
    }

    @Test
    fun `getNests returns GeoJSON`() = runTest {
        coEvery { api.hornetNests() } returns nestGeoJSON()
        val result = repo.getNests()
        assertEquals("FeatureCollection", result.type)
        assertEquals(1, result.features.size)
        assertEquals("found", result.features[0].properties.status)
    }

    @Test
    fun `getSightings passes page param`() = runTest {
        coEvery { api.hornetSightings(page = 2, perPage = 12) } returns paginated(listOf(sighting()))
        val result = repo.getSightings(2)
        assertEquals(1, result.items.size)
        coVerify { api.hornetSightings(page = 2, perPage = 12) }
    }

    @Test
    fun `vote calls api with correct params`() = runTest {
        coEvery { api.voteOnSighting("s-1", any()) } returns Response.success(null)
        repo.vote("s-1", "yes")
        coVerify { api.voteOnSighting("s-1", HornetVoteRequest("yes")) }
    }

    // MARK: - Traps

    private fun trap(code: String = "ABCD1234") = HornetTrapOut(
        id = "t-1", accessCode = code, name = "Garden trap",
        latitude = 48.85, longitude = 2.35, notes = null, ownerName = null,
        createdAt = "2026-05-01T10:00:00", totalCaught = 7, catches = emptyList()
    )

    private fun nearby() = HornetTrapNearbyOut(
        accessCode = "ABCD1234", name = "Garden trap",
        latitude = 48.85, longitude = 2.35, distanceM = 15, totalCaught = 7
    )

    @Test
    fun `createTrap delegates to api and returns trap`() = runTest {
        coEvery { api.createHornetTrap(any()) } returns trap()
        val result = repo.createTrap("Garden trap", 48.85, 2.35)
        assertEquals("ABCD1234", result.accessCode)
        coVerify { api.createHornetTrap(HornetTrapCreate("Garden trap", 48.85, 2.35, null, null)) }
    }

    @Test
    fun `getTrap uppercases access code`() = runTest {
        coEvery { api.getHornetTrap("ABCD1234") } returns trap()
        repo.getTrap("abcd1234")
        coVerify { api.getHornetTrap("ABCD1234") }
    }

    @Test
    fun `addTrapCatch delegates to api with uppercase code`() = runTest {
        val catchOut = HornetTrapCatchOut("c-1", "t-1", 3, "2026-05-10", "2026-05-10T12:00:00")
        coEvery { api.addTrapCatch("ABCD1234", any()) } returns catchOut
        val result = repo.addTrapCatch("abcd1234", 3, "2026-05-10")
        assertEquals(3, result.count)
        coVerify { api.addTrapCatch("ABCD1234", HornetTrapCatchCreate(3, "2026-05-10")) }
    }

    @Test
    fun `getNearbyTraps passes correct params`() = runTest {
        coEvery { api.getNearbyTraps(48.85, 2.35, 50) } returns listOf(nearby())
        val result = repo.getNearbyTraps(48.85, 2.35)
        assertEquals(1, result.size)
        assertEquals(15, result[0].distanceM)
        coVerify { api.getNearbyTraps(48.85, 2.35, 50) }
    }

    @Test
    fun `getTrapsGeoJSON returns feature collection`() = runTest {
        val geoJson = HornetTrapsGeoJSON("FeatureCollection", emptyList())
        coEvery { api.getTrapsGeoJSON() } returns geoJson
        val result = repo.getTrapsGeoJSON()
        assertEquals("FeatureCollection", result.type)
    }
}
