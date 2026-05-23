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
class QRBatchListScreenTest {

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(emptyList(), 0, 1, 1)
        coEvery { it.listQrBatches(any(), any()) } returns PaginatedResponse(emptyList(), 0, 1, 1)
    }

    @Inject lateinit var tokenStore: TokenStore

    @get:Rule(order = 0) val hiltRule    = HiltAndroidRule(this)
    @get:Rule(order = 1) val setupRule   = object : ExternalResource() {
        override fun before() { hiltRule.inject(); tokenStore.clear(); tokenStore.accessToken = "test-access-token" }
    }
    @get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()

    private fun navigateToQrBatchList() {
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("My Apiaries").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithContentDescription("Print QR codes").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("QR Batches").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun qrBatchList_showsScreenTitle() {
        navigateToQrBatchList()
        composeRule.onNodeWithText("QR Batches").assertIsDisplayed()
    }

    @Test
    fun qrBatchList_showsEmptyStateWhenNoBatches() {
        navigateToQrBatchList()
        composeRule.onNode(hasText("No QR batches yet", substring = true)).assertIsDisplayed()
    }

    @Test
    fun qrBatchList_showsBatchSummaryWhenDataLoaded() {
        coEvery { apiService.listQrBatches(any(), any()) } returns PaginatedResponse(
            listOf(QrBatchSummary("batch-id-1234", 10, "2024-03-01", 3)), 1, 1, 1
        )
        navigateToQrBatchList()
        composeRule.onNode(hasText("Batch batch-id", substring = true)).assertIsDisplayed()
    }

    @Test
    fun qrBatchList_fabOpensCreateBatchDialog() {
        navigateToQrBatchList()
        composeRule.onNodeWithText("+").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("New QR Batch").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("New QR Batch").assertIsDisplayed()
    }
}
