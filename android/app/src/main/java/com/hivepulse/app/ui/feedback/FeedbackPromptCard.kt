package com.hivepulse.app.ui.feedback

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.hivepulse.app.R
import com.hivepulse.app.ui.theme.Stone200

/**
 * One question, once, three days in (#546).
 *
 * The button goes to the **Play Store page** and not to a mail, because an answer written there
 * is what lands on the Play Console's testing-feedback page — the record Google reads when it
 * judges whether a closed test was a real one. Settings → Send feedback has gone there since it
 * was written, for the same reason; the only new thing here is that somebody is asked instead of
 * having to go looking.
 *
 * The iPhone and the website show the same card with the same words and open a mail, which is
 * what they have.
 */
@Composable
fun FeedbackPromptCard(onAnswered: () -> Unit) {
    val context = LocalContext.current

    Card(
        modifier  = Modifier.fillMaxWidth().testTag("feedbackPromptCard"),
        shape     = MaterialTheme.shapes.large,
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border    = BorderStroke(1.dp, Stone200),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                stringResource(R.string.feedback_ask_title),
                style = MaterialTheme.typography.titleMedium,
            )
            Text(
                stringResource(R.string.feedback_ask_body),
                style = MaterialTheme.typography.bodyMedium,
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Button(
                    onClick = {
                        openStoreListing(context)
                        onAnswered()
                    },
                    modifier = Modifier.testTag("feedbackPromptSend"),
                ) {
                    Text(stringResource(R.string.action_feedback))
                }
                TextButton(
                    onClick = onAnswered,
                    modifier = Modifier.testTag("feedbackPromptDismiss"),
                ) {
                    Text(stringResource(R.string.feedback_ask_dismiss))
                }
            }
        }
    }
}

/**
 * The store app first, the browser second.
 *
 * `market://` opens the Play app, which is where the feedback form lives. A device without it —
 * an emulator, a device sold outside Google's reach — has no such activity and would crash the
 * application on an uncaught `ActivityNotFoundException`, so the https address is the fallback.
 * This mirrors the Settings row exactly; the two must not drift, because only one of them is
 * ever tested by hand.
 */
private fun openStoreListing(context: android.content.Context) {
    val id = context.packageName
    try {
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$id")))
    } catch (_: ActivityNotFoundException) {
        try {
            context.startActivity(Intent(
                Intent.ACTION_VIEW,
                Uri.parse("https://play.google.com/store/apps/details?id=$id")))
        } catch (_: ActivityNotFoundException) {
            // No store and no browser. Nothing to offer and nothing worth an error message:
            // the card closes, which is what the tap asked for.
        }
    }
}
