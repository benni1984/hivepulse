package com.hivepulse.app.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

private val LightColors = lightColorScheme(
    primary            = Amber500,
    onPrimary          = Stone900,
    primaryContainer   = Amber200,
    onPrimaryContainer = Amber900,
    secondary          = Forest600,
    onSecondary        = Color.White,
    background         = Stone50,
    onBackground       = Stone900,
    surface            = Color.White,
    onSurface          = Stone900,
    surfaceVariant     = Stone100,
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
