package com.hivepulse.app.ui.members

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.R
import com.hivepulse.app.data.api.PublicStats
import com.hivepulse.app.data.api.UserOut
import com.hivepulse.app.data.repository.AuthRepository
import com.hivepulse.app.data.repository.StatsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val SUPPORTER_INFO_URL = "https://apiscan-two.vercel.app/contribute"

// ─── State ───────────────────────────────────────────────────────────────────

data class MembersState(
    val user: UserOut? = null,
    val publicStats: PublicStats? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

// ─── ViewModel ───────────────────────────────────────────────────────────────

@HiltViewModel
class MembersViewModel @Inject constructor(
    private val repo: AuthRepository,
    private val statsRepo: StatsRepository
) : ViewModel() {

    private val _state = MutableStateFlow(MembersState())
    val state = _state.asStateFlow()

    init { load() }

    private fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true) }
        runCatching { repo.getMe() }
            .onSuccess { user -> _state.update { it.copy(user = user) } }
            .onFailure { e  -> _state.update { it.copy(error = e.message) } }
        runCatching { statsRepo.getPublicStats() }
            .onSuccess { stats -> _state.update { it.copy(publicStats = stats) } }
        _state.update { it.copy(isLoading = false) }
    }
}

// ─── Screen ──────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MembersScreen(
    viewModel: MembersViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    val isUnlocked = state.user?.isSupporter == true || state.user?.isAdmin == true

    Scaffold(
        topBar = {
            TopAppBar(title = { Text(stringResource(R.string.members_title)) })
        }
    ) { innerPadding ->
        when {
            state.isLoading -> Box(
                Modifier.fillMaxSize().padding(innerPadding),
                contentAlignment = Alignment.Center
            ) { CircularProgressIndicator() }
            else -> Column(
                modifier = Modifier
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // ── Stat cards grid (overlaid with scrim when locked) ──────────
                Box {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            StatCard(formatVarroa(state.publicStats), R.string.members_stat_avg_varroa)
                            StatCard(formatMood(state.publicStats), R.string.members_stat_good_mood)
                        }
                        Column(
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            StatCard(formatBrood(state.publicStats), R.string.members_stat_avg_brood)
                            StatCard(formatInterval(state.publicStats), R.string.members_stat_avg_interval)
                        }
                    }
                    if (!isUnlocked) {
                        Box(
                            modifier = Modifier
                                .matchParentSize()
                                .background(MaterialTheme.colorScheme.background.copy(alpha = 0.75f))
                        )
                    }
                }

                // ── Gate / Coming-soon card ────────────────────────────────────
                if (isUnlocked) {
                    SupporterContentCard()
                } else {
                    SupporterGateCard()
                }
            }
        }
    }
}

private fun formatVarroa(stats: PublicStats?): String =
    stats?.avgVarroaCount?.let { "%.1f".format(it) } ?: "—"

private fun formatMood(stats: PublicStats?): String {
    val dist = stats?.moodDistribution ?: return "—"
    val total = dist.values.sum()
    if (total == 0) return "—"
    val calm = dist["calm"] ?: 0
    return "${(calm * 100 / total)}%"
}

private fun formatBrood(stats: PublicStats?): String =
    stats?.avgBroodFrames?.let { "%.1f".format(it) } ?: "—"

private fun formatInterval(stats: PublicStats?): String =
    stats?.avgInspectionIntervalDays?.let { "${it.toInt()}d" } ?: "—"

@Composable
private fun StatCard(value: String, labelRes: Int) {
    Surface(
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surfaceVariant,
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(8.dp)
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = stringResource(labelRes),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun SupporterContentCard() {
    Surface(
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surfaceVariant,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(40.dp)
            )
            Text(
                text = stringResource(R.string.members_coming_soon),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun SupporterGateCard() {
    val context = LocalContext.current
    Surface(
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surfaceVariant,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Star,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(40.dp)
            )
            Text(
                text = stringResource(R.string.members_gate_title),
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = stringResource(R.string.members_gate_desc),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            Spacer(Modifier.height(4.dp))
            Button(onClick = {
                context.startActivity(
                    Intent(Intent.ACTION_VIEW, Uri.parse(SUPPORTER_INFO_URL))
                )
            }) {
                Text(stringResource(R.string.members_become_supporter))
            }
        }
    }
}
