package com.hivepulse.app.ui.sharing

import androidx.lifecycle.SavedStateHandle
import com.hivepulse.app.data.api.IncomingShareOut
import com.hivepulse.app.data.api.ShareOut
import com.hivepulse.app.data.api.ShareTargetOut
import com.hivepulse.app.data.repository.ShareTarget
import com.hivepulse.app.data.repository.SharingRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class SharingViewModelTest {

    private val repo = mockk<SharingRepository>()

    @Before fun setUp()    { Dispatchers.setMain(UnconfinedTestDispatcher()) }
    @After  fun tearDown() { Dispatchers.resetMain(); clearAllMocks() }

    private val target = ShareTargetOut("apiary", "a1", "Garden")
    private fun share(id: String, status: String = "pending") =
        ShareOut(id, "$id@example.com", status, target, if (status == "accepted") "Bob" else null, "2026-01-01T00:00:00", null)

    private fun viewModel(type: String = "apiary", id: String = "a1") =
        SharingViewModel(SavedStateHandle(mapOf("type" to type, "id" to id)), repo)

    // ── Who works on it ──────────────────────────────────────────────────────────────

    @Test
    fun `it lists the collaborators of the apiary it was opened for`() = runTest {
        coEvery { repo.shares(ShareTarget.Apiary("a1")) } returns listOf(share("s1", "accepted"), share("s2"))

        val vm = viewModel()

        assertEquals(listOf("s1", "s2"), vm.state.value.shares.map { it.id })
        assertFalse(vm.isHive)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `opened for a hive it asks about the hive`() = runTest {
        coEvery { repo.shares(ShareTarget.Hive("h1")) } returns emptyList()

        val vm = viewModel(type = "hive", id = "h1")

        assertTrue(vm.isHive)
        coVerify { repo.shares(ShareTarget.Hive("h1")) }
    }

    @Test
    fun `a failed load sets the error`() = runTest {
        coEvery { repo.shares(any()) } throws RuntimeException("down")

        assertEquals("down", viewModel().state.value.error)
    }

    // ── Inviting ────────────────────────────────────────────────────────────────────

    @Test
    fun `invite sends the trimmed address, lists the invitation first and says so`() = runTest {
        coEvery { repo.shares(any()) } returns listOf(share("old"))
        coEvery { repo.invite("carol@example.com", ShareTarget.Apiary("a1")) } returns share("new")
        val vm = viewModel()
        var sent = false

        vm.invite("  carol@example.com ") { sent = true }

        assertTrue(sent)
        assertEquals(listOf("new", "old"), vm.state.value.shares.map { it.id })
        assertTrue(vm.state.value.inviteSent)
        assertFalse(vm.state.value.isInviting)
    }

    @Test
    fun `an obvious typo never reaches the server`() = runTest {
        coEvery { repo.shares(any()) } returns emptyList()
        val vm = viewModel()

        listOf("", "bob", "bob@", "@example.com", "bob@example", "bob@example.", "bo b@example.com")
            .forEach { vm.invite(it) }

        coVerify(exactly = 0) { repo.invite(any(), any()) }
        assertNull(vm.state.value.error)
    }

    @Test
    fun `the servers reason is shown when the invitation is refused`() = runTest {
        coEvery { repo.shares(any()) } returns emptyList()
        coEvery { repo.invite(any(), any()) } throws RuntimeException("This address has already been invited.")
        val vm = viewModel()
        var sent = false

        vm.invite("bob@example.com") { sent = true }

        assertFalse(sent)
        assertEquals("This address has already been invited.", vm.state.value.error)
        assertTrue(vm.state.value.shares.isEmpty())
        assertFalse(vm.state.value.inviteSent)
    }

    @Test
    fun `a new invitation clears the earlier message`() = runTest {
        coEvery { repo.shares(any()) } returns emptyList()
        coEvery { repo.invite(any(), any()) } throws RuntimeException("nope") andThen share("s1")
        val vm = viewModel()
        vm.invite("bob@example.com")

        vm.invite("bob@example.com")

        assertNull(vm.state.value.error)
        assertTrue(vm.state.value.inviteSent)
    }

    @Test
    fun `the address check accepts real addresses`() {
        assertTrue(SharingViewModel.looksLikeAnEmail("bob@example.com"))
        assertTrue(SharingViewModel.looksLikeAnEmail(" bob.smith+bees@mail.example.org "))
    }

    // ── Taking it back ──────────────────────────────────────────────────────────────

    @Test
    fun `remove takes the person out of the list`() = runTest {
        val bob = share("s1", "accepted")
        coEvery { repo.shares(any()) } returns listOf(bob, share("s2"))
        coEvery { repo.remove("s1") } just Runs
        val vm = viewModel()

        vm.remove(bob)

        assertEquals(listOf("s2"), vm.state.value.shares.map { it.id })
    }

    @Test
    fun `a failed remove keeps the person and says so`() = runTest {
        val bob = share("s1", "accepted")
        coEvery { repo.shares(any()) } returns listOf(bob)
        coEvery { repo.remove("s1") } throws RuntimeException("nope")
        val vm = viewModel()

        vm.remove(bob)

        assertEquals(1, vm.state.value.shares.size)
        assertEquals("nope", vm.state.value.error)
    }

    @Test
    fun `clearError removes the error`() = runTest {
        coEvery { repo.shares(any()) } throws RuntimeException("down")
        val vm = viewModel()

        vm.clearError()

        assertNull(vm.state.value.error)
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class InvitationsViewModelTest {

    private val repo = mockk<SharingRepository>()

    @Before fun setUp()    { Dispatchers.setMain(UnconfinedTestDispatcher()) }
    @After  fun tearDown() { Dispatchers.resetMain(); clearAllMocks() }

    private fun invitation(id: String) =
        IncomingShareOut(id, "Alice", ShareTargetOut("apiary", "a1", "Garden"), null, "2026-01-01T00:00:00")

    @Test
    fun `it shows what is waiting`() = runTest {
        coEvery { repo.incoming() } returns listOf(invitation("s1"), invitation("s2"))

        val vm = InvitationsViewModel(repo)

        assertEquals(listOf("s1", "s2"), vm.state.value.invitations.map { it.id })
    }

    @Test
    fun `a failed load looks like no invitations, not like an error`() = runTest {
        coEvery { repo.incoming() } throws RuntimeException("down")

        val vm = InvitationsViewModel(repo)

        assertTrue(vm.state.value.invitations.isEmpty())
        assertNull(vm.state.value.error)
    }

    @Test
    fun `accept removes the invitation and tells the caller to reload`() = runTest {
        coEvery { repo.incoming() } returns listOf(invitation("s1"), invitation("s2"))
        coEvery { repo.accept("s1") } just Runs
        val vm = InvitationsViewModel(repo)
        var reloaded = false

        vm.accept(invitation("s1")) { reloaded = true }

        assertTrue(reloaded)
        assertEquals(listOf("s2"), vm.state.value.invitations.map { it.id })
    }

    @Test
    fun `a refused accept keeps the invitation and does not reload`() = runTest {
        coEvery { repo.incoming() } returns listOf(invitation("s1"))
        coEvery { repo.accept("s1") } throws RuntimeException("This invitation does not exist.")
        val vm = InvitationsViewModel(repo)
        var reloaded = false

        vm.accept(invitation("s1")) { reloaded = true }

        assertFalse(reloaded)
        assertEquals(1, vm.state.value.invitations.size)
        assertEquals("This invitation does not exist.", vm.state.value.error)
    }

    @Test
    fun `decline removes the invitation`() = runTest {
        coEvery { repo.incoming() } returns listOf(invitation("s1"))
        coEvery { repo.decline("s1") } just Runs
        val vm = InvitationsViewModel(repo)

        vm.decline(invitation("s1"))

        assertTrue(vm.state.value.invitations.isEmpty())
    }

    private val aToken = "q7Zk2m-XfT9wRb3LpN8sVd1Ye5HcUa0JgIoW4tK6xPE"

    @Test
    fun `redeem accepts a pasted link and tells the caller to reload`() = runTest {
        coEvery { repo.incoming() } returns emptyList()
        coEvery { repo.acceptByToken(aToken) } returns invitation("s-token")
        val vm = InvitationsViewModel(repo)
        var reloaded = false

        vm.redeem("Hi! https://hivepulse.multihead.de/de/dashboard/invitations?token=$aToken") { reloaded = true }

        assertTrue(reloaded)
        assertNull(vm.state.value.error)
        assertFalse(vm.state.value.linkInvalid)
    }

    @Test
    fun `redeem accepts a bare token`() = runTest {
        coEvery { repo.incoming() } returns emptyList()
        coEvery { repo.acceptByToken(aToken) } returns invitation("s-token")
        val vm = InvitationsViewModel(repo)

        vm.redeem("  $aToken  ")

        coVerify { repo.acceptByToken(aToken) }
    }

    @Test
    fun `something that is no link never reaches the server`() = runTest {
        coEvery { repo.incoming() } returns emptyList()
        val vm = InvitationsViewModel(repo)

        listOf("", "hello", "https://example.com/?token=short").forEach { vm.redeem(it) }

        coVerify(exactly = 0) { repo.acceptByToken(any()) }
        assertTrue(vm.state.value.linkInvalid)
    }

    @Test
    fun `a dead link shows the servers reason and does not reload`() = runTest {
        coEvery { repo.incoming() } returns emptyList()
        coEvery { repo.acceptByToken(any()) } throws RuntimeException("This invitation link is no longer valid.")
        val vm = InvitationsViewModel(repo)
        var reloaded = false

        vm.redeem(aToken) { reloaded = true }

        assertFalse(reloaded)
        assertEquals("This invitation link is no longer valid.", vm.state.value.error)
    }

    @Test
    fun `clearError also clears the invalid link notice`() = runTest {
        coEvery { repo.incoming() } returns emptyList()
        val vm = InvitationsViewModel(repo)
        vm.redeem("hello")

        vm.clearError()

        assertFalse(vm.state.value.linkInvalid)
    }

    @Test
    fun `a refused decline keeps the invitation`() = runTest {
        coEvery { repo.incoming() } returns listOf(invitation("s1"))
        coEvery { repo.decline("s1") } throws RuntimeException("nope")
        val vm = InvitationsViewModel(repo)

        vm.decline(invitation("s1"))

        assertEquals(1, vm.state.value.invitations.size)
        assertEquals("nope", vm.state.value.error)
    }
}
