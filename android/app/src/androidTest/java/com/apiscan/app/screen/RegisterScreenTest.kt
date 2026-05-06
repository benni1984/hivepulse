package com.apiscan.app.screen

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.espresso.Espresso
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.apiscan.app.MainActivity
import com.apiscan.app.data.api.*
import com.apiscan.app.data.local.TokenStore
import com.apiscan.app.di.NetworkModule
import dagger.hilt.android.testing.*
import io.mockk.*
import org.junit.*
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import javax.inject.Inject

@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class RegisterScreenTest {

    @BindValue @JvmField
    val apiService: ApiService = mockk(relaxed = true)

    @Inject lateinit var tokenStore: TokenStore

    @get:Rule(order = 0) val hiltRule    = HiltAndroidRule(this)
    @get:Rule(order = 1) val setupRule   = object : ExternalResource() {
        override fun before() { hiltRule.inject(); tokenStore.clear() }
    }
    @get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()

    private fun navigateToRegister() {
        composeRule.onNodeWithText("Create an account").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Name").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun registerScreen_displaysNameEmailPasswordFields() {
        navigateToRegister()
        composeRule.onNodeWithText("Name").assertIsDisplayed()
        composeRule.onNodeWithText("Email").assertIsDisplayed()
        composeRule.onNodeWithText("Password").assertIsDisplayed()
    }

    @Test
    fun registerScreen_createAccountButtonDisabledWhenFieldsEmpty() {
        navigateToRegister()
        composeRule.onNode(hasText("Create Account") and hasClickAction()).assertIsNotEnabled()
    }

    @Test
    fun registerScreen_showsErrorBannerOnRegisterFailure() {
        coEvery { apiService.register(any()) } throws RuntimeException("Email already taken")
        navigateToRegister()
        composeRule.onNodeWithText("Name").performTextReplacement("Alice")
        composeRule.onNodeWithText("Email").performTextReplacement("alice@example.com")
        composeRule.onNodeWithText("Password").performTextReplacement("Password123")
        Espresso.closeSoftKeyboard()
        composeRule.waitForIdle()
        composeRule.onNode(hasText("Create Account") and hasClickAction()).performClick()
        coVerify(timeout = 3_000) { apiService.register(any()) }
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Email already taken").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Email already taken").assertIsDisplayed()
    }

    @Test
    fun registerScreen_successNavigatesToApiaryList() {
        val user = UserOut("uid-1", "alice@example.com", "Alice", "en", "2024-01-01T00:00:00")
        coEvery { apiService.register(any()) } returns TokenResponse("access-token", "refresh-token", user)
        coEvery { apiService.listApiaries(any(), any()) } returns PaginatedResponse(emptyList(), 0, 1, 1)
        navigateToRegister()
        composeRule.onNodeWithText("Name").performTextReplacement("Alice")
        composeRule.onNodeWithText("Email").performTextReplacement("alice@example.com")
        composeRule.onNodeWithText("Password").performTextReplacement("Password123")
        Espresso.closeSoftKeyboard()
        composeRule.waitForIdle()
        composeRule.onNode(hasText("Create Account") and hasClickAction()).performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("My Apiaries").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("My Apiaries").assertIsDisplayed()
    }
}
