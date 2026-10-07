package com.hivepulse.app

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import javax.xml.parsers.DocumentBuilderFactory

/**
 * Every language must carry every string. Spanish had no values-es at all and German and
 * French were missing 90 strings (the whole hornet tracker, the account screen, the public-map
 * switch), which silently fell back to English instead of failing anywhere.
 */
class TranslationCompletenessTest {

    private val locales = listOf("values-de", "values-fr", "values-es", "values-pl")

    private fun strings(folder: String): Map<String, String> {
        val file = File("src/main/res/$folder/strings.xml")
        assertTrue("missing $folder/strings.xml", file.exists())
        val doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(file)
        val nodes = doc.getElementsByTagName("string")
        return (0 until nodes.length).associate { i ->
            val node = nodes.item(i)
            node.attributes.getNamedItem("name").nodeValue to (node.textContent ?: "")
        }
    }

    private val english = strings("values")

    @Test
    fun `every locale defines every string`() {
        for (folder in locales) {
            val translated = strings(folder)
            val missing = (english.keys - translated.keys).sorted()
            assertEquals("$folder is missing translations: $missing", emptyList<String>(), missing)
        }
    }

    @Test
    fun `no locale defines strings that english does not have`() {
        for (folder in locales) {
            val extra = (strings(folder).keys - english.keys).sorted()
            assertEquals("$folder has stale keys: $extra", emptyList<String>(), extra)
        }
    }

    @Test
    fun `format placeholders match the english original`() {
        val placeholder = Regex("""%\d+\$[sd]""")
        for (folder in locales) {
            for ((key, value) in strings(folder)) {
                val expected = placeholder.findAll(english.getValue(key)).map { it.value }.sorted().toList()
                val actual = placeholder.findAll(value).map { it.value }.sorted().toList()
                assertEquals("$folder/$key has different placeholders", expected, actual)
            }
        }
    }

    @Test
    fun `the help link points at the matching language`() {
        assertEquals("https://hivepulse.multihead.de/de/help", strings("values-de").getValue("url_help"))
        assertEquals("https://hivepulse.multihead.de/fr/help", strings("values-fr").getValue("url_help"))
        assertEquals("https://hivepulse.multihead.de/es/help", strings("values-es").getValue("url_help"))
        assertEquals("https://hivepulse.multihead.de/pl/help", strings("values-pl").getValue("url_help"))
    }

    @Test
    fun `user facing screens do not hardcode english text`() {
        val offenders = mutableListOf<String>()
        val literal = Regex("""(?:contentDescription\s*=\s*|Text\(\s*)"([A-Z][A-Za-z ]{3,})"""")
        File("src/main/java/com/hivepulse/app/ui").walkTopDown()
            .filter { it.extension == "kt" }
            .forEach { file ->
                file.readLines().forEachIndexed { index, line ->
                    if ("stringResource" in line) return@forEachIndexed
                    literal.findAll(line).forEach { match ->
                        val text = match.groupValues[1]
                        if (text != "HivePulse") offenders += "${file.name}:${index + 1} \"$text\""
                    }
                }
            }
        assertEquals("hardcoded English in the UI: $offenders", emptyList<String>(), offenders)
    }

    @Test
    fun `the colony mood is looked up, never printed raw`() {
        // The hive detail list and the inspection detail both rendered the stored API value
        // with a capital letter, so a German beekeeper read "Calm" and "Nervous" between
        // "Kontrollen" and "Stark". The strings had existed in all four languages the whole
        // time — nothing looked them up. check_i18n.py cannot see this: the keys are present,
        // they are simply unused.
        val moods = listOf("calm", "nervous", "aggressive")
        val resources = moods.map { com.hivepulse.app.ui.inspections.moodLabelRes(it) }
        assertEquals("each mood needs its own string", moods.size, resources.toSet().size)

        val offenders = File("src/main/java/com/hivepulse/app/ui").walkTopDown()
            .filter { it.extension == "kt" }
            .filter { file ->
                file.readLines().any { line ->
                    line.contains("mood", ignoreCase = true) &&
                        (line.contains("replaceFirstChar") || line.contains(".uppercase()"))
                }
            }
            .map { it.name }
            .toList()

        assertEquals("these screens print the raw mood instead of the translation",
                     emptyList<String>(), offenders)
    }

    @Test
    fun `the locale config lists exactly the languages that have translations`() {
        // Without this file Android gives the app no entry under Settings - Apps - Language,
        // so a beekeeper whose phone is in English cannot read HivePulse in German. A list
        // that drifts from the values-* folders is worse than none: it offers a language the
        // app cannot actually show.
        val config = File("src/main/res/xml/locales_config.xml")
        assertTrue("missing res/xml/locales_config.xml", config.exists())

        val declared = Regex("""android:name="([a-z-]+)"""")
            .findAll(config.readText())
            .map { it.groupValues[1] }
            .toSortedSet()
        val translated = (listOf("en") + locales.map { it.removePrefix("values-") }).toSortedSet()

        assertEquals("locales_config.xml and the values-* folders disagree", translated, declared)

        val manifest = File("src/main/AndroidManifest.xml").readText()
        assertTrue(
            "AndroidManifest must point at the locale config, or it has no effect",
            manifest.contains("android:localeConfig=\"@xml/locales_config\""),
        )
    }

}
