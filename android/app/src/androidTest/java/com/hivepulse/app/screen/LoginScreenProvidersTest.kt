package com.hivepulse.app.screen

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.MainActivity
import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.SignInProvider
import com.hivepulse.app.data.api.SignInProviders
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
 * The login screen when the server offers Google: the email form sits behind a link.
 *
 * Separate from LoginScreenTest because the answer has to be stubbed before the activity
 * starts — the app asks for it as soon as the screen appears.
 */
@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class LoginScreenProvidersTest {

    @BindValue @JvmField
    val apiService: ApiService = mockk(relaxed = true)

    @Inject lateinit var tokenStore: TokenStore
    @Inject lateinit var onboardingStore: OnboardingStore

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val prepare = object : ExternalResource() {
        override fun before() {
            hiltRule.inject()
            tokenStore.clear()
            onboardingStore.hasSeenGuidedTour = true
            coEvery { apiService.signInProviders() } returns
                SignInProviders(google = SignInProvider("web-id.apps.googleusercontent.com"), apple = null)
        }
    }

    @get:Rule(order = 2)
    val composeRule = createAndroidComposeRule<MainActivity>()

    private fun awaitLink() {
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("Sign in with an email address instead")
                .fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun withGoogleOnOffer_theEmailFormStartsClosed() {
        awaitLink()

        // The point of the change: Google first, email as the quieter way in.
        assertTrue(composeRule.onAllNodesWithText("Email").fetchSemanticsNodes().isEmpty())
        assertTrue(composeRule.onAllNodesWithText("Sign In").fetchSemanticsNodes().isEmpty())
    }

    @Test
    fun theLink_opensTheEmailForm() {
        awaitLink()

        composeRule.onNodeWithText("Sign in with an email address instead").performClick()

        composeRule.onNodeWithText("Email").assertIsDisplayed()
        composeRule.onNodeWithText("Sign In").assertIsDisplayed()
    }

    @Test
    fun googleIsOfferedAboveTheLink() {
        awaitLink()

        composeRule.onNodeWithText("Continue with Google").assertIsDisplayed()
    }
}
