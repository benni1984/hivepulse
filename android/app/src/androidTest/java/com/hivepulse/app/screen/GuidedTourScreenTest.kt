package com.hivepulse.app.screen

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.espresso.Espresso
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.MainActivity
import com.hivepulse.app.data.api.*
import com.hivepulse.app.data.local.OnboardingStore
import com.hivepulse.app.data.local.TokenStore
import com.hivepulse.app.di.NetworkModule
import dagger.hilt.android.testing.*
import io.mockk.*
import org.junit.*
import org.junit.Assert.assertTrue
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import javax.inject.Inject

@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class GuidedTourScreenTest {

    private val user = UserOut("uid-1", "test@example.com", "Test User", "en", "2024-01-01T00:00:00")

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.login(any()) } returns TokenResponse("access-token", "refresh-token", user)
        coEvery { it.getMe() } returns user
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(emptyList(), 0, 1, 1)
        coEvery { it.getReminderSettings() } returns ReminderSettingsOut(true, 7, 4, 8, null, null)
    }

    @Inject lateinit var tokenStore: TokenStore
    @Inject lateinit var onboardingStore: OnboardingStore

    @get:Rule(order = 0) val hiltRule    = HiltAndroidRule(this)
    // Logged out and tour not yet seen, so a sign-in behaves like the very first one on this device
    @get:Rule(order = 1) val setupRule   = object : ExternalResource() {
        override fun before() { hiltRule.inject(); tokenStore.clear(); onboardingStore.hasSeenGuidedTour = false }
    }
    @get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()

    private val pageTitles = listOf(
        "Welcome to HivePulse", "Every hive at a scan", "Inspections in seconds",
        "Spot problems early", "Never miss an inspection", "Protect your region",
    )

    private fun waitForText(text: String) {
        composeRule.waitUntil(5_000) { composeRule.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty() }
    }

    private fun signIn() {
        composeRule.onNodeWithText("Email").performTextReplacement("test@example.com")
        composeRule.onNodeWithText("Password").performTextReplacement("Demo1234!")
        Espresso.closeSoftKeyboard()
        composeRule.waitForIdle()
        composeRule.onNodeWithText("Sign In").performClick()
    }

    @Test
    fun firstSignIn_showsTour_andSkipOpensApiaryList() {
        signIn()
        waitForText("Welcome to HivePulse")

        composeRule.onNodeWithText("Skip").performClick()

        waitForText("My Apiaries")
        assertTrue(onboardingStore.hasSeenGuidedTour)
    }

    @Test
    fun tour_nextThroughAllPages_thenGetStartedOpensApiaryList() {
        signIn()
        pageTitles.dropLast(1).forEachIndexed { index, title ->
            waitForText(title)
            composeRule.onNodeWithText("Next").performClick()
            waitForText(pageTitles[index + 1])
        }

        composeRule.onNodeWithText("Get started").performClick()

        waitForText("My Apiaries")
        assertTrue(onboardingStore.hasSeenGuidedTour)
    }

    @Test
    fun signInAfterTourWasSeen_goesStraightToApiaryList() {
        onboardingStore.hasSeenGuidedTour = true

        signIn()

        waitForText("My Apiaries")
        composeRule.onAllNodesWithText("Welcome to HivePulse").assertCountEquals(0)
    }

    @Test
    fun settings_showGuidedTourAgain_opensTourAndReturnsToSettings() {
        onboardingStore.hasSeenGuidedTour = true
        signIn()
        waitForText("My Apiaries")
        composeRule.onNodeWithContentDescription("Settings").performClick()
        waitForText("Show guided tour again")

        composeRule.onNodeWithText("Show guided tour again").performScrollTo().performClick()
        waitForText("Welcome to HivePulse")
        composeRule.onNodeWithText("Skip").performClick()

        waitForText("Show guided tour again")
    }
}
