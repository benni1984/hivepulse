package com.hivepulse.app.ui.calendar

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import java.io.File
import org.junit.Test

/**
 * The photographs are generated into `YearPhotos.kt` by `scripts/fetch_year_photos.py` together
 * with the website's and the iPhone's copies, so none of the three can drift from the others.
 *
 * What can still go wrong is the thing the generator cannot see: a manifest that names a file
 * which is not in the app. That ships a blank space where a picture should be, and nothing in a
 * build or a lint run notices. These tests are the guard.
 *
 * The licence is the other half. Most of these pictures are CC BY or CC BY-SA, which oblige us to
 * name the author wherever the picture is shown; a photograph that arrived without an author or a
 * licence would be a breach, not a cosmetic gap.
 */
class YearPhotosTests {

    /** Unit tests run with the module directory as the working directory. */
    private val assets = File("src/main/assets")

    @Test
    fun `every photograph in the manifest is really in the app`() {
        for ((key, photo) in YearPhotos.BY_KEY) {
            assertTrue("$key: ${photo.file} is missing from the assets", File(assets, photo.file).isFile)
            assertTrue("$key: ${photo.thumb} is missing from the assets", File(assets, photo.thumb).isFile)
        }
    }

    @Test
    fun `every photograph in the app is named by the manifest`() {
        // The other direction: a file left behind after it was dropped from PICKS ships for ever
        // as dead weight, and with no credit anywhere, which is the licence problem in reverse.
        val named = YearPhotos.BY_KEY.values.map { File(assets, it.file).canonicalFile }.toSet()
        val present = File(assets, "year").listFiles { f: File -> f.extension == "webp" }
            ?.map { it.canonicalFile }?.toSet() ?: emptySet()
        assertEquals("unreferenced photographs in the assets", emptySet<File>(), present - named)
    }

    @Test
    fun `every picture carries an author and a licence`() {
        for ((key, photo) in YearPhotos.BY_KEY) {
            assertTrue("$key has no author", photo.author.isNotBlank())
            assertTrue("$key has no licence", photo.licence.isNotBlank())
            assertTrue("$key has no source page", photo.source.startsWith("https://commons.wikimedia.org/"))
        }
    }

    @Test
    fun `a licence that has a deed links to it`() {
        // Public domain has no deed to link to -- there is no licence, which is the point -- and
        // Commons sends an empty licence URL for those. Everything under a Creative Commons
        // licence has one, and that link is part of what the licence asks us to show.
        for ((key, photo) in YearPhotos.BY_KEY) {
            if (photo.licence.lowercase().startsWith("public domain")) {
                assertEquals("$key is public domain and needs no deed", "", photo.licenceUrl)
            } else {
                assertTrue("$key has no licence link", photo.licenceUrl.startsWith("http"))
            }
        }
    }

    @Test
    fun `only licences we may actually use`() {
        // The generator refuses anything else; this fails the build if one ever slips through a
        // hand edit of the generated file.
        val allowed = Regex("^(cc0|cc by(-sa)?( [0-9.]+.*)?|public domain|pd[- ])", RegexOption.IGNORE_CASE)
        for ((key, photo) in YearPhotos.BY_KEY) {
            assertTrue("$key: ${photo.licence} is not one we may use", allowed.containsMatchIn(photo.licence))
        }
    }

    @Test
    fun `every forage has the picture of its plant`() {
        // A forage is one bar on the ribbon, named after the plant; without the plant's picture
        // the bar would show the honey extractor, which looks the same in every month.
        val forages = listOf(
            "rapeseed", "acacia", "chestnut", "linden", "fir", "lavender", "sunflower", "heather",
        )
        for (forage in forages) {
            assertNotNull("$forage has no plant picture", YearPhotos.BY_FORAGE[forage])
        }
    }

    @Test
    fun `a forage entry shows the plant whatever the job is`() {
        // The harvest of the rape and the move to the rape are one bar and must not show two
        // different pictures.
        val move = YearPhotos.of("migrate-rapeseed", "rapeseed")
        val harvest = YearPhotos.of("harvest-rapeseed", "rapeseed")
        assertEquals(move, harvest)
        assertNotNull(move)
    }

    @Test
    fun `an entry with no picture asks for none`() {
        // Five jobs have no usable photograph (see WITHOUT in the generator, and issue 412). The
        // layouts draw the icon instead, so null is the expected answer and not a failure.
        for (key in listOf("candy-feeding", "winter-feeding", "foulbrood-sample", "winter-prep", "oxalic-acid")) {
            assertNull("$key unexpectedly has a picture", YearPhotos.of(key))
        }
    }

    @Test
    fun `an unknown honey falls back to the job's own picture`() {
        // A forage the app does not know yet must not blank the picture of the entry.
        assertEquals(YearPhotos.BY_KEY["winter-rest"], YearPhotos.of("winter-rest", "some-new-plant"))
    }
}
