package com.hivepulse.app.ui.home

import androidx.lifecycle.SavedStateHandle
import com.google.gson.Gson
import com.hivepulse.app.data.api.*
import com.hivepulse.app.data.repository.HomeRepository
import com.hivepulse.app.data.repository.TreatmentRepository
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

private fun treatment(
    id: String = "t1",
    product: String = "Oxalic acid",
    dueOn: String = "2026-12-01",
    overdue: Boolean? = false,
    doneOn: String? = null,
) = PlannedTreatmentOut(
    id, TreatmentTargetOut("hive", "h1", "Hive 1"), "Garden", product, dueOn, null, doneOn, overdue,
    "Alice", "2026-01-01T00:00:00",
)

private fun summary(hiveCount: Int = 2, treatments: List<PlannedTreatmentOut> = emptyList()) = HomeSummaryOut(
    today = "2026-10-07", inSeason = true, apiaryCount = 1, hiveCount = hiveCount,
    inspections = HomeInspectionsOut(14, 1, 0, emptyList()),
    health = HomeHealthOut(1, 0, 1, 0, emptyList()),
    treatments = HomeTreatmentsOut(treatments.size, 0, treatments),
    ad = null,
)

private fun refused(code: Int, json: String): HttpException =
    HttpException(Response.error<Any>(code, json.toResponseBody("application/json".toMediaType())))

// ── What the server sends ────────────────────────────────────────────────────────────────────

class HomeDtoTest {

    private val gson = Gson()

    @Test
    fun `the summary is read with its nested parts`() {
        val json = """{
          "today":"2026-10-07","in_season":false,"apiary_count":2,"hive_count":5,
          "inspections":{"interval_days":14,"overdue_count":2,"due_soon_count":1,"next":[
            {"hive_id":"h1","hive_name":"Hive 1","apiary_name":"Garden","last_inspection_on":null,
             "due_on":"2026-10-01","overdue_days":6}]},
          "health":{"ok":3,"watch":1,"alert":1,"unknown":0,"attention":[
            {"hive_id":"h2","hive_name":"Hive 2","apiary_name":"Garden","status":"alert","reasons":["varroa_high","swarm_cells"]}]},
          "treatments":{"open_count":1,"overdue_count":0,"upcoming":[
            {"id":"t1","target":{"type":"apiary","id":"a1","name":"Garden"},"apiary_name":null,"product":"Oxalic acid",
             "due_on":"2026-10-20","note":null,"done_on":null,"overdue":false,"created_by_name":"Alice","created_at":"2026-10-01T08:00:00"}]},
          "ad":{"id":"spring","label":"Announcement","title":"Hello","body":"Text","url":null}
        }"""

        val home = gson.fromJson(json, HomeSummaryOut::class.java)

        assertFalse(home.inSeason)
        assertEquals(5, home.hiveCount)
        assertEquals(6, home.inspections.next.single().overdueDays)
        assertNull(home.inspections.next.single().lastInspectionOn)
        assertEquals(listOf("varroa_high", "swarm_cells"), home.health.attention.single().reasons)
        assertEquals("apiary", home.treatments.upcoming.single().target.type)
        assertEquals("Announcement", home.ad?.label)
    }

    @Test
    fun `no announcement is null`() {
        val json = """{"today":"2026-10-07","in_season":true,"apiary_count":0,"hive_count":0,
          "inspections":{"interval_days":14,"overdue_count":0,"due_soon_count":0,"next":[]},
          "health":{"ok":0,"watch":0,"alert":0,"unknown":0,"attention":[]},
          "treatments":{"open_count":0,"overdue_count":0,"upcoming":[]}}"""

        assertNull(gson.fromJson(json, HomeSummaryOut::class.java).ad)
    }

    @Test
    fun `a treatment without the overdue flag is not overdue`() {
        val json = """{"id":"t","target":{"type":"hive","id":"h","name":"H"},"product":"P","due_on":"2026-10-20"}"""

        assertFalse(gson.fromJson(json, PlannedTreatmentOut::class.java).isOverdue)
    }

    @Test
    fun `the request names exactly the target it was given`() {
        val json = Gson().toJson(TreatmentCreateRequest(apiaryId = "a1", product = "P", dueOn = "2026-10-20"))

        assertTrue(json.contains("\"apiary_id\":\"a1\""))
        assertTrue(json.contains("\"due_on\":\"2026-10-20\""))
        assertFalse(json.contains("hive_id"))
    }
}

class FormatDayTest {
    @Test fun `a server day keeps its date whatever the time zone`() {
        val shown = formatDay("2026-05-12")
        assertTrue(shown, shown.contains("12") && shown.contains("2026"))
    }

    @Test fun `a time after the day is ignored`() {
        assertEquals(formatDay("2026-05-12"), formatDay("2026-05-12T23:30:00"))
    }

    @Test fun `nothing and rubbish do not crash`() {
        assertEquals("", formatDay(null))
        assertEquals("", formatDay(""))
        assertEquals("soon", formatDay("soon"))
    }
}

// ── The repositories ─────────────────────────────────────────────────────────────────────────

class TreatmentRepositoryTest {

    private val api = mockk<ApiService>()
    private lateinit var repo: TreatmentRepository

    @Before fun setUp() { repo = TreatmentRepository(api) }
    @After fun tearDown() = clearAllMocks()

    @Test
    fun `open and done ask for their own status and target`() = runTest {
        coEvery { api.treatments("open", "h1", null) } returns listOf(treatment())
        coEvery { api.treatments("done", null, "a1") } returns emptyList()

        assertEquals(1, repo.open(hiveId = "h1").size)
        assertTrue(repo.done(apiaryId = "a1").isEmpty())
    }

    @Test
    fun `marking done sends an empty body so the server uses today`() = runTest {
        val bodies = mutableListOf<Map<String, String>>()
        coEvery { api.markTreatmentDone("t1", capture(bodies)) } returns treatment(doneOn = "2026-10-07")

        repo.markDone("t1")

        assertTrue(bodies.single().isEmpty())
    }

    @Test
    fun `a refusal carries the servers own message`() = runTest {
        coEvery { api.createTreatment(any()) } throws
            refused(403, """{"detail":{"code":"OWNER_ONLY","message":"Only the owner can do this."}}""")

        val error = runCatching { repo.create(TreatmentCreateRequest(apiaryId = "a1", product = "P", dueOn = "2026-10-20")) }
            .exceptionOrNull()

        assertEquals("Only the owner can do this.", error?.message)
    }

    @Test
    fun `delete throws when the server did not answer with success`() = runTest {
        coEvery { api.deleteTreatment("t1") } returns Response.success(Unit)
        repo.delete("t1")

        coEvery { api.deleteTreatment("t2") } returns Response.error(500, "".toResponseBody())
        assertTrue(runCatching { repo.delete("t2") }.isFailure)
    }

    @Test
    fun `reopen and the home summary go to their endpoints`() = runTest {
        coEvery { api.reopenTreatment("t1") } returns treatment()
        coEvery { api.home() } returns summary()

        assertEquals("t1", repo.reopen("t1").id)
        assertEquals(2, HomeRepository(api).home().hiveCount)
    }
}

// ── The view models ──────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalCoroutinesApi::class)
class HomeSummaryViewModelTest {

    private val homeRepo = mockk<HomeRepository>()
    private val treatmentRepo = mockk<TreatmentRepository>()

    @Before fun setUp() { Dispatchers.setMain(UnconfinedTestDispatcher()) }
    @After fun tearDown() { Dispatchers.resetMain(); clearAllMocks() }

    @Test
    fun `the summary is loaded when the screen opens`() = runTest {
        coEvery { homeRepo.home() } returns summary()

        val vm = HomeSummaryViewModel(homeRepo, treatmentRepo)

        assertEquals(2, vm.state.value.home?.hiveCount)
        assertTrue(vm.state.value.isVisible)
    }

    @Test
    fun `somebody without hives is shown nothing`() = runTest {
        coEvery { homeRepo.home() } returns summary(hiveCount = 0)

        assertFalse(HomeSummaryViewModel(homeRepo, treatmentRepo).state.value.isVisible)
    }

    @Test
    fun `a failed load shows no error and keeps what was there`() = runTest {
        coEvery { homeRepo.home() } returns summary() andThenThrows RuntimeException("offline")

        val vm = HomeSummaryViewModel(homeRepo, treatmentRepo)
        vm.load()

        assertNull(vm.state.value.error)
        assertEquals(2, vm.state.value.home?.hiveCount)
    }

    @Test
    fun `marking a treatment done reloads the summary`() = runTest {
        coEvery { homeRepo.home() } returns summary()
        coEvery { treatmentRepo.markDone("t1") } returns treatment(doneOn = "2026-10-07")
        val vm = HomeSummaryViewModel(homeRepo, treatmentRepo)

        vm.markDone(treatment())

        coVerify { treatmentRepo.markDone("t1") }
        coVerify(exactly = 2) { homeRepo.home() }
        assertNull(vm.state.value.error)
    }

    @Test
    fun `a refused mark shows the servers reason`() = runTest {
        coEvery { homeRepo.home() } returns summary()
        coEvery { treatmentRepo.markDone(any()) } throws RuntimeException("Not yours.")
        val vm = HomeSummaryViewModel(homeRepo, treatmentRepo)

        vm.markDone(treatment())

        assertEquals("Not yours.", vm.state.value.error)
        vm.clearError()
        assertNull(vm.state.value.error)
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class TreatmentsViewModelTest {

    private val repo = mockk<TreatmentRepository>()

    @Before fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { repo.open(any(), any()) } returns listOf(treatment())
        coEvery { repo.done(any(), any()) } returns emptyList()
    }
    @After fun tearDown() { Dispatchers.resetMain(); clearAllMocks() }

    private fun hiveVm() = TreatmentsViewModel(SavedStateHandle(mapOf("type" to "hive", "id" to "h1")), repo)
    private fun apiaryVm() = TreatmentsViewModel(SavedStateHandle(mapOf("type" to "apiary", "id" to "a1")), repo)

    @Test
    fun `a hive screen lists the treatments of that hive`() = runTest {
        val vm = hiveVm()

        assertTrue(vm.isHive)
        assertEquals(1, vm.state.value.open.size)
        coVerify { repo.open("h1", null) }
    }

    @Test
    fun `an apiary screen lists the treatments of that apiary`() = runTest {
        val vm = apiaryVm()

        assertFalse(vm.isHive)
        coVerify { repo.open(null, "a1") }
    }

    @Test
    fun `only the last five done treatments are kept`() = runTest {
        coEvery { repo.done(any(), any()) } returns (1..8).map { treatment("d$it", doneOn = "2026-09-0$it") }

        assertEquals(5, hiveVm().state.value.done.size)
    }

    @Test
    fun `the request carries the hive or the apiary and a trimmed product`() = runTest {
        val vm = hiveVm()
        vm.setProduct("  Oxalic acid ")
        vm.setNote("  ")
        vm.setDueOn("2026-12-01")

        assertEquals(TreatmentCreateRequest(hiveId = "h1", product = "Oxalic acid", dueOn = "2026-12-01"), vm.request())

        val apiaryRequest = apiaryVm().request()
        assertEquals("a1", apiaryRequest.apiaryId)
        assertNull(apiaryRequest.hiveId)
    }

    @Test
    fun `nothing is sent without a product`() = runTest {
        val vm = hiveVm()
        vm.setProduct("   ")

        assertFalse(vm.state.value.canPlan)
        vm.plan()
        coVerify(exactly = 0) { repo.create(any()) }
    }

    @Test
    fun `planning sends it, empties the form and reloads`() = runTest {
        coEvery { repo.create(any()) } returns treatment()
        val vm = hiveVm()
        vm.setProduct("Oxalic acid")
        vm.setNote("evening")

        vm.plan()

        coVerify { repo.create(match { it.product == "Oxalic acid" && it.note == "evening" && it.hiveId == "h1" }) }
        assertEquals("", vm.state.value.product)
        assertEquals("", vm.state.value.note)
        assertEquals(LocalDate.now().plusDays(7).toString(), vm.state.value.dueOn)
        assertFalse(vm.state.value.isSaving)
        coVerify(exactly = 2) { repo.open("h1", null) }
    }

    @Test
    fun `a refusal keeps the form and shows the reason`() = runTest {
        coEvery { repo.create(any()) } throws RuntimeException("Only the owner can plan for an apiary.")
        val vm = apiaryVm()
        vm.setProduct("Oxalic acid")

        vm.plan()

        assertEquals("Only the owner can plan for an apiary.", vm.state.value.error)
        assertEquals("Oxalic acid", vm.state.value.product)
        assertFalse(vm.state.value.isSaving)
    }

    @Test
    fun `done, reopen and delete act on the treatment and reload`() = runTest {
        coEvery { repo.markDone("t1") } returns treatment()
        coEvery { repo.reopen("t1") } returns treatment()
        coEvery { repo.delete("t1") } just Runs
        val vm = hiveVm()

        vm.markDone(treatment())
        vm.reopen(treatment())
        vm.delete(treatment())

        coVerifyOrder { repo.markDone("t1"); repo.reopen("t1"); repo.delete("t1") }
        coVerify(exactly = 4) { repo.open("h1", null) }
    }

    @Test
    fun `a failed action shows its reason`() = runTest {
        coEvery { repo.delete(any()) } throws RuntimeException("Gone already.")
        val vm = hiveVm()

        vm.delete(treatment())

        assertEquals("Gone already.", vm.state.value.error)
        vm.clearError()
        assertNull(vm.state.value.error)
    }
}
