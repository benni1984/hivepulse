package com.hivepulse.app.screen

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.MainActivity
import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.ForgotPasswordRequest
import com.hivepulse.app.data.local.TokenStore
import com.hivepulse.app.di.NetworkModule
import dagger.hilt.android.testing.*
import io.mockk.*
import org.junit.*
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import retrofit2.Response
import javax.inject.Inject

@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class ForgotPasswordScreenTest {

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.forgotPassword(any()) } returns Response.success(Unit)
    }

    @Inject lateinit var tokenStore: TokenStore

    @get:Rule(order = 0) val hiltRule    = HiltAndroidRule(this)
    // Logged out, so the app starts on the login screen
    @get:Rule(order = 1) val clearStore  = object : ExternalResource() {
        override fun before() { hiltRule.inject(); tokenStore.clear() }
    }
    @get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()

    private fun openForgotPassword() {
        composeRule.onNodeWithText("Forgot password?").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Reset your password").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun forgotPassword_prefillsEmailTypedOnLogin() {
        composeRule.onNodeWithText("Email").performTextReplacement("bee@example.com")
        openForgotPassword()

        composeRule.onNodeWithText("bee@example.com").assertIsDisplayed()
    }

    @Test
    fun forgotPassword_submitSendsEmailAndShowsConfirmation() {
        openForgotPassword()
        composeRule.onNodeWithText("Email").performTextReplacement("bee@example.com")
        composeRule.onNodeWithText("Send reset link").performClick()

        coVerify(timeout = 3_000) { apiService.forgotPassword(ForgotPasswordRequest("bee@example.com")) }
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodes(hasText("If that email is registered", substring = true)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun forgotPassword_backReturnsToLogin() {
        openForgotPassword()
        composeRule.onNodeWithText("Back to sign in").performClick()

        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Sign In").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Sign In").assertIsDisplayed()
    }
}
