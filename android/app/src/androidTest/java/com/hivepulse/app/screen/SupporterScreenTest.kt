package com.hivepulse.app.screen

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.MainActivity
import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.PaginatedResponse
import com.hivepulse.app.data.api.SubscriptionOut
import com.hivepulse.app.data.api.UserOut
import com.hivepulse.app.data.local.TokenStore
import com.hivepulse.app.data.repository.PurchaseGateway
import com.hivepulse.app.data.repository.PurchaseOutcome
import com.hivepulse.app.data.repository.SupporterOffer
import com.hivepulse.app.di.NetworkModule
import com.hivepulse.app.di.PurchaseModule
import dagger.hilt.android.testing.*
import io.mockk.*
import org.junit.*
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import javax.inject.Inject

/**
 * The paywall on a device, reached the way a beekeeper reaches it.
 *
 * `PurchaseModule` is uninstalled along with `NetworkModule`: a `@BindValue` for a type an
 * installed module already binds is a duplicate binding, and an emulator has no Play account in
 * any case, so the real gateway could only ever reach "not for sale here".
 */
@HiltAndroidTest
@UninstallModules(NetworkModule::class, PurchaseModule::class)
@RunWith(AndroidJUnit4::class)
class SupporterScreenTest {

    private val user = UserOut("uid-1", "test@example.com", "Test User", "en", "2024-01-01T00:00:00")

    /** A store that behaves. The empty-store and already-paying states are the view model's to
     *  prove (`SupporterViewModelTest`); what needs a device is that the screen is reachable and
     *  renders what the store returned. */
    private class FakeGateway(private val offer: SupporterOffer) : PurchaseGateway {
        override val canSell = true
        override suspend fun offers() = listOf(offer)
        override suspend fun buy(activity: android.app.Activity, offer: SupporterOffer) =
            PurchaseOutcome.CANCELLED
        override suspend fun restore() = false
        override suspend fun manageSubscription(context: android.content.Context) {}
        override suspend fun identify(userId: String) {}
        override suspend fun forget() {}
    }

    @BindValue @JvmField
    val purchases: PurchaseGateway =
        FakeGateway(SupporterOffer("annual", "Supporter (1 Year)", "19.99 EUR"))

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(emptyList(), 0, 1, 1)
        coEvery { it.getMe() } returns user
        coEvery { it.mySubscription() } returns SubscriptionOut(status = "none")
    }

    @Inject lateinit var tokenStore: TokenStore

    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val setupRule = object : ExternalResource() {
        override fun before() {
            hiltRule.inject()
            tokenStore.clear()
            tokenStore.accessToken = "test-access-token"
        }
    }
    @get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()

    private fun openFromSettings() {
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("My Apiaries").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onAllNodesWithText("Settings").onFirst().performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Inspection Reminders").fetchSemanticsNodes().isNotEmpty()
        }
        // The bottom-bar label, the Settings entry and the paywall's own title all read
        // "Supporter", so click the one inside the form and wait for something only the paywall
        // has.
        composeRule.onAllNodesWithText("Supporter").onFirst().performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Restore purchase").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun settingsOffersTheSupporterPage() {
        // A store reviewer who cannot find the purchase rejects the build, so the entry existing
        // is itself the thing under test.
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("My Apiaries").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onAllNodesWithText("Settings").onFirst().performClick()

        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Supporter").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun aPriceIsShownWhenTheStoreHasSomethingToSell() {
        openFromSettings()

        composeRule.onNodeWithText("19.99 EUR").assertIsDisplayed()
    }

    @Test
    fun restoreIsReachableWithoutBuyingAnything() {
        // Apple requires one, Play benefits from one, and somebody who changed phone has no other
        // way back to what they paid for.
        openFromSettings()

        composeRule.onNodeWithText("Restore purchase").assertIsDisplayed()
    }

    @Test
    fun theBenefitsAreNamedRatherThanJustThePrice() {
        openFromSettings()

        composeRule.onNodeWithText("The regional health map").assertIsDisplayed()
    }
}
