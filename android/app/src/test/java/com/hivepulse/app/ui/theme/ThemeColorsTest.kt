package com.hivepulse.app.ui.theme

import org.junit.Assert.assertEquals
import org.junit.Test

/** The palette must come from the brand tokens — no Material default lilac anywhere. */
class ThemeColorsTest {

    @Test
    fun `tonal surfaces use the amber tokens`() {
        // FilledTonalIconButton (the number steppers) paints with secondaryContainer.
        assertEquals(Amber200, LightColors.secondaryContainer)
        assertEquals(Amber900, LightColors.onSecondaryContainer)
    }

    @Test
    fun `primary stays amber on stone`() {
        assertEquals(Amber500, LightColors.primary)
        assertEquals(Amber200, LightColors.primaryContainer)
    }

    @Test
    fun `no colour is the material default purple`() {
        val materialPurples = listOf(0xFF6750A4, 0xFFE8DEF8, 0xFFEADDFF, 0xFF625B71)
            .map { androidx.compose.ui.graphics.Color(it) }
        val used = listOf(
            LightColors.primary, LightColors.onPrimary, LightColors.primaryContainer,
            LightColors.onPrimaryContainer, LightColors.secondary, LightColors.onSecondary,
            LightColors.secondaryContainer, LightColors.onSecondaryContainer,
            LightColors.background, LightColors.surface, LightColors.surfaceVariant,
        )
        used.forEach { color -> assertEquals(false, color in materialPurples) }
    }
}
