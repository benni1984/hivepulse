package com.hivepulse.app.monitoring

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * A build without a DSN must not start reporting at all — that is what keeps debug builds,
 * builds made from source and the test suite from sending anything anywhere.
 */
class CrashReportingTest {

    @Test
    fun `a real dsn enables reporting`() {
        assertTrue(CrashReporting.isConfigured("https://key@o1.ingest.sentry.io/42"))
    }

    @Test
    fun `an empty or missing dsn keeps reporting off`() {
        assertFalse(CrashReporting.isConfigured(""))
        assertFalse(CrashReporting.isConfigured("   "))
        assertFalse(CrashReporting.isConfigured(null))
    }

    @Test
    fun `the string null from an unset gradle property keeps reporting off`() {
        // -PSENTRY_DSN with no value, or a missing environment variable, lands here.
        assertFalse(CrashReporting.isConfigured("null"))
    }

    @Test
    fun `something that is not a dsn keeps reporting off`() {
        assertFalse(CrashReporting.isConfigured("your-dsn-here"))
        assertFalse(CrashReporting.isConfigured("sentry.io/42"))
    }

    @Test
    fun `the manifest switches off sentry's own auto start`() {
        // Sentry's ContentProvider throws "DSN is required" at app launch when the manifest
        // carries no DSN, so every build without one would crash on start.
        val manifest = java.io.File("src/main/AndroidManifest.xml").readText()
        assertTrue(
            "io.sentry.auto-init must stay false — the app starts the SDK itself",
            manifest.contains("io.sentry.auto-init") && manifest.contains("android:value=\"false\""),
        )
    }
}
