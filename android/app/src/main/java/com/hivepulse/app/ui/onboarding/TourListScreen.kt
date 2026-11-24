package com.hivepulse.app.ui.onboarding

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import com.hivepulse.app.R
import com.hivepulse.app.data.local.OnboardingStore
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

/**
 * Every tour there is, restartable, on a screen of its own (#449).
 *
 * This is the part that decides whether #449 was worth doing on the phone. An overlay that points
 * at the real button is a better first run; a *list* of them is the thing the carousel could not
 * be at all. That ran once, after the first sign-in, and the only way back was a button that
 * replayed the same six screens. Somebody who had kept bees with this app for a year and still
 * did not know what a QR batch was for had nowhere to look.
 *
 * **A screen, not a section in Settings.** It was a section first, and nine rows with a sentence
 * each pushed everything below them — reminders, region, export, the danger zone — off the end of
 * a phone. `CLAUDE.md` gives the tour one entry in the settings order, between help and
 * diagnostics, and that is what it has. The website keeps its list inline, because a desktop page
 * has the room.
 *
 * The mark beside a finished tour is a mark and not a lock: the start button stays. Seen is not
 * spent. The iPhone's `TourListView.swift` is the same screen, reached the same way.
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TourListScreen(
    onBack: () -> Unit,
    onStart: (String) -> Unit,
    vm: TourListViewModel = hiltViewModel(),
) {
    LaunchedEffect(Unit) { vm.refresh() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.tour_list_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                    }
                },
            )
        },
    ) { padding ->
        LazyColumn(
            Modifier.fillMaxSize().padding(padding).testTag("tourList"),
            contentPadding = PaddingValues(16.dp),
        ) {
            item {
                Text(
                    stringResource(R.string.tour_list_intro),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(8.dp))
            }
            items(TOURS) { tour ->
                HorizontalDivider()
                Row(
                    Modifier.fillMaxWidth().padding(vertical = 10.dp),
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
}
