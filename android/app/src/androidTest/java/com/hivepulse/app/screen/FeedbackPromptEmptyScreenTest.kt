package com.hivepulse.app.screen

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
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
import org.junit.After
import org.junit.Rule
import org.junit.Test
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import javax.inject.Inject

/**
 * The same card on the half of the apiary list that is not a list (#546).
 *
 * Somebody who has had the app for three days without naming a single colony is the person most
 * worth asking why — and they never see a list at all. That branch is a plain `Column` in a
 * centred `Box`: no `LazyColumn`, and so no scrolling parent, which is what the first version of
 * these tests tripped over with `performScrollTo()`.
 *
 * Its own class because the activity starts when its rule applies: re-stubbing the apiary list
 * inside a test body happens after the screen has already asked for it.
 */
@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class FeedbackPromptEmptyScreenTest {

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
            onboardingStore.firstLaunchAt =
                System.currentTimeMillis() - 4L * 24 * 60 * 60 * 1000
        }
    }

    @get:Rule(order = 2)
    val composeRule = createAndroidComposeRule<MainActivity>()

    /** Preferences outlive a test class on the same install — see the sibling class. */
    @After
    fun leaveTheDeviceAsItWasFound() {
        onboardingStore.firstLaunchAt = 0L
        onboardingStore.hasAskedForFeedback = false
    }

    @Test
    fun anAccountWithNoApiariesStillSeesTheQuestion() {
        composeRule.waitUntil(timeoutMillis = 10_000) {
            composeRule.onAllNodesWithTag("feedbackPromptCard").fetchSemanticsNodes().isNotEmpty()
        }

        composeRule.onNodeWithTag("feedbackPromptCard").assertIsDisplayed()
    }
}
