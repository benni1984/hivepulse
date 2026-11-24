package com.hivepulse.app.screen

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.MainActivity
import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.ApiaryOut
import com.hivepulse.app.data.api.PaginatedResponse
import com.hivepulse.app.data.api.UserOut
import com.hivepulse.app.data.local.OnboardingStore
import com.hivepulse.app.data.local.TokenStore
import com.hivepulse.app.di.NetworkModule
import dagger.hilt.android.testing.BindValue
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import dagger.hilt.android.testing.UninstallModules
import io.mockk.coEvery
import io.mockk.mockk
import org.junit.Rule
import org.junit.Test
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import javax.inject.Inject

/**
 * The tour points at the real button and waits for the real tap (#449).
 *
 * The old carousel had a test of its own that swiped through six screens and pressed "Get
 * started". There is nothing to swipe any more, so what this asserts instead is the thing the
 * issue is about: that starting a tour from the list in Settings lands on the screen the first
 * step lives on, lights a real control there, and advances when that control is actually tapped.
 *
 * The arithmetic — which anchor, in what order, in five languages — is `ToursTest` and needs no
 * emulator.
 */
@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class TourScreenTest {

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(
            listOf(ApiaryOut("id-1", "Honey Farm", null, null, null, null, 3, false, "2024-01-01T00:00:00")),
            1, 1, 1,
        )
        coEvery { it.getMe() } returns
            UserOut("uid-1", "test@example.com", "Test User", "en", "2024-01-01T00:00:00")
    }

    @Inject lateinit var tokenStore: TokenStore
    @Inject lateinit var onboardingStore: OnboardingStore

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val setup = object : ExternalResource() {
        override fun before() {
            hiltRule.inject()
            tokenStore.clear()
            tokenStore.accessToken = "test-access-token"
            // Already signed in once, so the app opens on the apiary list rather than starting
            // first-steps by itself — this test starts a tour deliberately.
            onboardingStore.hasSeenGuidedTour = true
            onboardingStore.hasAskedForFeedback = true
            onboardingStore.finishedTours = emptySet()
        }
    }

    @get:Rule(order = 2)
    val composeRule = createAndroidComposeRule<MainActivity>()

    /** Settings, then the one row that opens the tours — they have a screen of their own. */
    private fun openTheTourList() {
        composeRule.waitUntil(timeoutMillis = 10_000) {
            composeRule.onAllNodesWithText("Settings").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Settings").performClick()
        composeRule.waitUntil(timeoutMillis = 10_000) {
            composeRule.onAllNodesWithTag("guidedToursButton").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithTag("guidedToursButton").performScrollTo().performClick()
        composeRule.waitUntil(timeoutMillis = 10_000) {
            composeRule.onAllNodesWithTag("tourList").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun everyTourIsOfferedInSettings() {
        // The half the carousel could not be: all of them, by name, startable, for ever.
        openTheTourList()
        composeRule.onNodeWithTag("tourList").assertIsDisplayed()
        for (id in listOf("first-steps", "offline", "qr-codes", "hornets", "year")) {
            composeRule.onNodeWithTag("startTour-$id").assertExists()
        }
    }

    @Test
    fun startingATourLightsTheRealControlOnTheRealScreen() {
        openTheTourList()
        composeRule.onNodeWithTag("startTour-first-steps").performClick()

        // It navigates to the apiary list itself: the list in Settings is the one place where
        // every tour starts somewhere else.
        composeRule.waitUntil(timeoutMillis = 10_000) {
            composeRule.onAllNodesWithTag("tourOverlay").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithTag("tourCard").assertIsDisplayed()
    }

    @Test
    fun theRealTapIsWhatMovesTheTourOn() {
        openTheTourList()
        composeRule.onNodeWithTag("startTour-first-steps").performClick()
        // The overlay appears the moment the tour starts, which is *before* the navigation to
        // the apiary list has finished. Waiting for the button itself is what says the screen
        // underneath has arrived.
        // The overlay appears the moment the tour starts, which is *before* the navigation to
        // the apiary list has finished. Waiting for the button itself is what says the screen
        // underneath has arrived.
        //
        // By content description, never by its text: the button sets one with
        // `Modifier.semantics { contentDescription = ... }`, and that *replaces* the text of the
        // merged node. `onNodeWithText` finds it only in the unmerged tree, and the error it
        // gives for that ("Failed to inject touch input") names neither.
        composeRule.waitUntil(timeoutMillis = 10_000) {
            composeRule.onAllNodesWithTag("tourOverlay").fetchSemanticsNodes().isNotEmpty() &&
                composeRule.onAllNodesWithContentDescription("New Apiary")
                    .fetchSemanticsNodes().isNotEmpty()
        }

        // The lit control is the amber create button, and it is still a button: the overlay is
        // drawn around it, not over it, so this tap reaches it and opens the form — and the tour
        // moves to the next step because of that tap, not because of a "next".
        composeRule.onNodeWithContentDescription("New Apiary").performClick()
        composeRule.waitUntil(timeoutMillis = 10_000) {
            composeRule.onAllNodesWithText("Name").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithTag("tourCard").assertIsDisplayed()
    }

    @Test
    fun aTourCanBeLeftAtAnyStep() {
        // Never trap them: every step shows a way out.
        openTheTourList()
        composeRule.onNodeWithTag("startTour-offline").performScrollTo().performClick()
        composeRule.waitUntil(timeoutMillis = 10_000) {
            composeRule.onAllNodesWithTag("tourCard").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithTag("tourStop").performClick()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("tourCard").fetchSemanticsNodes().isEmpty()
        }
    }
}
