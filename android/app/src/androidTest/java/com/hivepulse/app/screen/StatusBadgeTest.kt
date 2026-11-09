package com.hivepulse.app.screen

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.hivepulse.app.ui.common.StatusBadge
import com.hivepulse.app.ui.theme.HivePulseTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * A hive type, a forage, a sighting status and an advice label are not actions.
 *
 * They were drawn as `AssistChip` and `SuggestionChip` with an empty `onClick` (#429), which is
 * to say as Material buttons: a ripple under the finger, a stop in the focus order, and TalkBack
 * offering each one as something to double-tap to activate. Six promises of an action that was
 * never there.
 *
 * `hasClickAction()` is the assertion that matters here. The text would have been right either
 * way; what was wrong was that the thing could be pressed.
 */
@RunWith(AndroidJUnit4::class)
class StatusBadgeTest {

    @get:Rule val composeRule = createComposeRule()

    @Test
    fun shows_its_text() {
        composeRule.setContent { HivePulseTheme { StatusBadge("Oberträgerbeute") } }
        composeRule.onNodeWithText("Oberträgerbeute").assertIsDisplayed()
    }

    @Test
    fun is_a_label_and_not_a_button() {
        composeRule.setContent { HivePulseTheme { StatusBadge("Oberträgerbeute") } }
        composeRule.onNode(hasClickAction()).assertDoesNotExist()
    }
}
