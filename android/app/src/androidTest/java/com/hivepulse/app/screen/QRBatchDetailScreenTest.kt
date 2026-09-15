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
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.*
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import javax.inject.Inject

@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class QRBatchDetailScreenTest {

    private val batch = QrBatchOut(
        "batch-id-1234", 2, "2024-03-01",
        listOf(QrTokenOut("token-aaaaaaaaaaaa", null), QrTokenOut("token-bbbbbbbbbbbb", "h1"))
    )

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(emptyList(), 0, 1, 1)
        coEvery { it.listQrBatches(any(), any()) } returns PaginatedResponse(
            listOf(QrBatchSummary("batch-id-1234", 2, "2024-03-01", 1)), 1, 1, 1
        )
        coEvery { it.getQrBatch("batch-id-1234") } returns batch
        coEvery { it.downloadQrBatchPdf("batch-id-1234") } answers {
            "%PDF-1.4 test".toResponseBody("application/pdf".toMediaType())
        }
    }

    @Inject lateinit var tokenStore: TokenStore

    @get:Rule(order = 0) val hiltRule    = HiltAndroidRule(this)
    @get:Rule(order = 1) val setupRule   = object : ExternalResource() {
        override fun before() { hiltRule.inject(); tokenStore.clear(); tokenStore.accessToken = "test-access-token" }
    }
    @get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()

    private fun openBatch() {
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("My Apiaries").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithContentDescription("Print QR codes").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodes(hasText("Batch batch-id", substring = true)).fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNode(hasText("Batch batch-id", substring = true)).performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Download PDF").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun batchDetail_downloadPdfFetchesThroughApiAndConfirms() {
        openBatch()
        composeRule.onNodeWithText("Download PDF").performClick()

        coVerify(timeout = 3_000) { apiService.downloadQrBatchPdf("batch-id-1234") }
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodes(hasText("Saved to Downloads", substring = true)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun batchDetail_downloadFailureIsShownInsteadOfNothingHappening() {
        coEvery { apiService.downloadQrBatchPdf(any()) } throws RuntimeException("PDF generation failed")
        openBatch()
        composeRule.onNodeWithText("Download PDF").performClick()

        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("PDF generation failed").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("PDF generation failed").assertIsDisplayed()
    }
}
