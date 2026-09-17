package com.hivepulse.app.ui.inspections

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
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
        "field_varroa_level", "varroa_level_0", "varroa_level_1", "varroa_level_2", "varroa_level_3",
        "title_edit_hive", "field_hive_name_edit", "action_save_hive", "hint_acquisition_date",
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

    // Word scales

    @Test
    fun `colony strength words map to 1 to 3`() {
        assertEquals(1, populationStrengthFor(0))
        assertEquals(2, populationStrengthFor(1))
        assertEquals(3, populationStrengthFor(2))
        assertNull(populationStrengthFor(null))
        assertNull(populationStrengthFor(3))
    }

    @Test
    fun `strong is no longer sent as 9`() {
        // The old mapping sent 1 / 5 / 9 and the API rejected 9, so "strong" never saved.
        assertTrue((0..2).mapNotNull(::populationStrengthFor).all { it in 1..3 })
    }

    @Test
    fun `varroa words map to levels 0 to 3`() {
        assertEquals(listOf(0, 1, 2, 3), (0..3).map { varroaLevelFor(it) })
        assertNull(varroaLevelFor(null))
        assertNull(varroaLevelFor(4))
    }

    @Test
    fun `stored values map back to words`() {
        assertEquals(com.hivepulse.app.R.string.population_high, strengthLabelRes(3))
        assertEquals(com.hivepulse.app.R.string.varroa_level_0, varroaLabelRes(0))
        assertEquals(com.hivepulse.app.R.string.varroa_level_3, varroaLabelRes(3))
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
