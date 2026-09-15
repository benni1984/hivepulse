package com.hivepulse.app.ui.onboarding

import androidx.activity.compose.BackHandler
import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Checklist
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.ui.res.painterResource
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import com.hivepulse.app.R
import com.hivepulse.app.data.local.OnboardingStore
import com.hivepulse.app.ui.auth.HivePulseHexIcon
import com.hivepulse.app.ui.theme.Amber500
import com.hivepulse.app.ui.theme.Amber600
import com.hivepulse.app.ui.theme.Stone200
import com.hivepulse.app.ui.theme.Stone50
import com.hivepulse.app.ui.theme.Stone500
import com.hivepulse.app.ui.theme.Stone900
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class GuidedTourViewModel @Inject constructor(
    private val store: OnboardingStore
) : ViewModel() {
    /** Called when the tour is finished or skipped, so it isn't shown again after the next sign-in. */
    fun complete() {
        store.hasSeenGuidedTour = true
    }
}

/** One page of the tour; with neither `icon` nor `iconRes` it shows the HivePulse logo instead. */
private data class TourPage(
    val icon: ImageVector?,
    @StringRes val title: Int,
    @StringRes val body: Int,
    @DrawableRes val iconRes: Int? = null,
)

private val TOUR_PAGES = listOf(
    TourPage(null, R.string.tour_welcome_title, R.string.tour_welcome_body),
    TourPage(Icons.Default.QrCodeScanner, R.string.tour_qr_title, R.string.tour_qr_body),
    TourPage(Icons.Default.Checklist, R.string.tour_inspections_title, R.string.tour_inspections_body),
    TourPage(Icons.Default.BarChart, R.string.tour_stats_title, R.string.tour_stats_body),
    TourPage(Icons.Default.NotificationsActive, R.string.tour_reminders_title, R.string.tour_reminders_body),
    TourPage(null, R.string.tour_hornets_title, R.string.tour_hornets_body, iconRes = R.drawable.ic_hornet),
)

/** Swipeable introduction shown once after the first sign-in on a device (and on demand from Settings). */
@Composable
fun GuidedTourScreen(
    onFinished: () -> Unit,
    vm: GuidedTourViewModel = hiltViewModel()
) {
    val pagerState = rememberPagerState(pageCount = { TOUR_PAGES.size })
    val scope = rememberCoroutineScope()
    val isLastPage = pagerState.currentPage == TOUR_PAGES.lastIndex
    val finish: () -> Unit = {
        vm.complete()
        onFinished()
    }

    // System back behaves like "Skip"
    BackHandler { finish() }

    Column(
        Modifier
            .fillMaxSize()
            .background(Stone50)
            .padding(horizontal = 24.dp, vertical = 16.dp)
    ) {
        Row(Modifier.fillMaxWidth().heightIn(min = 48.dp), horizontalArrangement = Arrangement.End) {
            if (!isLastPage) {
                TextButton(onClick = finish) {
                    Text(stringResource(R.string.tour_skip), color = Stone500)
                }
            }
        }

        HorizontalPager(state = pagerState, modifier = Modifier.weight(1f).fillMaxWidth()) { page ->
            TourPageContent(TOUR_PAGES[page])
        }

        Row(Modifier.fillMaxWidth().padding(vertical = 20.dp), horizontalArrangement = Arrangement.Center) {
            repeat(TOUR_PAGES.size) { index ->
                val selected = index == pagerState.currentPage
                Box(
                    Modifier
                        .padding(horizontal = 4.dp)
                        .size(if (selected) 10.dp else 8.dp)
                        .background(if (selected) Amber500 else Stone200, CircleShape)
                )
            }
        }

        Button(
            onClick = {
                if (isLastPage) finish()
                else scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) }
            },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = MaterialTheme.shapes.medium,
            colors = ButtonDefaults.buttonColors(containerColor = Amber500, contentColor = Stone900),
        ) {
            Text(
                stringResource(if (isLastPage) R.string.tour_get_started else R.string.tour_next),
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
        }
    }
}

@Composable
private fun TourPageContent(page: TourPage) {
    Column(
        Modifier.fillMaxSize().padding(horizontal = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        if (page.icon == null && page.iconRes == null) {
            HivePulseHexIcon(size = 112)
        } else {
            Box(
                Modifier.size(120.dp).background(Amber500.copy(alpha = 0.15f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                val iconModifier = Modifier.size(56.dp)
                if (page.iconRes != null) {
                    Icon(painterResource(page.iconRes), contentDescription = null, modifier = iconModifier, tint = Amber600)
                } else if (page.icon != null) {
                    Icon(page.icon, contentDescription = null, modifier = iconModifier, tint = Amber600)
                }
            }
        }
        Spacer(Modifier.height(32.dp))
        Text(
            stringResource(page.title),
            style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
            color = Stone900,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(12.dp))
        Text(
            stringResource(page.body),
            style = MaterialTheme.typography.bodyLarge,
            color = Stone500,
            textAlign = TextAlign.Center
        )
    }
}
