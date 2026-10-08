package com.hivepulse.app.data.local

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class AppLanguageTest {

    @Test
    fun `a region is not a different language`() {
        assertEquals("de", AppLanguage.normalize("de-DE"))
        assertEquals("fr", AppLanguage.normalize("fr_CA"))
        assertEquals("es", AppLanguage.normalize("ES"))
        assertEquals("pl", AppLanguage.normalize("pl-PL"))
    }

    @Test
    fun `the five shipped languages are recognised`() {
        assertEquals(listOf("en", "de", "fr", "es", "pl"), AppLanguage.supported.mapNotNull { AppLanguage.normalize(it) })
    }

    @Test
    fun `a language the app has no texts for is nothing`() {
        assertNull(AppLanguage.normalize("it"))
        assertNull(AppLanguage.normalize(""))
        assertNull(AppLanguage.normalize(null))
    }
}
