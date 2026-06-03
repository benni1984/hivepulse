package com.hivepulse.app.screen

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.MainActivity
import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.PaginatedResponse
import com.hivepulse.app.data.api.PublicStats
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
class MembersScreenTest {

    private val reminderSettings = ReminderSettingsOut(
        reminderEnabled      = true,
        reminderIntervalDays = 7,
        reminderSeasonStart  = 4,
        reminderSeasonEnd    = 8,
        pushTokenApns        = null,
        pushTokenFcm         = null
    )

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(emptyList(), 0, 1, 1)
        coEvery { it.getReminderSettings() } returns reminderSettings
        coEvery { it.getMe() } returns regularUser()
        coEvery { it.getPublicStats() } returns publicStats()
    }

    @Inject lateinit var tokenStore: TokenStore

    @get:Rule(order = 0) val hiltRule    = HiltAndroidRule(this)
    @get:Rule(order = 1) val setupRule   = object : ExternalResource() {
        override fun before() { hiltRule.inject(); tokenStore.clear(); tokenStore.accessToken = "test-access-token" }
    }
    @get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()

    private fun navigateToMembers() {
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Members").fetchSemanticsNodes().isNotEmpty()
        }
        // Click the Members bottom-nav item
        composeRule.onAllNodesWithText("Members").onFirst().performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Supporter Feature").fetchSemanticsNodes().isNotEmpty() ||
            composeRule.onAllNodesWithText("More community stats coming soon.").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun members_bottomNavTabVisible() {
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Members").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onAllNodesWithText("Members").onFirst().assertIsDisplayed()
    }

    @Test
    fun members_regularUserSeesGate() {
        coEvery { apiService.getMe() } returns regularUser()
        navigateToMembers()
        composeRule.onNodeWithText("Supporter Feature").assertIsDisplayed()
    }

    @Test
    fun members_supporterSeesComingSoon() {
        coEvery { apiService.getMe() } returns supporterUser()
        navigateToMembers()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("More community stats coming soon.").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("More community stats coming soon.").assertIsDisplayed()
    }

    @Test
    fun members_gateCardShowsBecomeSupporterButton() {
        coEvery { apiService.getMe() } returns regularUser()
        navigateToMembers()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Learn more & become a supporter").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Learn more & become a supporter").performScrollTo().assertIsDisplayed()
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private fun regularUser()   = UserOut("u1", "a@b.com", "Test User", "en", "2024-01-01",
                                          isAdmin = false, isSupporter = false)
    private fun supporterUser() = UserOut("u2", "a@b.com", "Test User", "en", "2024-01-01",
                                          isAdmin = false, isSupporter = true)

    private fun publicStats() = PublicStats(
        avgVarroaCount            = 2.8,
        moodDistribution          = mapOf("calm" to 410, "nervous" to 89, "aggressive" to 23),
        avgBroodFrames            = 5.2,
        avgInspectionIntervalDays = 14.3,
        apiaryCount               = 12,
        hiveCount                 = 87,
        inspectionCount           = 634
    )
}
