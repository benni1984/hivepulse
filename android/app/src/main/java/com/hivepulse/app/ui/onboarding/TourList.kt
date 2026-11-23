package com.hivepulse.app.ui.onboarding

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.hivepulse.app.R
import com.hivepulse.app.data.local.OnboardingStore
import dagger.hilt.android.lifecycle.HiltViewModel
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import javax.inject.Inject

/**
 * Every tour there is, in Settings, restartable (#449).
 *
 * This is the part that decides whether #449 was worth doing on the phone. An overlay that points
 * at the real button is a better first run; a *list* of them is the thing the carousel could not
 * be at all. That ran once, after the first sign-in, and the only way back was a button that
 * replayed the same six screens. Somebody who had kept bees with this app for a year and still
 * did not know what a QR batch was for had nowhere to look.
 *
 * The mark beside a finished tour is a mark and not a lock: the start button stays. Seen is not
 * spent.
 */
@HiltViewModel
class TourListViewModel @Inject constructor(
    private val store: OnboardingStore,
) : ViewModel() {
    var finished by mutableStateOf(store.finishedTours)
        private set

    /** Re-read on every visit: a tour finished since the screen was built belongs in the list. */
    fun refresh() {
        finished = store.finishedTours
    }
}

@Composable
fun TourList(
    onStart: (String) -> Unit,
    modifier: Modifier = Modifier,
    vm: TourListViewModel = hiltViewModel(),
) {
    LaunchedEffect(Unit) { vm.refresh() }

    Column(modifier.fillMaxWidth().testTag("tourList")) {
        Text(
            stringResource(R.string.tour_list_title),
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.primary,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            stringResource(R.string.tour_list_intro),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(8.dp))

        TOURS.forEach { tour ->
            HorizontalDivider()
            Row(
                Modifier.fillMaxWidth().padding(vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            stringResource(tour.title),
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Bold,
                        )
                        if (tour.id in vm.finished) {
                            Spacer(Modifier.width(8.dp))
                            Text(
                                stringResource(R.string.tour_list_done),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    Text(
                        stringResource(tour.summary),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                TextButton(
                    onClick = { onStart(tour.id) },
                    modifier = Modifier.testTag("startTour-${tour.id}"),
                ) {
                    Text(stringResource(R.string.tour_list_start))
                }
            }
        }
    }
}
