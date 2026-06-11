package com.hivepulse.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.hivepulse.app.R

val DmSans = FontFamily(
    Font(R.font.dm_sans_regular,   FontWeight.Normal),
    Font(R.font.dm_sans_medium,    FontWeight.Medium),
    Font(R.font.dm_sans_bold,      FontWeight.Bold),
    Font(R.font.dm_sans_extrabold, FontWeight.ExtraBold),
)

val HivePulseTypography = Typography(
    displayMedium = TextStyle(fontFamily = DmSans, fontWeight = FontWeight.ExtraBold, fontSize = 45.sp, letterSpacing = (-0.5).sp),
    headlineLarge = TextStyle(fontFamily = DmSans, fontWeight = FontWeight.ExtraBold, fontSize = 32.sp, letterSpacing = (-0.5).sp),
    headlineMedium= TextStyle(fontFamily = DmSans, fontWeight = FontWeight.Bold,      fontSize = 28.sp),
    headlineSmall = TextStyle(fontFamily = DmSans, fontWeight = FontWeight.Bold,      fontSize = 24.sp),
    titleLarge    = TextStyle(fontFamily = DmSans, fontWeight = FontWeight.Bold,      fontSize = 22.sp),
    titleMedium   = TextStyle(fontFamily = DmSans, fontWeight = FontWeight.Medium,    fontSize = 16.sp),
    titleSmall    = TextStyle(fontFamily = DmSans, fontWeight = FontWeight.Medium,    fontSize = 14.sp),
    bodyLarge     = TextStyle(fontFamily = DmSans, fontWeight = FontWeight.Normal,    fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium    = TextStyle(fontFamily = DmSans, fontWeight = FontWeight.Normal,    fontSize = 14.sp, lineHeight = 20.sp),
    bodySmall     = TextStyle(fontFamily = DmSans, fontWeight = FontWeight.Normal,    fontSize = 12.sp, lineHeight = 16.sp),
    labelLarge    = TextStyle(fontFamily = DmSans, fontWeight = FontWeight.Medium,    fontSize = 14.sp),
    labelMedium   = TextStyle(fontFamily = DmSans, fontWeight = FontWeight.Medium,    fontSize = 12.sp, letterSpacing = 0.5.sp),
    labelSmall    = TextStyle(fontFamily = DmSans, fontWeight = FontWeight.Medium,    fontSize = 11.sp, letterSpacing = 0.5.sp),
)
