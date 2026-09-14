package com.hivepulse.app.screen

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.MainActivity
import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.FieldDefinitionOut
import com.hivepulse.app.data.api.PaginatedResponse
import com.hivepulse.app.data.api.ReminderSettingsOut
import com.hivepulse.app.data.api.UserOut
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
class FieldDefinitionsScreenTest {

    private val weight = FieldDefinitionOut(
        "fd-1", "user", null, "inspection", "Hive weight", "number", emptyList(), true, 0
    )

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(emptyList(), 0, 1, 1)
        coEvery { it.getMe() } returns UserOut("uid-1", "test@example.com", "Test User", "en", "2024-01-01T00:00:00")
        coEvery { it.getReminderSettings() } returns ReminderSettingsOut(true, 7, 4, 8, null, null)
        coEvery { it.listFieldDefinitions() } returns listOf(weight)
    }

    @Inject lateinit var tokenStore: TokenStore

    @get:Rule(order = 0) val hiltRule    = HiltAndroidRule(this)
    @get:Rule(order = 1) val setupRule   = object : ExternalResource() {
        override fun before() { hiltRule.inject(); tokenStore.clear(); tokenStore.accessToken = "test-access-token" }
    }
    @get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()

    private fun navigateToCustomFields() {
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("My Apiaries").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithContentDescription("Settings").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Manage custom fields").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Manage custom fields").performScrollTo().performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Hive weight").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun customFields_listsExistingFields() {
        navigateToCustomFields()
        composeRule.onNodeWithText("Hive weight").assertIsDisplayed()
        composeRule.onNodeWithText("Inspection · Number · Required").assertIsDisplayed()
    }

    @Test
    fun customFields_createSendsNewFieldAndShowsIt() {
        coEvery { apiService.createFieldDefinition(any()) } returns FieldDefinitionOut(
            "fd-2", "user", null, "inspection", "Queen temper", "text", emptyList(), false, 0
        )
        navigateToCustomFields()

        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithContentDescription("New Field").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithContentDescription("New Field").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("New Custom Field").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Field name").performTextInput("Queen temper")
        composeRule.onNodeWithText("Create Field").performClick()

        coVerify(timeout = 3_000) {
            apiService.createFieldDefinition(match { it.name == "Queen temper" && it.type == "text" && it.target == "inspection" })
        }
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Queen temper").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun customFields_deleteAsksForConfirmationThenDeletes() {
        coEvery { apiService.deleteFieldDefinition("fd-1") } returns mockk { every { isSuccessful } returns true }
        navigateToCustomFields()

        composeRule.onNodeWithContentDescription("Delete").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Delete this field? Data using this field will be lost.").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Delete").performClick()

        coVerify(timeout = 3_000) { apiService.deleteFieldDefinition("fd-1") }
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Hive weight").fetchSemanticsNodes().isEmpty()
        }
    }
}
