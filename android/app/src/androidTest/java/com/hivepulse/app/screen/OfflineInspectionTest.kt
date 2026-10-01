package com.hivepulse.app.screen

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.MainActivity
import com.hivepulse.app.data.api.*
import com.hivepulse.app.data.local.PendingInspectionDao
import com.hivepulse.app.data.local.TokenStore
import com.hivepulse.app.di.NetworkModule
import dagger.hilt.android.testing.*
import io.mockk.*
import kotlinx.coroutines.runBlocking
import org.junit.*
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import java.io.IOException
import javax.inject.Inject

/**
 * The whole point of the offline work: a beekeeper standing at a hive without a signal
 * records the visit, sees it in the list, and it reaches the server later — exactly once.
 *
 * Runs against the real Room database; only the network layer is replaced.
 */
@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class OfflineInspectionTest {

    private val apiary = ApiaryOut("apiary-1", "Meadow", null, null, null, null, 1, false, "2024-01-01")
    private val hive = HiveOut(
        id = "hive-1", qrToken = "qr-token-1", apiaryId = "apiary-1",
        name = "Hive Alpha", hiveType = "langstroth",
        latitude = null, longitude = null, acquisitionDate = null, notes = null,
        customFields = emptyMap(), initializedAt = "2024-01-01T00:00:00",
        lastInspectionAt = null, createdAt = "2024-01-01T00:00:00",
    )
    private val savedInspection = InspectionOut(
        id = "insp-new", hiveId = "hive-1", date = "2024-04-01",
        queenSeen = null, queenColor = null, broodFrames = null, honeyFrames = null,
        mood = null, populationStrength = null, varroaCount = null,
        swarmCellsSeen = null, treatmentApplied = null, feedingDone = null,
        feedingType = null, weightKg = null, notes = null,
        customFields = emptyMap(), createdAt = "2024-04-01T10:00:00",
    )

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(listOf(apiary), 1, 1, 1)
        coEvery { it.getApiary(any()) } returns apiary
        coEvery { it.listHives(any(), any(), any()) } returns PaginatedResponse(listOf(hive), 1, 1, 1)
        coEvery { it.getHive(any()) } returns hive
        coEvery { it.listInspections(any(), any(), any()) } returns PaginatedResponse(emptyList(), 0, 1, 1)
        // No connection at the apiary
        coEvery { it.createInspection(any(), any()) } throws IOException("no network")
    }

    @Inject lateinit var tokenStore: TokenStore
    @Inject lateinit var pendingDao: PendingInspectionDao

    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val setupRule = object : ExternalResource() {
        override fun before() {
            hiltRule.inject()
            tokenStore.clear()
            tokenStore.accessToken = "test-access-token"
            runBlocking { pendingDao.clear() }
        }
        override fun after() {
            runBlocking { pendingDao.clear() }
        }
    }
    @get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()

    private fun recordInspectionWithoutNetwork() {
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("My Apiaries").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Meadow").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Hive Alpha").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Hive Alpha").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithContentDescription("New Inspection").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithContentDescription("New Inspection").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Date").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithTag("broodFrames5").performScrollTo().performClick()
        composeRule.onNodeWithText("Save").performScrollTo().performClick()
    }

    @Test
    fun inspectionRecordedWithoutNetworkIsKeptAndShownAsPending() {
        recordInspectionWithoutNetwork()

        // It is back on the hive screen and the visit is listed, marked as waiting
        composeRule.waitUntil(10_000) {
            composeRule.onAllNodesWithText("Waiting to upload").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Waiting to upload").assertIsDisplayed()

        val queued = runBlocking { pendingDao.all() }
        Assert.assertEquals(1, queued.size)
        Assert.assertEquals("hive-1", queued[0].hiveId)
        Assert.assertTrue("a client_id is stored for the retry", queued[0].clientId.isNotBlank())
    }

    @Test
    fun theQueuedVisitIsUploadedOnceTheServerAnswersAgain() {
        recordInspectionWithoutNetwork()
        composeRule.waitUntil(10_000) { runBlocking { pendingDao.count() } == 1 }
        val clientId = runBlocking { pendingDao.all() }.first().clientId

        // Connection is back
        val sent = slot<InspectionCreateRequest>()
        coEvery { apiService.createInspection(any(), capture(sent)) } returns savedInspection

        val remaining = runBlocking {
            val queue = com.hivepulse.app.data.repository.OfflineInspectionQueue(
                apiService, pendingDao, com.google.gson.Gson(),
            )
            queue.flush()
        }

        Assert.assertEquals(0, remaining)
        Assert.assertEquals(
            "the retry carries the original client_id so the server stores it once",
            clientId, sent.captured.clientId,
        )
        Assert.assertEquals(5, sent.captured.broodFrames)
    }
}
