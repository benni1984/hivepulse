package com.hivepulse.app.ui.moves

import androidx.lifecycle.SavedStateHandle
import com.google.gson.Gson
import com.hivepulse.app.data.api.*
import com.hivepulse.app.data.repository.ApiaryRepository
import com.hivepulse.app.data.repository.HiveRepository
import com.hivepulse.app.data.repository.MoveRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response
import java.time.LocalDate

private fun place(name: String, lat: Double?, lon: Double?, id: String? = null) = MovePlaceOut(id, name, lat, lon)

private fun move(
    id: String,
    hive: String = "1",
    movedOn: String = "2026-05-12",
    createdAt: String = "2026-05-12T08:00:00",
    forage: String? = null,
    from: MovePlaceOut = place("Home", 48.1, 8.0),
    to: MovePlaceOut = place("Heath", 48.5, 9.0),
) = HiveMoveOut(id, "h-$hive", "Hive $hive", movedOn, forage, null, from, to, "Alice", createdAt)

private fun apiary(id: String, name: String, access: String? = "owner") =
    ApiaryOut(id, name, null, null, null, null, 0, false, "2026-01-01T00:00:00", access)

private fun hive(id: String, name: String) =
    HiveOut(id, "tok-$id", "a-home", name, "langstroth", null, null, null, null, emptyMap(),
        "2026-01-01T00:00:00", null, "2026-01-01T00:00:00")

// ── The journey on the map ───────────────────────────────────────────────────────────────────

class MoveRoutesTest {

    @Test
    fun `a journey starts where the hive came from and visits every place, oldest first`() {
        val routes = MoveRoutes.build(listOf(
            move("m2", movedOn = "2026-06-14", forage = "fir",
                from = place("Heath", 48.5, 9.0), to = place("Forest", 47.9, 8.1)),
            move("m1", movedOn = "2026-05-12", forage = "acacia"),
        ))

        assertEquals(1, routes.size)
        assertEquals(listOf("Home", "Heath", "Forest"), routes[0].points.map { it.name })
        assertEquals(listOf(0, 1, 2), routes[0].points.map { it.order })
        assertEquals("2026-05-12", routes[0].points[1].date)
        assertEquals("acacia", routes[0].points[1].forage)
        assertNull(routes[0].points[0].date)
    }

    @Test
    fun `each hive gets its own route and colour`() {
        val routes = MoveRoutes.build(listOf(move("a", hive = "1"), move("b", hive = "2")))

        assertEquals(listOf("Hive 1", "Hive 2"), routes.map { it.hiveName })
        assertNotEquals(routes[0].colorIndex, routes[1].colorIndex)
    }

    @Test
    fun `two moves of the same day keep the order they were made in`() {
        val routes = MoveRoutes.build(listOf(
            move("late", createdAt = "2026-05-12T12:00:00", from = place("Heath", 48.5, 9.0), to = place("Lake", 47.9, 8.1)),
            move("early", createdAt = "2026-05-12T08:00:00"),
        ))

        assertEquals(listOf("Home", "Heath", "Lake"), routes[0].points.map { it.name })
    }

    @Test
    fun `a place without a position is skipped but still counts as a stop`() {
        val nowhere = place("Nowhere", null, null)
        val routes = MoveRoutes.build(listOf(
            move("m1", to = nowhere),
            move("m2", movedOn = "2026-06-01", from = nowhere, to = place("Lake", 47.9, 8.1)),
        ))

        // "Stop 2" is still the second move, though stop 1 cannot be drawn.
        assertEquals(listOf("Home", "Lake"), routes[0].points.map { it.name })
        assertEquals(listOf(0, 2), routes[0].points.map { it.order })
    }

    @Test
    fun `no moves give no routes and nothing to draw`() {
        assertTrue(MoveRoutes.build(emptyList()).isEmpty())
        assertFalse(MoveRoutes.hasPositions(emptyList()))
    }

    @Test
    fun `there is nothing to draw when no place has a position`() {
        val nowhere = place("Nowhere", null, null)

        assertFalse(MoveRoutes.hasPositions(MoveRoutes.build(listOf(move("m1", from = nowhere, to = nowhere)))))
        assertTrue(MoveRoutes.hasPositions(MoveRoutes.build(listOf(move("m1")))))
    }
}

class ForageTest {

    @Test
    fun `known keys are recognised and anything else is not`() {
        Forage.keys.forEach { assertTrue(it, Forage.isKnown(it)) }
        assertFalse(Forage.isKnown("Robinie"))
        assertFalse(Forage.isKnown(""))
        assertFalse(Forage.isKnown(null))
    }

    @Test
    fun `every known key has a text and a hand-typed forage has none`() {
        Forage.keys.forEach { assertNotNull(it, Forage.labelRes(it)) }
        assertNull(Forage.labelRes("Robinie"))
    }
}

// ── What goes over the wire ──────────────────────────────────────────────────────────────────

class MoveDtoTest {

    private val gson = Gson()

    @Test
    fun `a move is read as the server sends it`() {
        val parsed = gson.fromJson(
            """{"id":"m","hive_id":"h","hive_name":"Hive 1","moved_on":"2026-06-14","forage":"fir","note":null,
                "from":{"apiary_id":"a","name":"Heath","latitude":48.5,"longitude":9.0},
                "to":{"apiary_id":null,"name":"Forest","latitude":null,"longitude":null},
                "created_by_name":"Alice","created_at":"2026-06-14T08:00:00.123456"}""",
            HiveMoveOut::class.java,
        )

        assertEquals("2026-06-14", parsed.movedOn)
        assertEquals("Heath", parsed.from.name)
        assertEquals(48.5, parsed.from.latitude!!, 0.0)
        assertNull(parsed.to.apiaryId)
        assertNull(parsed.to.latitude)
        assertEquals("fir", parsed.forage)
    }

    @Test
    fun `the request uses the servers names and leaves out what was not chosen`() {
        val json = gson.toJson(MoveCreateRequest(listOf("h-1"), toApiaryId = "a-1", movedOn = "2026-05-12"))

        assertTrue(json.contains("\"hive_ids\":[\"h-1\"]"))
        assertTrue(json.contains("\"to_apiary_id\":\"a-1\""))
        assertTrue(json.contains("\"moved_on\":\"2026-05-12\""))
        assertFalse(json.contains("new_apiary"))
        assertFalse(json.contains("forage"))
    }
}

// ── The repository ───────────────────────────────────────────────────────────────────────────

class MoveRepositoryTest {

    private val api = mockk<ApiService>()
    private val repo = MoveRepository(api)

    @After fun tearDown() = clearAllMocks()

    private fun refused(code: Int, json: String) =
        HttpException(Response.error<Any>(code, json.toResponseBody("application/json".toMediaType())))

    @Test
    fun `move sends the request and returns the result`() = runTest {
        val result = MoveResultOut(2, apiary("a-heath", "Heath"), emptyList())
        val request = MoveCreateRequest(listOf("h-1", "h-2"), toApiaryId = "a-heath")
        coEvery { api.moveHives(request) } returns result

        assertEquals(result, repo.move(request))
    }

    @Test
    fun `a refused move carries the servers own message`() = runTest {
        coEvery { api.moveHives(any()) } throws
            refused(403, """{"detail":{"code":"OWNER_ONLY","message":"Only the owner can do this."}}""")

        val failure = runCatching { repo.move(MoveCreateRequest(listOf("h-1"), toApiaryId = "a")) }.exceptionOrNull()

        assertEquals("Only the owner can do this.", failure?.message)
    }

    @Test
    fun `the history of a hive and the overview are read from their routes`() = runTest {
        coEvery { api.hiveMoves("h-1") } returns listOf(move("m1"))
        coEvery { api.movesOverview("2026-06-01", null) } returns listOf(move("m2"))

        assertEquals("m1", repo.movesFor("h-1").single().id)
        assertEquals("m2", repo.overview("2026-06-01", null).single().id)
    }
}

// ── The view models ──────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalCoroutinesApi::class)
class MoveHivesViewModelTest {

    private val hiveRepo = mockk<HiveRepository>()
    private val apiaryRepo = mockk<ApiaryRepository>()
    private val moveRepo = mockk<MoveRepository>()

    @Before fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { hiveRepo.listForApiary("a-home") } returns listOf(hive("h-1", "Hive 1"), hive("h-2", "Hive 2"))
        coEvery { apiaryRepo.list() } returns listOf(
            apiary("a-home", "Home"), apiary("a-heath", "Heath"), apiary("a-theirs", "Theirs", access = "shared"),
        )
        coEvery { moveRepo.overview(any(), any()) } returns emptyList()
    }

    @After fun tearDown() { Dispatchers.resetMain(); clearAllMocks() }

    private fun viewModel() = MoveHivesViewModel(SavedStateHandle(mapOf("apiaryId" to "a-home")), hiveRepo, apiaryRepo, moveRepo)

    @Test
    fun `the targets are only the callers other apiaries`() = runTest {
        val vm = viewModel()

        assertEquals(listOf("a-heath"), vm.state.value.targets.map { it.id })
        assertEquals(2, vm.state.value.hives.size)
    }

    @Test
    fun `nothing can be sent before hives and a target are chosen`() = runTest {
        val vm = viewModel()
        assertFalse(vm.state.value.canSubmit)

        vm.toggle("h-1")
        assertFalse(vm.state.value.canSubmit)   // still no target

        vm.setTarget("a-heath")
        assertTrue(vm.state.value.canSubmit)
    }

    @Test
    fun `a new place needs a name`() = runTest {
        val vm = viewModel()
        vm.toggle("h-1")
        vm.setTarget(NEW_PLACE)
        assertFalse(vm.state.value.canSubmit)

        vm.setNewName("   ")
        assertFalse(vm.state.value.canSubmit)

        vm.setNewName("Black Forest")
        assertTrue(vm.state.value.canSubmit)
    }

    @Test
    fun `select all selects every hive and again none`() = runTest {
        val vm = viewModel()

        vm.toggleAll()
        assertTrue(vm.state.value.allSelected)
        assertEquals(setOf("h-1", "h-2"), vm.state.value.selected)

        vm.toggleAll()
        assertTrue(vm.state.value.selected.isEmpty())
    }

    @Test
    fun `the request for an existing apiary carries the details`() = runTest {
        val vm = viewModel()
        vm.toggle("h-2")
        vm.setTarget("a-heath")
        vm.setForage("acacia")
        vm.setNote("  early bloom  ")
        vm.setMovedOn("2026-05-12")

        val request = vm.state.value.request()

        assertEquals(listOf("h-2"), request.hiveIds)
        assertEquals("a-heath", request.toApiaryId)
        assertNull(request.newApiary)
        assertEquals("acacia", request.forage)
        assertEquals("early bloom", request.note)
        assertEquals("2026-05-12", request.movedOn)
    }

    @Test
    fun `the request for a new place has no target id and trims what was typed`() = runTest {
        val vm = viewModel()
        vm.toggle("h-1")
        vm.setTarget(NEW_PLACE)
        vm.setNewName(" Black Forest ")
        vm.setNewAddress("  ")

        val request = vm.state.value.request()

        assertNull(request.toApiaryId)
        assertEquals("Black Forest", request.newApiary?.name)
        assertNull(request.newApiary?.address)
    }

    @Test
    fun `a forage typed by hand is sent as written and none is sent as nothing`() = runTest {
        val vm = viewModel()
        assertNull(vm.state.value.forageValue)

        vm.setForage(OTHER_FORAGE)
        vm.setOtherForage("  Robinie ")
        assertEquals("Robinie", vm.state.value.forageValue)

        vm.setOtherForage("  ")
        assertNull(vm.state.value.forageValue)
    }

    @Test
    fun `the date defaults to today`() = runTest {
        assertEquals(LocalDate.now().toString(), viewModel().state.value.movedOn)
    }

    @Test
    fun `submit sends the move and tells the caller`() = runTest {
        val result = MoveResultOut(1, apiary("a-heath", "Heath"), emptyList())
        coEvery { moveRepo.move(any()) } returns result
        val vm = viewModel()
        vm.toggle("h-1")
        vm.setTarget("a-heath")
        var moved: MoveResultOut? = null

        vm.submit { moved = it }

        assertEquals(result, moved)
        assertNull(vm.state.value.error)
        assertFalse(vm.state.value.isSubmitting)
    }

    @Test
    fun `submit does nothing while the form is incomplete`() = runTest {
        val vm = viewModel()

        vm.submit { fail("must not be called") }

        coVerify(exactly = 0) { moveRepo.move(any()) }
    }

    @Test
    fun `a refused move shows the servers reason and keeps the form`() = runTest {
        coEvery { moveRepo.move(any()) } throws RuntimeException("Only the owner can do this.")
        val vm = viewModel()
        vm.toggle("h-1")
        vm.setTarget("a-heath")
        var moved = false

        vm.submit { moved = true }

        assertFalse(moved)
        assertEquals("Only the owner can do this.", vm.state.value.error)
        assertEquals(setOf("h-1"), vm.state.value.selected)
        assertFalse(vm.state.value.isSubmitting)
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class HiveMovesViewModelTest {

    private val repo = mockk<MoveRepository>()

    @Before fun setUp()    { Dispatchers.setMain(UnconfinedTestDispatcher()) }
    @After  fun tearDown() { Dispatchers.resetMain(); clearAllMocks() }

    @Test
    fun `it lists the moves and builds the routes of the hive it was opened for`() = runTest {
        coEvery { repo.movesFor("h-1") } returns listOf(move("m1"))

        val vm = HiveMovesViewModel(SavedStateHandle(mapOf("hiveId" to "h-1")), repo)

        assertEquals(listOf("m1"), vm.state.value.moves.map { it.id })
        assertEquals(1, vm.state.value.routes.size)
        assertTrue(vm.state.value.loaded)
    }

    @Test
    fun `a failed load reads as no moves, not as an error`() = runTest {
        coEvery { repo.movesFor(any()) } throws RuntimeException("down")

        val vm = HiveMovesViewModel(SavedStateHandle(mapOf("hiveId" to "h-1")), repo)

        assertTrue(vm.state.value.moves.isEmpty())
        assertTrue(vm.state.value.loaded)
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class MovesOverviewViewModelTest {

    private val repo = mockk<MoveRepository>()

    @Before fun setUp()    { Dispatchers.setMain(UnconfinedTestDispatcher()) }
    @After  fun tearDown() { Dispatchers.resetMain(); clearAllMocks() }

    @Test
    fun `it asks for everything when no range was chosen`() = runTest {
        coEvery { repo.overview(null, null) } returns listOf(move("m1"), move("m2", hive = "2"))

        val vm = MovesOverviewViewModel(repo)

        assertEquals(2, vm.state.value.routes.size)
        coVerify { repo.overview(null, null) }
    }

    @Test
    fun `the chosen dates limit the request and reload`() = runTest {
        coEvery { repo.overview(any(), any()) } returns emptyList()
        val vm = MovesOverviewViewModel(repo)

        vm.setRange("2026-06-01", "2026-06-30")

        coVerify { repo.overview("2026-06-01", "2026-06-30") }
        assertEquals("2026-06-01", vm.state.value.from)
    }

    @Test
    fun `a failed load shows the message`() = runTest {
        coEvery { repo.overview(any(), any()) } throws RuntimeException("down")

        val vm = MovesOverviewViewModel(repo)

        assertEquals("down", vm.state.value.error)
        assertFalse(vm.state.value.isLoading)
    }
}

// ── Back to where they came from ─────────────────────────────────────────────────────────────

private fun at(id: String?, name: String) = MovePlaceOut(id, name, null, null)

class ReturnSuggestionTest {

    private val places = listOf("a-home" to "Home", "a-forest" to "Forest", "a-heath" to "Heath")

    /** A move into Heath, from Home unless said otherwise. */
    private fun intoHeath(
        id: String, hive: String, movedOn: String = "2026-05-12", createdAt: String = "2026-05-12T08:00:00",
        from: MovePlaceOut = at("a-home", "Home"),
    ) = move(id, hive = hive, movedOn = movedOn, createdAt = createdAt, from = from, to = at("a-heath", "Heath"))

    @Test
    fun `hives go back to their previous place, grouped by that place`() {
        val moves = listOf(
            intoHeath("m1", "1"), intoHeath("m2", "2"), intoHeath("m3", "3", from = at("a-forest", "Forest")),
        )

        val result = MoveRoutes.returnSuggestions(moves, listOf("h-1", "h-2", "h-3"), "a-heath", places)

        assertEquals(
            listOf(ReturnSuggestion("a-home", "Home", listOf("h-1", "h-2")), ReturnSuggestion("a-forest", "Forest", listOf("h-3"))),
            result,
        )
    }

    @Test
    fun `the latest move that brought the hive here decides`() {
        val moves = listOf(
            intoHeath("old", "1", movedOn = "2026-04-01"),
            intoHeath("new", "1", movedOn = "2026-06-01", from = at("a-forest", "Forest")),
        )

        assertEquals(listOf("a-forest"), MoveRoutes.returnSuggestions(moves, listOf("h-1"), "a-heath", places).map { it.apiaryId })
    }

    @Test
    fun `two moves of one day are told apart by when they were made`() {
        val moves = listOf(
            intoHeath("late", "1", createdAt = "2026-05-12T12:00:00", from = at("a-forest", "Forest")),
            intoHeath("early", "1", createdAt = "2026-05-12T08:00:00"),
        )

        assertEquals(listOf("a-forest"), MoveRoutes.returnSuggestions(moves, listOf("h-1"), "a-heath", places).map { it.apiaryId })
    }

    @Test
    fun `hives that did not move here or are not here are left out`() {
        val moves = listOf(intoHeath("m1", "1"), intoHeath("m2", "9"))

        assertEquals(
            listOf(ReturnSuggestion("a-home", "Home", listOf("h-1"))),
            MoveRoutes.returnSuggestions(moves, listOf("h-1", "h-2"), "a-heath", places),
        )
    }

    @Test
    fun `a previous place that is gone or not the callers own is left out`() {
        val gone = intoHeath("m1", "1", from = at(null, "Old place"))
        val foreign = intoHeath("m2", "2", from = at("a-theirs", "Theirs"))

        assertTrue(MoveRoutes.returnSuggestions(listOf(gone, foreign), listOf("h-1", "h-2"), "a-heath", places).isEmpty())
    }

    @Test
    fun `no history offers nothing`() {
        assertTrue(MoveRoutes.returnSuggestions(emptyList(), listOf("h-1"), "a-heath", places).isEmpty())
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class MoveHivesReturnViewModelTest {

    private val hiveRepo = mockk<HiveRepository>()
    private val apiaryRepo = mockk<ApiaryRepository>()
    private val moveRepo = mockk<MoveRepository>()

    @Before fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { hiveRepo.listForApiary("a-heath") } returns listOf(hive("h-1", "Hive 1"), hive("h-2", "Hive 2"))
        coEvery { apiaryRepo.list() } returns listOf(apiary("a-home", "Home"), apiary("a-heath", "Heath"))
    }

    @After fun tearDown() { Dispatchers.resetMain(); clearAllMocks() }

    private fun viewModel() = MoveHivesViewModel(SavedStateHandle(mapOf("apiaryId" to "a-heath")), hiveRepo, apiaryRepo, moveRepo)

    @Test
    fun `the shortcut picks the hives and the place they came from`() = runTest {
        coEvery { moveRepo.overview(any(), any()) } returns listOf(
            move("m1", hive = "1", from = at("a-home", "Home"), to = at("a-heath", "Heath")),
        )
        val vm = viewModel()

        assertEquals(listOf("Home"), vm.state.value.returns.map { it.name })
        vm.sendBack(vm.state.value.returns[0])

        assertEquals(setOf("h-1"), vm.state.value.selected)
        assertEquals("a-home", vm.state.value.target)
        assertTrue(vm.state.value.canSubmit)
        assertEquals(listOf("h-1"), vm.state.value.request().hiveIds)
        assertEquals("a-home", vm.state.value.request().toApiaryId)
    }

    @Test
    fun `without a history the form works as before`() = runTest {
        coEvery { moveRepo.overview(any(), any()) } throws RuntimeException("offline")

        val vm = viewModel()

        assertTrue(vm.state.value.returns.isEmpty())
        assertEquals(listOf("a-home"), vm.state.value.targets.map { it.id })
        assertNull(vm.state.value.error)
    }
}
