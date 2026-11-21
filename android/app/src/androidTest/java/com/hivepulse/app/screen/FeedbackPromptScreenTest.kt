package com.hivepulse.app.screen

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
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
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import javax.inject.Inject

/**
 * The card that asks what somebody thinks, over a list that has something in it (#546).
 *
 * `FeedbackPromptRuleTest` covers *when* it appears; `FeedbackPromptEmptyScreenTest` covers the
 * other half of this screen. Two classes rather than two tests, because the activity starts
 * when its rule applies — re-stubbing the apiary list inside a test body happens after the
 * screen has already asked for it. The repo splits `ApiaryScreenTest` from `ApiaryWithDataTest`
 * for the same reason.
 */
@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class FeedbackPromptScreenTest {

    private val oneApiary = listOf(
        ApiaryOut("id-1", "Honey Farm", null, null, null, null, 3, false, "2024-01-01T00:00:00"),
    )

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(oneApiary, 1, 1, 1)
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

    /**
     * Preferences outlive a test class on the same install.
     *
     * Left as they are, the next class to sign in would find a four-day-old first launch and an
     * unanswered question, draw a card nobody asked it to draw, and fail an assertion somewhere
     * that has nothing to do with feedback. Both values, because either one alone would do it.
     */
    @After
    fun leaveTheDeviceAsItWasFound() {
        onboardingStore.firstLaunchAt = 0L
        onboardingStore.hasAskedForFeedback = false
    }

    private fun waitForCard() {
        composeRule.waitUntil(timeoutMillis = 10_000) {
            composeRule.onAllNodesWithTag("feedbackPromptCard").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun theCardAsksOverTheApiaryList() {
        waitForCard()

        composeRule.onNodeWithTag("feedbackPromptCard").assertIsDisplayed()
        composeRule.onNodeWithText("How is it going?").assertIsDisplayed()
        composeRule.onNodeWithTag("feedbackPromptSend").assertIsDisplayed()
    }

    @Test
    fun sayingNoThanksEndsItForGood() {
        waitForCard()

        composeRule.onNodeWithTag("feedbackPromptDismiss").performClick()

        composeRule.waitUntil(timeoutMillis = 10_000) {
            composeRule.onAllNodesWithTag("feedbackPromptCard").fetchSemanticsNodes().isEmpty()
        }
        // The flag, not just the screen: a card that comes back on the next launch is the one
        // thing this feature must never do.
        assertTrue(onboardingStore.hasAskedForFeedback)
    }
}
