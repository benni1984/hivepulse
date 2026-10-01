package com.hivepulse.app.monitoring

import android.content.Context
import io.sentry.SentryLevel
import io.sentry.android.core.SentryAndroid

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
}
