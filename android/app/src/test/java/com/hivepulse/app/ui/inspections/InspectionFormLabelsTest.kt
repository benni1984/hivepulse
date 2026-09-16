package com.hivepulse.app.ui.inspections

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * Regression: mood, population strength, yes/no and the queen-colour chips were hardcoded English
 * string literals in the composables, so the German and French forms showed "Calm / Nervous /
 * Aggressive". They are resources now — this guards that every locale actually carries them.
 */
class InspectionFormLabelsTest {

    private val keys = listOf(
        "mood_calm", "mood_nervous", "mood_aggressive",
        "population_low", "population_medium", "population_high",
        "label_yes", "label_no",
        "queen_color_white", "queen_color_yellow", "queen_color_red",
        "queen_color_green", "queen_color_blue",
    )

    private fun strings(dir: String): Map<String, String> {
        val file = listOf("src/main/res/$dir/strings.xml", "app/src/main/res/$dir/strings.xml")
            .map(::File).first(File::exists)
        return Regex("""<string name="([^"]+)"[^>]*>(.*?)</string>""", RegexOption.DOT_MATCHES_ALL)
            .findAll(file.readText())
            .associate { it.groupValues[1] to it.groupValues[2] }
    }

    @Test
    fun `every locale defines the inspection picker labels`() {
        for (dir in listOf("values", "values-de", "values-fr")) {
            val strings = strings(dir)
            for (key in keys) {
                assertTrue("$key missing in $dir", strings.containsKey(key))
                assertTrue("$key empty in $dir", strings.getValue(key).isNotBlank())
            }
        }
    }

    @Test
    fun `german labels are not left in english`() {
        val de = strings("values-de")
        assertTrue(de.getValue("mood_calm").endsWith("Ruhig"))
        assertTrue(de.getValue("mood_aggressive").endsWith("Aggressiv"))
        assertEquals("Weiß", de.getValue("queen_color_white"))
    }

    // Weight stepper (parity with the iOS form, which only had a free-text field)

    @Test
    fun `stepping an empty weight starts from zero`() {
        assertEquals("0.5", steppedWeight("", 0.5))
    }

    @Test
    fun `whole numbers lose the decimal`() {
        assertEquals("2", steppedWeight("1.5", 0.5))
    }

    @Test
    fun `a comma decimal separator is accepted`() {
        assertEquals("3", steppedWeight("2,5", 0.5))
    }

    @Test
    fun `weight never goes negative`() {
        assertEquals("0", steppedWeight("0.5", -0.5))
        assertEquals("0", steppedWeight("0", -0.5))
    }
}
