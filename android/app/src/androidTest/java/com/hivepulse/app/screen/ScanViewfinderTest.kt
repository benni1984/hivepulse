package com.hivepulse.app.screen

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.ui.qr.ScanViewfinder
import com.hivepulse.app.ui.theme.HivePulseTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * The scan screen's overlay, on its own.
 *
 * Testing it through [com.hivepulse.app.ui.qr.QRScanScreen] would mean a camera permission and a
 * working CameraX preview on the runner -- a test that fails for reasons that have nothing to do
 * with the thing under test. [ScanViewfinder] takes neither, which is the point of it being a
 * composable of its own.
 *
 * What this pins is that the overlay *draws something*. Its predecessor was a `Surface` with
 * `alpha = 0f` and an empty body: present in the tree, correct in structure, invisible on screen,
 * and shipped that way (#424). A test that only asserted the node existed would have passed on it.
 */
@RunWith(AndroidJUnit4::class)
class ScanViewfinderTest {

    @get:Rule val composeRule = createComposeRule()

    private fun show() {
        composeRule.setContent { HivePulseTheme { ScanViewfinder() } }
    }

    @Test
    fun tells_the_beekeeper_what_to_aim_at() {
        show()
        composeRule
            .onNodeWithText("Scan the QR code on your hive to open its record or set it up for the first time.")
            .assertIsDisplayed()
    }

    @Test
    fun the_frame_is_on_screen_and_has_a_spoken_name() {
        show()
        // assertIsDisplayed, not assertExists: the old overlay existed and was invisible.
        composeRule
            .onNodeWithContentDescription("Viewfinder — hold the QR code inside the frame")
            .assertIsDisplayed()
    }
}
