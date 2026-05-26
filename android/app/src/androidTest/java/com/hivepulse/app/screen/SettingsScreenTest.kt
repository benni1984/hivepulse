package com.hivepulse.app.screen

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.MainActivity
import com.hivepulse.app.data.api.*
import com.hivepulse.app.data.local.TokenStore
import com.hivepulse.app.di.NetworkModule
import dagger.hilt.android.testing.*
import io.mockk.*
import org.junit.*
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import javax.inject.Inject

@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class SettingsScreenTest {

    private val user = UserOut("uid-1", "test@example.com", "Test User", "en", "2024-01-01T00:00:00")

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(emptyList(), 0, 1, 1)
        coEvery { it.getMe() } returns user
    }

    @Inject lateinit var tokenStore: TokenStore

    @get:Rule(order = 0) val hiltRule    = HiltAndroidRule(this)
    @get:Rule(order = 1) val setupRule   = object : ExternalResource() {
        override fun before() { hiltRule.inject(); tokenStore.clear(); tokenStore.accessToken = "test-access-token" }
    }
    @get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()

    private fun navigateToSettings() {
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("My Apiaries").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithContentDescription("Settings").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Settings").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun settings_showsDisplayNameAndEmailFields() {
        navigateToSettings()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("test@example.com").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("test@example.com").assertIsDisplayed()
        composeRule.onNodeWithText("Display Name").assertIsDisplayed()
    }

    @Test
    fun settings_showsLanguageSection() {
        navigateToSettings()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Language").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("English").assertIsDisplayed()
        composeRule.onNodeWithText("Français").assertIsDisplayed()
        composeRule.onNodeWithText("Deutsch").assertIsDisplayed()
    }

    @Test
    fun settings_saveButtonAppearsAfterEditingDisplayName() {
        navigateToSettings()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Test User").fetchSemanticsNodes().isNotEmpty()
        }
        coEvery { apiService.updateMe(any()) } returns user.copy(name = "New Name")
        composeRule.onNodeWithText("Display Name").performTextReplacement("New Name")
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Save").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Save").assertIsDisplayed()
    }

    @Test
    fun settings_showsErrorBannerOnUpdateNameFailure() {
        navigateToSettings()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Test User").fetchSemanticsNodes().isNotEmpty()
        }
        coEvery { apiService.updateMe(any()) } throws RuntimeException("Update failed")
        composeRule.onNodeWithText("Display Name").performTextReplacement("Bad Name")
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Save").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Save").performClick()
        coVerify(timeout = 3_000) { apiService.updateMe(any()) }
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Update failed").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Update failed").assertIsDisplayed()
    }

    @Test
    fun settings_showsChangePasswordSection() {
        navigateToSettings()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Change Password").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Change Password").assertIsDisplayed()
    }

    @Test
    fun settings_showsPasswordFields() {
        navigateToSettings()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Current password").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Current password").assertIsDisplayed()
        composeRule.onNodeWithText("New password").assertIsDisplayed()
        composeRule.onNodeWithText("Confirm new password").assertIsDisplayed()
    }

    @Test
    fun settings_showsDangerZoneSection() {
        navigateToSettings()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Danger Zone").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Danger Zone").assertIsDisplayed()
    }

    @Test
    fun settings_showsDeleteAccountButton() {
        navigateToSettings()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Delete Account").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Delete Account").assertIsDisplayed()
    }

    @Test
    fun settings_showsSpanishLocaleOption() {
        navigateToSettings()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Español").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Español").assertIsDisplayed()
    }
}
