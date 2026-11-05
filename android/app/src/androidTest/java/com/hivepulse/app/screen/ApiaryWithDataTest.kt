package com.hivepulse.app.screen

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsOff
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.MainActivity
import com.hivepulse.app.data.api.ApiaryCreate
import com.hivepulse.app.data.api.ApiaryOut
import com.hivepulse.app.data.api.HiveOut
import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.PaginatedResponse
import com.hivepulse.app.data.api.UserOut
import com.hivepulse.app.data.local.TokenStore
import com.hivepulse.app.di.NetworkModule
import dagger.hilt.android.testing.BindValue
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import dagger.hilt.android.testing.UninstallModules
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.slot
import org.junit.Assert
import io.mockk.mockk
import org.junit.Rule
import org.junit.Test
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import javax.inject.Inject

@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class ApiaryWithDataTest {

    private val testApiaries = listOf(
        ApiaryOut("id-1", "Honey Farm",   null, null, null, null,     3, false, "2024-01-01T00:00:00"),
        ApiaryOut("id-2", "Garden Hives", null, null, null, "Main St",1, false, "2024-02-01T00:00:00"),
    )

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(testApiaries, 2, 1, 1)
        coEvery { it.getApiary("id-1") } returns testApiaries[0]
        coEvery { it.listHives("id-1", any(), any()) } returns PaginatedResponse(emptyList<HiveOut>(), 0, 1, 1)
        coEvery { it.getMe() } returns UserOut("uid-1", "beekeeper@example.com", "Beekeeper", "en", "2024-01-01T00:00:00")
    }

    @Inject
    lateinit var tokenStore: TokenStore

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val setupLoggedIn = object : ExternalResource() {
        override fun before() {
            hiltRule.inject()
            tokenStore.clear()
            tokenStore.accessToken = "test-access-token"
        }
    }

    @get:Rule(order = 2)
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun apiaryDetail_hasANewHiveButtonThatOpensTheForm() {
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("Honey Farm").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Honey Farm").performClick()

        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithContentDescription("New Hive").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithContentDescription("New Hive").performClick()

        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("hiveEditName").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun apiaryList_opensTheBeekeepingYearWithTheRegionAndTheEntries() {
        val region = com.hivepulse.app.data.api.RegionOut("DE", "69123", 49.4, 8.7, 0, 2, "postal_code", true)
        coEvery { apiService.region() } returns region
        coEvery { apiService.calendar(any(), any(), any()) } returns com.hivepulse.app.data.api.CalendarOut(
            region, "2026-10-07", "2026-09-01", "2027-01-29",
            listOf(
                com.hivepulse.app.data.api.CalendarEntryOut(
                    "winter-prep", "winter", "Make the hives winter-proof", "Fit the mouse guard.",
                    "2026-10-01", "2026-11-20", null, null, true,
                ),
                com.hivepulse.app.data.api.CalendarEntryOut(
                    "swarm-control", "swarm", "Swarm control: look for queen cells", "Check weekly.",
                    "2027-04-22", "2027-07-02", 9, null, false,
                ),
            ),
        )
        waitForApiaryList()

        composeRule.onNodeWithTag("beekeepingYearButton").performClick()

        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("Make the hives winter-proof").fetchSemanticsNodes().isNotEmpty()
        }
        // The list opens at today, so the region line above it has scrolled out of view. Scrolled
        // to by tag and not by index: the rows above the entries have changed twice already (the
        // view switch was added in front of them), and an index silently scrolls to the wrong one.
        composeRule.onNodeWithTag("beekeepingYearList")
            .performScrollToNode(hasTestTag("calendarRegion"))
        composeRule.onNodeWithTag("calendarRegion").assertIsDisplayed()
        composeRule.onNodeWithTag("changeRegionButton").assertIsDisplayed()
    }

    /**
     * The year as a ribbon: the switch, a bar, and the entry the bar stands for.
     *
     * The dates are built around today rather than written out, because the ribbon draws one
     * calendar year -- the current one -- and fixed dates would quietly empty the ribbon when the
     * year turned, leaving a test that passes by asserting nothing.
     */
    @Test
    fun beekeepingYear_showsTheYearAsARibbonAndOpensABar() {
        val year = java.time.LocalDate.now().year
        val region = com.hivepulse.app.data.api.RegionOut("DE", "69123", 49.4, 8.7, 0, 2, "postal_code", true)
        coEvery { apiService.region() } returns region
        coEvery { apiService.calendar(any(), any(), any()) } returns com.hivepulse.app.data.api.CalendarOut(
            region, "$year-06-15", "$year-01-01", "$year-12-31",
            listOf(
                com.hivepulse.app.data.api.CalendarEntryOut(
                    "swarm-control", "swarm", "Swarm control: look for queen cells", "Check weekly.",
                    "$year-04-22", "$year-07-02", 9, null, false,
                ),
                // A move and its harvest: one bar on the forage row, named after the plant.
                com.hivepulse.app.data.api.CalendarEntryOut(
                    "migrate-rapeseed", "migration", "Move to the rapeseed", "Drive out at dusk.",
                    "$year-04-15", "$year-05-05", null, "rapeseed", false,
                ),
                com.hivepulse.app.data.api.CalendarEntryOut(
                    "harvest-rapeseed", "harvest", "Spin the rapeseed at once", "It sets in the comb.",
                    "$year-05-15", "$year-06-05", null, "rapeseed", false,
                ),
            ),
        )
        waitForApiaryList()
        composeRule.onNodeWithTag("beekeepingYearButton").performClick()

        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("yearViewRibbon").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithTag("yearViewRibbon").performClick()

        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("ribbonBar").fetchSemanticsNodes().isNotEmpty()
        }
        // Three entries, two bars: the move and its harvest are one bar.
        composeRule.onAllNodesWithTag("ribbonBar").assertCountEquals(2)

        // Tapping a bar opens the entry under the ribbon, with the photograph and its credit.
        composeRule.onAllNodesWithTag("ribbonBar")[0].performClick()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("ribbonDetail").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithTag("ribbonDetail").assertIsDisplayed()
        composeRule.onAllNodesWithTag("yearPhotoCredit")[0].assertExists()

        // And back to the list, which is where the screen opens.
        composeRule.onNodeWithTag("yearViewList").performClick()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("beekeepingYearList").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun apiaryList_redeemsAnInvitationLinkFromTheFooterNotTheToolbar() {
        waitForApiaryList()

        composeRule.onNode(hasScrollAction()).performScrollToNode(hasTestTag("redeemInvitationButton"))
        composeRule.onNodeWithTag("redeemInvitationButton").performClick()

        composeRule.onNodeWithTag("redeemField").assertIsDisplayed()
    }

    private fun waitForApiaryList() {
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("My Apiaries").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun apiaryList_showsApiaryNames() {
        waitForApiaryList()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("Honey Farm").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Honey Farm").assertIsDisplayed()
        composeRule.onNodeWithText("Garden Hives").assertIsDisplayed()
    }

    @Test
    fun apiaryList_showsHiveCount() {
        waitForApiaryList()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("Honey Farm").fetchSemanticsNodes().isNotEmpty()
        }
        // The list item shows "${apiary.hiveCount} hives"
        composeRule.onNodeWithText("3 hives").assertIsDisplayed()
    }

    @Test
    fun apiaryDetail_editMakesAnExistingApiaryPublic() {
        val sent = slot<ApiaryCreate>()
        coEvery { apiService.updateApiary("id-1", capture(sent)) } returns testApiaries[0].copy(isPublic = true)
        waitForApiaryList()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("Honey Farm").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Honey Farm").performClick()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithContentDescription("Edit Apiary").fetchSemanticsNodes().isNotEmpty()
        }

        composeRule.onNodeWithContentDescription("Edit Apiary").performClick()
        composeRule.onNodeWithTag("apiaryPublicSwitch").assertIsOff().performClick()
        composeRule.onNodeWithText("Save").performClick()

        coVerify(timeout = 3_000) { apiService.updateApiary("id-1", any()) }
        Assert.assertTrue(sent.captured.isPublic)
        Assert.assertEquals("Honey Farm", sent.captured.name)
    }
}
