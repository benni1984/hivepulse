package com.hivepulse.app.ui.calendar

import com.google.gson.Gson
import com.hivepulse.app.data.api.*
import com.hivepulse.app.data.repository.CalendarRepository
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
import java.util.Locale

private fun entry(
    key: String, start: String, end: String = start, category: String = "care",
    interval: Int? = null, honey: String? = null, active: Boolean = false,
) = CalendarEntryOut(key, category, "Title $key", "Body $key", start, end, interval, honey, active)

private fun region(
    source: String = "default", country: String? = null, postal: String? = null,
    shift: Int = 0, located: Boolean = true, adjust: Int = 0,
) = RegionOut(country, postal, null, null, adjust, shift, source, located)

private fun window(
    entries: List<CalendarEntryOut>, start: String = "2026-09-01", end: String = "2027-01-29",
    today: String = "2026-10-07", region: RegionOut = region(),
) = CalendarOut(region, today, start, end, entries)

// ── The arithmetic ───────────────────────────────────────────────────────────────────────────

class BeekeepingYearArithmeticTest {

    @Test
    fun `days are added across month and year ends`() {
        assertEquals("2026-02-01", BeekeepingYear.addDays("2026-01-31", 1))
        assertEquals("2027-01-01", BeekeepingYear.addDays("2026-12-31", 1))
        assertEquals("2026-02-28", BeekeepingYear.addDays("2026-03-01", -1))
        assertEquals("2026-05-04", BeekeepingYear.addDays("2026-09-01", -120))
    }

    @Test
    fun `the first of this month and of an earlier one`() {
        assertEquals("2026-05-01", BeekeepingYear.firstOfMonth("2026-05-20"))
        assertEquals("2026-04-01", BeekeepingYear.firstOfMonth("2026-05-20", monthsAgo = 1))
        assertEquals("2025-12-01", BeekeepingYear.firstOfMonth("2026-01-20", monthsAgo = 1))
    }

    @Test
    fun `merge keeps each run once, oldest first`() {
        val a = entry("a", "2026-05-01")

        val merged = BeekeepingYear.merge(listOf(a, entry("b", "2026-03-01")), listOf(a, entry("c", "2026-05-01")))

        assertEquals(listOf("b", "a", "c"), merged.map { it.key })
    }

    @Test
    fun `the same task of the next year is a second entry`() {
        val merged = BeekeepingYear.merge(listOf(entry("x", "2026-04-20")), listOf(entry("x", "2027-04-20")))

        assertEquals(listOf("2026-04-20", "2027-04-20"), merged.map { it.start })
    }

    private fun months(items: List<TimelineItem>) = items.filterIsInstance<TimelineItem.Month>().map { it.month }

    private fun order(items: List<TimelineItem>) = items.mapNotNull {
        when (it) {
            is TimelineItem.Month -> null
            is TimelineItem.Today -> "today"
            is TimelineItem.Entry -> it.entry.key
        }
    }

    @Test
    fun `a month header comes before the entries that start in it`() {
        val items = BeekeepingYear.timeline(
            listOf(entry("a", "2026-02-10"), entry("b", "2026-02-20"), entry("c", "2026-03-05")), today = "2026-01-01",
        )

        assertEquals(listOf("2026-01", "2026-02", "2026-03"), months(items))
    }

    @Test
    fun `today lies between what started before and what starts after`() {
        val items = BeekeepingYear.timeline(listOf(entry("before", "2026-05-01"), entry("after", "2026-05-30")), today = "2026-05-15")

        assertEquals(listOf("before", "today", "after"), order(items))
    }

    @Test
    fun `today gets its month when no entry starts in it`() {
        val items = BeekeepingYear.timeline(listOf(entry("april", "2026-04-10"), entry("july", "2026-07-10")), today = "2026-05-20")

        assertEquals(listOf("2026-04", "2026-05", "2026-07"), months(items))
    }

    @Test
    fun `today is at the end when everything started before it`() {
        val items = BeekeepingYear.timeline(listOf(entry("a", "2026-05-01")), today = "2026-05-20")

        assertEquals(TimelineItem.Today, items.last())
    }

    @Test
    fun `today is shown once`() {
        val items = BeekeepingYear.timeline(
            listOf(entry("a", "2026-05-01"), entry("b", "2026-06-01"), entry("c", "2026-07-01")), today = "2026-06-10",
        )

        assertEquals(1, order(items).count { it == "today" })
    }

    @Test
    fun `no entries, no rows`() {
        assertTrue(BeekeepingYear.timeline(emptyList(), "2026-05-20").isEmpty())
    }

    @Test
    fun `countries are unique codes and named in the language`() {
        assertEquals(BeekeepingYear.COUNTRY_CODES.size, BeekeepingYear.COUNTRY_CODES.toSet().size)
        assertTrue(BeekeepingYear.COUNTRY_CODES.all { it.length == 2 })
        for (code in listOf("DE", "AT", "CH", "FR", "ES", "GB", "IT", "BE", "LU")) {
            assertTrue(code, code in BeekeepingYear.COUNTRY_CODES)
        }
        assertEquals("Deutschland", BeekeepingYear.countryName("DE", "de"))
        assertEquals("Germany", BeekeepingYear.countryName("DE", "en"))
    }

    @Test
    fun `an entry's id is its key and its start`() {
        assertEquals("swarm-control|2027-04-20", entry("swarm-control", "2027-04-20").id)
    }

    @Test
    fun `the app language is one the server knows`() {
        assertEquals("de", appLanguage(Locale("de", "AT")))
        assertEquals("en", appLanguage(Locale("pl")))
    }
}

// ── What the server sends ────────────────────────────────────────────────────────────────────

class BeekeepingYearDtoTest {

    private val gson = Gson()

    @Test
    fun `a window is read`() {
        val json = """
        {"region":{"country":"DE","postal_code":"20095","latitude":53.55,"longitude":9.99,"adjust_days":2,"shift_days":15,
                   "source":"postal_code","located":true},
         "today":"2026-10-07","start":"2026-09-01","end":"2027-01-29",
         "entries":[{"key":"swarm-control","category":"swarm","title":"T","body":"B","start":"2027-04-20","end":"2027-06-30",
                     "interval_days":9,"honey":null,"active":false},
                    {"key":"harvest-rapeseed","category":"harvest","title":"T","body":"B","start":"2027-05-15","end":"2027-06-05",
                     "interval_days":null,"honey":"rapeseed","active":true}]}
        """
        val parsed = gson.fromJson(json, CalendarOut::class.java)

        assertEquals(15, parsed.region.shift)
        assertEquals("20095", parsed.region.postalCode)
        assertEquals(9, parsed.entries[0].intervalDays)
        assertNull(parsed.entries[0].honey)
        assertEquals("rapeseed", parsed.entries[1].honey)
        assertTrue(parsed.entries[1].isActive)
        assertTrue(parsed.region.isLocated)
    }

    @Test
    fun `fields a server leaves out are not a crash`() {
        val parsed = gson.fromJson("""{"country":null}""", RegionOut::class.java)

        assertEquals(0, parsed.shift)
        assertTrue("an unknown answer is not 'not found'", parsed.isLocated)
    }

    @Test
    fun `a postal code that was not found is said so`() {
        assertFalse(gson.fromJson("""{"located":false}""", RegionOut::class.java).isLocated)
    }

    @Test
    fun `the region update is sent the way the server reads it`() {
        val json = gson.toJson(RegionUpdateRequest(country = "AT", postalCode = "1010", adjustDays = -3))

        assertTrue(json.contains("\"postal_code\":\"1010\""))
        assertTrue(json.contains("\"adjust_days\":-3"))
        assertFalse(json.contains("postalCode"))
    }
}

// ── The repository ───────────────────────────────────────────────────────────────────────────

class CalendarRepositoryTest {

    private val api = mockk<ApiService>()
    private val repo = CalendarRepository(api)

    @After fun tearDown() = clearAllMocks()

    @Test
    fun `the calendar is asked for by day, length and language`() = runTest {
        coEvery { api.calendar("2026-09-01", 151, "de") } returns window(emptyList())

        assertEquals("2026-10-07", repo.calendar("2026-09-01", 151, "de").today)
    }

    @Test
    fun `a refusal carries the servers own message`() = runTest {
        coEvery { api.updateRegion(any()) } throws HttpException(Response.error<Any>(
            422, """{"detail":{"code":"X","message":"That did not work."}}""".toResponseBody("application/json".toMediaType()),
        ))

        val error = runCatching { repo.updateRegion(RegionUpdateRequest(country = "XX")) }.exceptionOrNull()

        assertEquals("That did not work.", error?.message)
    }
}

// ── The timeline's view model ────────────────────────────────────────────────────────────────

@OptIn(ExperimentalCoroutinesApi::class)
class BeekeepingYearViewModelTest {

    private val repo = mockk<CalendarRepository>()

    @Before fun setUp() { Dispatchers.setMain(UnconfinedTestDispatcher()) }
    @After fun tearDown() { Dispatchers.resetMain(); clearAllMocks() }

    @Test
    fun `the first stretch starts in the month before this one`() = runTest {
        coEvery { repo.calendar(any(), any(), any()) } returns window(listOf(entry("a", "2026-10-01")))

        val vm = BeekeepingYearViewModel(repo)

        val from = slot<String>()
        coVerify { repo.calendar(capture(from), 151, any()) }
        assertTrue(from.captured.matches(Regex("""\d{4}-\d{2}-01""")))
        assertTrue(vm.state.value.isLoaded)
        assertEquals(1, vm.state.value.entries.size)
    }

    @Test
    fun `today is the servers day`() = runTest {
        coEvery { repo.calendar(any(), any(), any()) } returns window(emptyList(), today = "2026-10-08")

        assertEquals("2026-10-08", BeekeepingYearViewModel(repo).state.value.today)
    }

    @Test
    fun `a failed first load says so and loads nothing else`() = runTest {
        coEvery { repo.calendar(any(), any(), any()) } throws RuntimeException("offline")
        val vm = BeekeepingYearViewModel(repo)

        vm.loadLater()
        vm.loadEarlier()

        assertTrue(vm.state.value.failed)
        assertFalse(vm.state.value.isLoaded)
        coVerify(exactly = 1) { repo.calendar(any(), any(), any()) }
    }

    @Test
    fun `the next stretch follows the end of the last and is merged without repeats`() = runTest {
        val a = entry("a", "2026-10-01")
        coEvery { repo.calendar(not("2027-01-30"), any(), any()) } returns window(listOf(a))
        coEvery { repo.calendar("2027-01-30", 120, any()) } returns
            window(listOf(a, entry("b", "2027-02-05")), start = "2027-01-30", end = "2027-05-29")
        val vm = BeekeepingYearViewModel(repo)

        vm.loadLater()

        coVerify { repo.calendar("2027-01-30", 120, any()) }
        assertEquals(listOf("a", "b"), vm.state.value.entries.map { it.key })
        assertEquals("2027-05-29", vm.state.value.loadedTo)
    }

    @Test
    fun `the previous stretch ends where the first begins`() = runTest {
        coEvery { repo.calendar(not("2026-05-04"), any(), any()) } returns window(listOf(entry("b", "2026-10-01")))
        coEvery { repo.calendar("2026-05-04", 120, any()) } returns
            window(listOf(entry("a", "2026-06-10")), start = "2026-05-04", end = "2026-09-01")
        val vm = BeekeepingYearViewModel(repo)

        vm.loadEarlier()

        assertEquals(listOf("a", "b"), vm.state.value.entries.map { it.key })
        assertEquals("2026-05-04", vm.state.value.loadedFrom)
    }

    @Test
    fun `the rows are the timeline of what is loaded`() = runTest {
        coEvery { repo.calendar(any(), any(), any()) } returns window(listOf(entry("a", "2026-10-01"), entry("b", "2026-11-01")))

        val items = BeekeepingYearViewModel(repo).state.value.items

        assertTrue(items.any { it is TimelineItem.Today })
        assertEquals(2, items.count { it is TimelineItem.Entry })
    }
}

// ── The region form's view model ─────────────────────────────────────────────────────────────

@OptIn(ExperimentalCoroutinesApi::class)
class RegionViewModelTest {

    private val repo = mockk<CalendarRepository>()

    @Before fun setUp() { Dispatchers.setMain(UnconfinedTestDispatcher()) }
    @After fun tearDown() { Dispatchers.resetMain(); clearAllMocks() }

    @Test
    fun `the form shows what is stored`() = runTest {
        coEvery { repo.region() } returns region("postal_code", "DE", "20095", shift = 15, adjust = 3)

        val state = RegionViewModel(repo).state.value

        assertEquals("DE", state.country)
        assertEquals("20095", state.postalCode)
        assertEquals(3, state.adjustDays)
        assertTrue(state.isLoaded)
    }

    @Test
    fun `a region that cannot be read hides the form`() = runTest {
        coEvery { repo.region() } throws RuntimeException("offline")

        assertFalse(RegionViewModel(repo).state.value.isLoaded)
    }

    @Test
    fun `saving sends the trimmed postal code and the adjustment within the limits`() = runTest {
        coEvery { repo.region() } returns region()
        val requests = mutableListOf<RegionUpdateRequest>()
        coEvery { repo.updateRegion(capture(requests)) } returns region("postal_code", "AT", "1010", shift = 2)
        val vm = RegionViewModel(repo)
        vm.setCountry("AT")
        vm.setPostalCode("  1010 ")
        vm.setAdjustDays(99)
        var saved: RegionOut? = null

        vm.save { saved = it }

        assertEquals(RegionUpdateRequest("AT", "1010", 28), requests.single())
        assertNotNull(saved)
        assertEquals(RegionMessage.SAVED, vm.state.value.message)
        assertFalse(vm.state.value.isSaving)
    }

    @Test
    fun `a postal code that was not found is said so`() = runTest {
        coEvery { repo.region() } returns region()
        coEvery { repo.updateRegion(any()) } returns region("default", "DE", "00000", located = false)
        val vm = RegionViewModel(repo)

        vm.save()

        assertEquals(RegionMessage.NOT_LOCATED, vm.state.value.message)
    }

    @Test
    fun `a refusal is said so and calls nothing back`() = runTest {
        coEvery { repo.region() } returns region()
        coEvery { repo.updateRegion(any()) } throws RuntimeException("no")
        val vm = RegionViewModel(repo)
        var called = false

        vm.save { called = true }

        assertEquals(RegionMessage.FAILED, vm.state.value.message)
        assertFalse(called)
    }

    @Test
    fun `the adjustment is clamped`() {
        assertEquals(28, RegionViewModel.clamp(99))
        assertEquals(-28, RegionViewModel.clamp(-99))
        assertEquals(5, RegionViewModel.clamp(5))
    }

    @Test
    fun `editing a field clears the old message`() = runTest {
        coEvery { repo.region() } returns region()
        coEvery { repo.updateRegion(any()) } returns region()
        val vm = RegionViewModel(repo)
        vm.save()

        vm.setPostalCode("1")

        assertNull(vm.state.value.message)
    }
}
