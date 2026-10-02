package com.hivepulse.app.ui.hives

import com.hivepulse.app.R
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * The dropdown used to show the stored values, prettified in English: "Top Bar", "Langstroth".
 * A German beekeeper reading "Top Bar" in an otherwise German form is a translation gap, not
 * a style choice.
 */
class HiveTypeLabelTest {

    @Test
    fun `every type the API accepts has its own label`() {
        assertEquals(R.string.hive_type_langstroth, hiveTypeLabelRes("langstroth"))
        assertEquals(R.string.hive_type_dadant, hiveTypeLabelRes("dadant"))
        assertEquals(R.string.hive_type_top_bar, hiveTypeLabelRes("top_bar"))
        assertEquals(R.string.hive_type_warre, hiveTypeLabelRes("warre"))
        assertEquals(R.string.hive_type_other, hiveTypeLabelRes("other"))
    }

    @Test
    fun `the list the form offers is fully covered`() {
        // A type in the list without a label would render as an empty row.
        val distinct = HIVE_TYPES.map { hiveTypeLabelRes(it) }.distinct()
        assertEquals("each type needs its own label", HIVE_TYPES.size, distinct.size)
    }

    @Test
    fun `an unknown value falls back instead of crashing`() {
        // The server could add a type before the app knows about it.
        assertEquals(R.string.hive_type_other, hiveTypeLabelRes("skep"))
        assertEquals(R.string.hive_type_other, hiveTypeLabelRes(""))
    }
}
