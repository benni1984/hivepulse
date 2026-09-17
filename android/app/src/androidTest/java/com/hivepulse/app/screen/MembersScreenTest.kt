package com.hivepulse.app.screen

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.MainActivity
import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.PaginatedResponse
import com.hivepulse.app.data.api.PublicStats
import com.hivepulse.app.data.api.CommunityHeatmap
import com.hivepulse.app.data.api.CommunityHeatmapFeature
import com.hivepulse.app.data.api.CommunityHeatmapProperties
import com.hivepulse.app.data.api.PolygonGeometry
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
        coEvery { it.communityHeatmap() } returns heatmap()
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
            composeRule.onAllNodesWithText("Regional Health Map").fetchSemanticsNodes().isNotEmpty()
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
    fun members_supporterSeesRegionalHealthMap() {
        coEvery { apiService.getMe() } returns supporterUser()
        navigateToMembers()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Varroa Risk").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Regional Health Map").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithText("None / low (< 1)").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun members_switchingOverlayUpdatesLegend() {
        coEvery { apiService.getMe() } returns supporterUser()
        navigateToMembers()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Colony Mood").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Colony Mood").performScrollTo().performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Good (≥ 70% calm)").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Good (≥ 70% calm)").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun members_supporterWithoutHeatmapDataSeesEmptyState() {
        coEvery { apiService.getMe() } returns supporterUser()
        coEvery { apiService.communityHeatmap() } returns CommunityHeatmap("FeatureCollection", emptyList())
        navigateToMembers()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("No community data available.").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("No community data available.").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun members_regularUserDoesNotRequestHeatmap() {
        coEvery { apiService.getMe() } returns regularUser()
        navigateToMembers()
        coVerify(exactly = 0) { apiService.communityHeatmap() }
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

    private fun heatmap() = CommunityHeatmap(
        type = "FeatureCollection",
        features = listOf(
            CommunityHeatmapFeature(
                geometry = PolygonGeometry(
                    "Polygon",
                    listOf(listOf(
                        listOf(9.75, 47.75), listOf(10.25, 47.75), listOf(10.25, 48.25),
                        listOf(9.75, 48.25), listOf(9.75, 47.75)
                    ))
                ),
                properties = CommunityHeatmapProperties(
                    avgVarroa = 2.4, moodScore = 78, avgBrood = 5.1,
                    swarmPct = 12, apiaryCount = 6, inspectionCount = 34
                )
            )
        )
    )
}
