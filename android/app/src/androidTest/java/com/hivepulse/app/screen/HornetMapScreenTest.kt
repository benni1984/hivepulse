package com.hivepulse.app.screen

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.MainActivity
import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.ApiaryOut
import com.hivepulse.app.data.api.HornetNestFeature
import com.hivepulse.app.data.api.HornetNestGeoJSON
import com.hivepulse.app.data.api.HornetNestGeometry
import com.hivepulse.app.data.api.HornetNestProperties
import com.hivepulse.app.data.api.PaginatedResponse
import com.hivepulse.app.data.api.UserOut
import com.hivepulse.app.data.local.OnboardingStore
import com.hivepulse.app.data.local.TokenStore
import com.hivepulse.app.di.NetworkModule
import dagger.hilt.android.testing.BindValue
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import dagger.hilt.android.testing.UninstallModules
import io.mockk.coEvery
import io.mockk.mockk
import org.junit.Rule
import org.junit.Test
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import javax.inject.Inject

/**
 * The tab called "Map" draws a map (#556).
 *
 * It drew a list of cards until now, which is the whole bug, so what this asserts is that the
 * map view is there at all. What it *points at* is arithmetic and lives in
 * `HornetMapCameraTest`, which needs no emulator: an osmdroid `MapView` renders into a canvas,
 * so a Compose assertion can see that the map exists but not where it is looking.
 */
@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class HornetMapScreenTest {

    private val nest = HornetNestFeature(
        type = "Feature",
        geometry = HornetNestGeometry("Point", listOf(13.74, 51.05)),
        properties = HornetNestProperties(
            id = "nest-abcdef12",
            status = "found",
            reporterName = "A beekeeper",
            notes = "In the old pear tree",
            photoUrl = null,
            createdAt = "2026-11-20T09:00:00",
        ),
    )

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(
            listOf(ApiaryOut("id-1", "Honey Farm", null, null, null, null, 3, false, "2024-01-01T00:00:00")),
            1, 1, 1,
        )
        coEvery { it.getMe() } returns
            UserOut("uid-1", "test@example.com", "Test User", "en", "2024-01-01T00:00:00")
    }

    @Inject lateinit var tokenStore: TokenStore
    @Inject lateinit var onboardingStore: OnboardingStore

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val setup = object : ExternalResource() {
        override fun before() {
            hiltRule.inject()
            tokenStore.clear()
            tokenStore.accessToken = "test-access-token"
            onboardingStore.hasSeenGuidedTour = true
            // Otherwise the feedback card (#546) can sit over the screen this test is about.
            onboardingStore.hasAskedForFeedback = true
        }
    }

    @get:Rule(order = 2)
    val composeRule = createAndroidComposeRule<MainActivity>()

    /** Hornets from the bottom bar, then the second of its five tabs. */
    private fun openTheMapTab() {
        composeRule.waitUntil(timeoutMillis = 10_000) {
            composeRule.onAllNodesWithText("Hornets").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Hornets").performClick()
        composeRule.waitUntil(timeoutMillis = 10_000) {
            composeRule.onAllNodesWithText("Map").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Map").performClick()
        composeRule.waitUntil(timeoutMillis = 10_000) {
            composeRule.onAllNodesWithTag("hornetNestMap").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun aReportedNestIsDrawnOnAMapRatherThanListedAsACard() {
        coEvery { apiService.hornetNests() } returns
            HornetNestGeoJSON("FeatureCollection", listOf(nest))

        openTheMapTab()

        composeRule.onNodeWithTag("hornetNestMap").assertIsDisplayed()
        // The card this screen used to be made of printed the first eight characters of the id.
        // Nobody has ever needed to read that, and it was there because there was nothing else
        // to put on a card.
        composeRule.onAllNodesWithText("nest-abc…").fetchSemanticsNodes().let {
            assert(it.isEmpty()) { "the old nest card is still being drawn" }
        }
    }

    @Test
    fun aRegionWithNothingReportedIsStillAMap() {
        // The old screen replaced the entire tab with this message. Somebody looking at their own
        // empty surroundings has been told something useful; somebody looking at a blank panel
        // has not.
        coEvery { apiService.hornetNests() } returns
            HornetNestGeoJSON("FeatureCollection", emptyList())

        openTheMapTab()

        composeRule.onNodeWithTag("hornetNestMap").assertIsDisplayed()
        composeRule.onNodeWithText("No Nests Reported").assertIsDisplayed()
    }
}
