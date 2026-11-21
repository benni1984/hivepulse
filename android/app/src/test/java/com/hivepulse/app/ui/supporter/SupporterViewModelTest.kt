package com.hivepulse.app.ui.supporter

import android.app.Activity
import com.hivepulse.app.data.api.SubscriptionOut
import com.hivepulse.app.data.api.UserOut
import com.hivepulse.app.data.repository.AuthRepository
import com.hivepulse.app.data.repository.PurchaseGateway
import com.hivepulse.app.data.repository.PurchaseOutcome
import com.hivepulse.app.data.repository.SubscriptionRepository
import com.hivepulse.app.data.repository.SupporterOffer
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

/**
 * The paywall's decisions, without a store and without a network.
 *
 * The cases that matter are the ones that cost money or trust: selling to somebody who already
 * paid, treating a dismissed sheet as a failure, and letting a failed request of ours look like a
 * failed payment. The iPhone's `SupporterViewModelTests` covers the same list.
 *
 * Stubs throw `RuntimeException`, never plain `Exception` -- see the MockK rule in CLAUDE.md.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class SupporterViewModelTest {

    private val purchases = mockk<PurchaseGateway>(relaxed = true)
    private val subscriptions = mockk<SubscriptionRepository>()
    private val auth = mockk<AuthRepository>()
    private val activity = mockk<Activity>(relaxed = true)

    private val offer = SupporterOffer("annual", "Yearly", "€19.99")
    private val user = UserOut("u-1", "a@b.com", "Alice", "en", "2026-01-01")

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { auth.getMe() } returns user
        coEvery { subscriptions.mine() } returns SubscriptionOut(status = "none")
        coEvery { subscriptions.sync() } returns SubscriptionOut(status = "active", source = "google")
        every { purchases.canSell } returns true
        coEvery { purchases.offers() } returns listOf(offer)
        coEvery { purchases.buy(any(), any()) } returns PurchaseOutcome.BOUGHT
        coEvery { purchases.restore() } returns false
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    private fun vm() = SupporterViewModel(purchases, subscriptions, auth)

    // ─── What it offers ──────────────────────────────────────────────────────

    @Test
    fun `the account is bound before anything is offered`() {
        // RevenueCat matches purchases on this id. A purchase made while the SDK still holds an
        // anonymous one is a successful payment attached to no account.
        vm()

        coVerify { purchases.identify("u-1") }
    }

    @Test
    fun `somebody who already paid is not sold the same thing again`() {
        // Including a web purchase and an admin grant: is_supporter is derived from all four
        // sources, and the store knows about only one of them.
        coEvery { subscriptions.mine() } returns SubscriptionOut(status = "active", source = "web")

        assertEquals(SupporterScreenState.AlreadySupporter, vm().state.value.screen)
    }

    @Test
    fun `a grace period still counts as paid for`() {
        // The store is retrying a card. Selling a second subscription to somebody whose bank is
        // merely slow would be charging them twice.
        coEvery { subscriptions.mine() } returns SubscriptionOut(status = "grace", source = "google")

        assertEquals(SupporterScreenState.AlreadySupporter, vm().state.value.screen)
    }

    @Test
    fun `a build without a key says so rather than showing nothing`() {
        every { purchases.canSell } returns false

        assertEquals(SupporterScreenState.Unavailable, vm().state.value.screen)
    }

    @Test
    fun `a configured store with no products is the same answer`() {
        // What a deployment looks like before anybody finished the console work.
        coEvery { purchases.offers() } returns emptyList()

        assertEquals(SupporterScreenState.Unavailable, vm().state.value.screen)
    }

    @Test
    fun `being unable to read the account does not block the sale`() {
        // The server is the authority on what is unlocked, not on what the store will charge for.
        coEvery { subscriptions.mine() } throws RuntimeException("no connection")

        assertEquals(SupporterScreenState.Offers(listOf(offer)), vm().state.value.screen)
    }

    @Test
    fun `a store failure is shown with a way back`() {
        coEvery { purchases.offers() } throws RuntimeException("play said no")

        assertEquals(SupporterScreenState.Failed("play said no"), vm().state.value.screen)
    }

    // ─── Buying ──────────────────────────────────────────────────────────────

    @Test
    fun `a dismissed sheet is not an error`() = runTest {
        // Somebody changed their mind. Telling them something went wrong is untrue and stops
        // them trying again.
        coEvery { purchases.buy(any(), any()) } returns PurchaseOutcome.CANCELLED
        val vm = vm()

        vm.buy(activity, offer).join()

        assertNull(vm.state.value.notice)
        assertFalse(vm.state.value.didUnlock)
        assertNull("and the row must not be left spinning", vm.state.value.buying)
        coVerify(exactly = 0) { subscriptions.sync() }
    }

    @Test
    fun `a purchase asks the server to catch up`() = runTest {
        val vm = vm()

        vm.buy(activity, offer).join()

        coVerify(exactly = 1) { subscriptions.sync() }
        assertTrue(vm.state.value.didUnlock)
        assertEquals(SupporterScreenState.AlreadySupporter, vm.state.value.screen)
    }

    @Test
    fun `a failed sync is not a failed purchase`() = runTest {
        // The money is gone and the webhook is on its way. Reporting our own failed request as a
        // failed payment is a lie that costs a support mail -- and a second charge if they
        // believed it and bought again.
        coEvery { subscriptions.sync() } throws RuntimeException("no connection")
        val vm = vm()

        vm.buy(activity, offer).join()

        assertNull(vm.state.value.notice)
        assertTrue(vm.state.value.didUnlock)
        assertEquals(SupporterScreenState.AlreadySupporter, vm.state.value.screen)
    }

    @Test
    fun `a store failure during the purchase is shown`() = runTest {
        coEvery { purchases.buy(any(), any()) } throws RuntimeException("play said no")
        val vm = vm()

        vm.buy(activity, offer).join()

        assertEquals("play said no", vm.state.value.notice)
        assertFalse(vm.state.value.didUnlock)
    }

    // ─── Restoring ───────────────────────────────────────────────────────────

    @Test
    fun `restoring nothing says so and leaves the screen usable`() = runTest {
        coEvery { purchases.restore() } returns false
        val vm = vm()
        val before = vm.state.value.screen

        vm.restore().join()

        assertEquals(SupporterViewModel.NOTHING_RESTORED, vm.state.value.notice)
        assertEquals("the offers must still be there to buy", before, vm.state.value.screen)
        assertFalse(vm.state.value.didUnlock)
    }

    @Test
    fun `restoring a purchase unlocks and syncs`() = runTest {
        // The only way back for somebody who reinstalled or changed phone.
        coEvery { purchases.restore() } returns true
        val vm = vm()

        vm.restore().join()

        coVerify(exactly = 1) { subscriptions.sync() }
        assertTrue(vm.state.value.didUnlock)
        assertEquals(SupporterScreenState.AlreadySupporter, vm.state.value.screen)
    }

    // ─── Managing ────────────────────────────────────────────────────────────

    @Test
    fun `managing hands over to the store`() = runTest {
        // The app cannot cancel a Play subscription and must not appear to.
        val vm = vm()

        vm.manageSubscription(activity).join()

        coVerify { purchases.manageSubscription(activity) }
    }

    @Test
    fun `dismissing the notice clears it`() = runTest {
        val vm = vm()
        vm.restore().join()
        assertNotNull(vm.state.value.notice)

        vm.dismissNotice()

        assertNull(vm.state.value.notice)
    }
}
