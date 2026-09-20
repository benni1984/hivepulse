package com.hivepulse.app.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

internal val LightColors = lightColorScheme(
    primary            = Amber500,
    onPrimary          = Stone900,
    primaryContainer   = Amber200,
    onPrimaryContainer = Amber900,
    secondary          = Forest600,
    onSecondary        = Color.White,
    // Tonal surfaces (FilledTonalIconButton, chips). Without these, Material falls back to its
    // default lilac, which is what the number steppers used to show.
    secondaryContainer   = Amber200,
    onSecondaryContainer = Amber900,
    background         = Stone50,
    onBackground       = Stone900,
    surface            = Color.White,
    onSurface          = Stone900,
    surfaceVariant     = Stone100,
    // Card/sheet elevation levels. Material's defaults are lilac-tinted, which showed up on
    // every Card that does not set its own container colour (e.g. the hive statistics card).
    surfaceContainerLowest  = Color.White,
    surfaceContainerLow     = Color.White,
    surfaceContainer        = Stone50,
    surfaceContainerHigh    = Stone100,
    surfaceContainerHighest = Stone100,
    surfaceTint             = Amber500,
    // Tertiary defaults are pink; keep the brand greens instead
    tertiary            = Forest600,
    onTertiary          = Color.White,
    tertiaryContainer   = Amber200,
    onTertiaryContainer = Amber900,
    outlineVariant      = Stone200,
    onSurfaceVariant   = Stone500,
    outline            = Stone200,
    error              = Red500,
    onError            = Color.White,
    errorContainer     = Color(0xFFFFE4E4),
    onErrorContainer   = Color(0xFF7F1D1D),
)

private val HivePulseShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small      = RoundedCornerShape(8.dp),
    medium     = RoundedCornerShape(12.dp),
    large      = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(20.dp),
)

@Composable
fun HivePulseTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColors,
        typography  = HivePulseTypography,
        shapes      = HivePulseShapes,
        content     = content,
    )
}
