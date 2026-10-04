package com.hivepulse.app.monitoring

import android.content.Context
import io.sentry.Sentry
import io.sentry.SentryLevel
import io.sentry.protocol.SentryId
import io.sentry.android.core.SentryAndroid
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Crash reporting.
 *
 * Without a DSN nothing is started: debug builds, F-Droid-style builds from source and the
 * test suite then run with no reporting at all. With one, a crash reaches us instead of
 * only the user who lost their inspection.
 *
 * Beekeeper data must not travel with a report, so personal data is off and breadcrumbs
 * that record what was typed are dropped.
 */
object CrashReporting {

    /** Returns whether reporting was started — false when no DSN is configured. */
    fun start(context: Context, dsn: String, environment: String, release: String?): Boolean {
        if (!isConfigured(dsn)) return false

        SentryAndroid.init(context) { options ->
            options.dsn = dsn
            options.environment = environment
            release?.let { options.release = it }
            // No addresses, no account data: a crash report is debugging material, not analytics.
            options.isSendDefaultPii = false
            options.isEnableUserInteractionBreadcrumbs = false
            options.isAttachScreenshot = false
            options.isAttachViewHierarchy = false
            options.tracesSampleRate = 0.0
            options.setDiagnosticLevel(SentryLevel.ERROR)
            options.beforeBreadcrumb = io.sentry.SentryOptions.BeforeBreadcrumbCallback { breadcrumb, _ ->
                // "user typed …" breadcrumbs would carry hive notes.
                if (breadcrumb.category == "ui.input") null else breadcrumb
            }
        }
        return true
    }

    /** A DSN that is blank or still the placeholder means reporting stays off. */
    fun isConfigured(dsn: String?): Boolean =
        !dsn.isNullOrBlank() && dsn != "null" && dsn.startsWith("http")

    /**
     * Sends one deliberate report and waits for it to leave the device.
     *
     * An empty crash reporting channel looks exactly like a healthy one — in both cases
     * nothing arrives. This is the only way to tell the difference from a real phone, and
     * the only reason this is reachable from the settings screen at all.
     *
     * Returns the Sentry event id, or null when reporting is off or the send failed, so the
     * screen can say which of the two happened rather than claiming success.
     */
    suspend fun sendTestReport(): String? = withContext(Dispatchers.IO) {
        if (!Sentry.isEnabled()) return@withContext null

        val id = Sentry.captureException(
            CrashReportingSelfTest("Crash reporting self-test from the Android app — safe to resolve"),
        )
        // The id comes back before the report is on the wire; without the flush, backgrounding
        // the app right after tapping could discard it and we would report a false success.
        Sentry.flush(FLUSH_TIMEOUT_MS)
        if (id == SentryId.EMPTY_ID) null else id.toString()
    }

    private const val FLUSH_TIMEOUT_MS = 5_000L
}

/** Marks the self-test so it groups separately from real crashes and can be resolved as a batch. */
class CrashReportingSelfTest(message: String) : Exception(message)
