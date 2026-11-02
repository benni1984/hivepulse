package com.hivepulse.app

import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * R8 only runs on the release build, which no unit test and no instrumented test builds. A rule
 * that disappears, or a class that is serialised with Gson outside the package the rules keep,
 * is therefore noticed only on a device with the release build. These tests read the rules and
 * the sources, which is crude but catches both.
 */
class ProguardRulesTest {

    private val rules = File("proguard-rules.pro").readText()
    private val sources = File("src/main/java/com/hivepulse/app")
    private val apiPackage = File(sources, "data/api")

    @Test
    fun `the field names of the api classes survive R8`() {
        // Gson matches by field name, and the same classes are stored as JSON in Room.
        assertTrue(rules.contains("-keepclassmembers class com.hivepulse.app.data.api.**"))
        assertTrue(rules.contains("<fields>;"))
        assertTrue(rules.contains("<init>(...);"))
    }

    @Test
    fun `the encrypted token storage keeps what Tink reads by field name`() {
        assertTrue(rules.contains("com.google.crypto.tink.shaded.protobuf.GeneratedMessageLite"))
    }

    @Test
    fun `stack traces stay readable in the Play Console`() {
        assertTrue(rules.contains("-keepattributes SourceFile,LineNumberTable"))
        assertTrue(rules.contains("-renamesourcefileattribute SourceFile"))
    }

    @Test
    fun `every class read with Gson lives in the package the rules keep`() {
        val apiSource = apiPackage.walk().filter { it.extension == "kt" }.joinToString("\n") { it.readText() }
        val readWithGson = Regex("""fromJson\([^)]*?,\s*([A-Z]\w*)::class\.java\)""")

        val strays = sources.walk()
            .filter { it.extension == "kt" && !it.path.contains("/data/api/") }
            .flatMap { file -> readWithGson.findAll(file.readText()).map { it.groupValues[1] } }
            .distinct()
            .filterNot { Regex("""(enum\s+)?class\s+$it\b""").containsMatchIn(apiSource) }
            .toList()

        assertTrue(
            "Gson reads $strays, which are not declared in data/api; R8 would rename their " +
                "fields. Move them there or extend proguard-rules.pro.",
            strays.isEmpty(),
        )
    }

    @Test
    fun `every request body of the api is declared in the package the rules keep`() {
        val apiSource = apiPackage.walk().filter { it.extension == "kt" }.joinToString("\n") { it.readText() }
        val body = Regex("""@Body\s+\w+\s*:\s*([A-Z]\w*)""")

        // A Map or a List has no fields of its own for R8 to rename.
        val standardTypes = setOf("Map", "List", "Set", "String")

        val strays = body.findAll(File(apiPackage, "ApiService.kt").readText())
            .map { it.groupValues[1] }
            .distinct()
            .filterNot { it in standardTypes }
            .filterNot { Regex("""(enum\s+)?class\s+$it\b""").containsMatchIn(apiSource) }
            .toList()

        assertTrue("request bodies outside data/api: $strays", strays.isEmpty())
    }
}
