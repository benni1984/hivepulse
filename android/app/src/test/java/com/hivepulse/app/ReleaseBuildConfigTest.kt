package com.hivepulse.app

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Release-only build settings cannot be reached from a unit test, and getting them wrong is
 * only noticed on an upload that Google Play rejects. Reading the build script is crude but
 * it does catch the two mistakes that actually happen: a signing config that silently
 * disappears, and a version that stops being settable from the release workflow.
 */
class ReleaseBuildConfigTest {

    private val buildScript = java.io.File("build.gradle.kts").readText()

    @Test
    fun `the release build is signed when a keystore is supplied`() {
        assertTrue(
            "release must take its signing config from the keystore the workflow writes",
            buildScript.contains("signingConfig = signingConfigs.findByName(\"release\")"),
        )
        assertTrue(buildScript.contains("ANDROID_KEYSTORE_FILE"))
    }

    @Test
    fun `the version comes from the build, not from a hardcoded number`() {
        // Play refuses a version code it has seen before, so the workflow has to set it.
        assertTrue(buildScript.contains("VERSION_CODE"))
        assertTrue(buildScript.contains("VERSION_NAME"))
        assertTrue(buildScript.contains("versionCode   = buildVersionCode"))
        assertTrue(buildScript.contains("versionName   = buildVersionName"))
    }

    @Test
    fun `no keystore or password is written into the repository`() {
        // The keystore arrives as a secret at build time; a path or password in here would
        // mean it is checked in somewhere.
        assertFalse(buildScript.contains(".jks\""))
        assertFalse(buildScript.contains("storePassword = \""))
        assertFalse(buildScript.contains("keyPassword = \""))
    }
}
