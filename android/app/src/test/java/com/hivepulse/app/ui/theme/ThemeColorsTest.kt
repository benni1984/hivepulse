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
    fun `card surfaces are stone, not material's lilac elevation tints`() {
        // Cards without an explicit containerColor paint with surfaceContainerLow.
        assertEquals(androidx.compose.ui.graphics.Color.White, LightColors.surfaceContainerLow)
        assertEquals(Stone50, LightColors.surfaceContainer)
        assertEquals(Stone100, LightColors.surfaceContainerHighest)
    }

    @Test
    fun `no colour is the material default purple`() {
        val materialPurples = listOf(
            0xFF6750A4, 0xFFE8DEF8, 0xFFEADDFF, 0xFF625B71,
            0xFFE7E0EC, 0xFFF3EDF7, 0xFFECE6F0, 0xFF7D5260, 0xFFFFD8E4, 0xFFCAC4D0,
        )
            .map { androidx.compose.ui.graphics.Color(it) }
        val used = listOf(
            LightColors.primary, LightColors.onPrimary, LightColors.primaryContainer,
            LightColors.onPrimaryContainer, LightColors.secondary, LightColors.onSecondary,
            LightColors.secondaryContainer, LightColors.onSecondaryContainer,
            LightColors.tertiary, LightColors.tertiaryContainer, LightColors.onTertiaryContainer,
            LightColors.background, LightColors.surface, LightColors.surfaceVariant,
            LightColors.surfaceContainerLowest, LightColors.surfaceContainerLow,
            LightColors.surfaceContainer, LightColors.surfaceContainerHigh,
            LightColors.surfaceContainerHighest, LightColors.outlineVariant,
        )
        used.forEach { color -> assertEquals(false, color in materialPurples) }
    }
}
