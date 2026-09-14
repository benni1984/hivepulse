package com.hivepulse.app.screen

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.MainActivity
import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.ApiaryStatsSummary
import com.hivepulse.app.data.api.OverviewStats
import com.hivepulse.app.data.api.PaginatedResponse
import com.hivepulse.app.data.api.StatsPeriod
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
class OverviewStatsScreenTest {

    private val overview = OverviewStats(
        period = StatsPeriod("2025-01-01", "2025-12-31", "365d"),
        apiaryCount = 2, hiveCount = 7, inspectionsTotal = 31,
        perApiary = listOf(
            ApiaryStatsSummary("a1", "Home Yard", 4, 20),
            ApiaryStatsSummary("a2", "Forest", 3, 11)
        )
    )

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(emptyList(), 0, 1, 1)
        coEvery { it.getMe() } returns UserOut("uid-1", "test@example.com", "Test User", "en", "2024-01-01T00:00:00")
        coEvery { it.overviewStats(any()) } returns overview
    }

    @Inject lateinit var tokenStore: TokenStore

    @get:Rule(order = 0) val hiltRule    = HiltAndroidRule(this)
    @get:Rule(order = 1) val setupRule   = object : ExternalResource() {
        override fun before() { hiltRule.inject(); tokenStore.clear(); tokenStore.accessToken = "test-access-token" }
    }
    @get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()

    private fun navigateToOverview() {
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("My Apiaries").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithContentDescription("My Statistics").performClick()
    }

    @Test
    fun overview_showsTotalsAndPerApiaryRows() {
        navigateToOverview()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Home Yard").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("31").assertIsDisplayed()
        composeRule.onNodeWithText("4 hives · 20 inspections").assertIsDisplayed()
        composeRule.onNodeWithText("Forest").assertIsDisplayed()
    }

    @Test
    fun overview_selectingPresetRefetches() {
        navigateToOverview()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Home Yard").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("30d").performClick()

        coVerify(timeout = 3_000) { apiService.overviewStats("30d") }
    }

    @Test
    fun overview_showsEmptyStateWithoutApiaries() {
        coEvery { apiService.overviewStats(any()) } returns overview.copy(perApiary = emptyList())
        navigateToOverview()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("No inspections in this period.").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("No inspections in this period.").assertIsDisplayed()
    }
}
