package com.hivepulse.app.ui.common

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri

/**
 * Opens a PDF that was saved to Downloads, in whatever viewer the phone has.
 *
 * Shared because two screens hand a beekeeper a document now: the QR sheet and the treatment
 * record (#477). It lived privately in the QR screen until the second one needed it, and a
 * second copy would have been the start of the two drifting apart.
 *
 * Returns false when no viewer is installed, which is not an error — the file is saved either
 * way, and the caller says so instead of showing a failure.
 */
fun Context.openSavedPdf(uri: String): Boolean = try {
    startActivity(
        Intent(Intent.ACTION_VIEW)
            .setDataAndType(Uri.parse(uri), "application/pdf")
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
    )
    true
} catch (e: ActivityNotFoundException) {
    false
}
