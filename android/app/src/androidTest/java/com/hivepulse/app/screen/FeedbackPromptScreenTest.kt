package com.hivepulse.app.screen

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.MainActivity
import com.hivepulse.app.data.api.ApiService
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
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import javax.inject.Inject

/**
 * The card that asks what somebody thinks, on the screen they land on (#546).
 *
 * `FeedbackPromptRuleTest` covers *when* it appears; this covers that it appears at all, and
 * that answering it makes it go away and stay away. Two different failures: a rule nobody draws,
 * and a card nobody can get rid of.
 */
@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class FeedbackPromptScreenTest {

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(emptyList(), 0, 1, 1)
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
            onboardingStore.hasSeenGuidedTour = true
            onboardingStore.hasAskedForFeedback = false
            // Four days ago: past the threshold, and not the exact boundary, so this test is
            // about the card rather than about an off-by-one the rule test already owns.
            onboardingStore.firstLaunchAt =
                System.currentTimeMillis() - 4L * 24 * 60 * 60 * 1000
        }
    }

    @get:Rule(order = 2)
    val composeRule = createAndroidComposeRule<MainActivity>()

    private fun waitForCard() {
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("feedbackPromptCard").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun theCardAsksOnTheApiaryList() {
        waitForCard()

        composeRule.onNodeWithTag("feedbackPromptCard").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithText("How is it going?").assertIsDisplayed()
        composeRule.onNodeWithTag("feedbackPromptSend").assertIsDisplayed()
    }

    @Test
    fun sayingNoThanksEndsItForGood() {
        waitForCard()

        composeRule.onNodeWithTag("feedbackPromptDismiss").performScrollTo().performClick()

        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("feedbackPromptCard").fetchSemanticsNodes().isEmpty()
        }
        // The flag, not just the screen: a card that comes back on the next launch is the one
        // thing this feature must never do.
        assertTrue(onboardingStore.hasAskedForFeedback)
    }
}
