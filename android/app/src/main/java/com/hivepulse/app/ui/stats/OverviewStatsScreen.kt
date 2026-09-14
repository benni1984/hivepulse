package com.hivepulse.app.ui.stats

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Hive
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.TaskAlt
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.R
import com.hivepulse.app.data.api.ApiaryStatsSummary
import com.hivepulse.app.data.api.OverviewStats
import com.hivepulse.app.data.repository.StatsRepository
import com.hivepulse.app.ui.common.ErrorBanner
import com.hivepulse.app.ui.common.SectionHeader
import com.hivepulse.app.ui.theme.Amber500
import com.hivepulse.app.ui.theme.Amber600
import com.hivepulse.app.ui.theme.Stone200
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OverviewStatsState(
    val stats: OverviewStats? = null,
    val preset: String = "365d",
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class OverviewStatsViewModel @Inject constructor(
    private val repo: StatsRepository
) : ViewModel() {

    private val _state = MutableStateFlow(OverviewStatsState())
    val state = _state.asStateFlow()

    init { load(_state.value.preset) }

    fun load(preset: String) = viewModelScope.launch {
        _state.update { it.copy(preset = preset, isLoading = true, error = null) }
        runCatching { repo.overviewStats(preset) }
            .onSuccess { s -> _state.update { it.copy(isLoading = false, stats = s) } }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message ?: e.cause?.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}

private val OVERVIEW_PRESETS = listOf("30d", "90d", "365d", "all")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OverviewStatsScreen(
    onApiaryClick: (String) -> Unit,
    onBack: () -> Unit,
    vm: OverviewStatsViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()

    Scaffold(topBar = {
        TopAppBar(
            title = { Text(stringResource(R.string.screen_stats_overview)) },
            navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } }
        )
    }) { padding ->
        Column(Modifier.padding(padding).fillMaxSize().verticalScroll(rememberScrollState())) {
            SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)) {
                OVERVIEW_PRESETS.forEachIndexed { idx, preset ->
                    SegmentedButton(
                        selected = state.preset == preset,
                        onClick  = { vm.load(preset) },
                        shape    = SegmentedButtonDefaults.itemShape(idx, OVERVIEW_PRESETS.size)
                    ) { Text(preset) }
                }
            }

            state.error?.let { ErrorBanner(it) { vm.clearError() } }

            val stats = state.stats
            when {
                stats == null && state.isLoading -> Box(
                    Modifier.fillMaxWidth().padding(32.dp),
                    contentAlignment = Alignment.Center
                ) { CircularProgressIndicator(color = Amber500) }
                stats != null -> {
                    if (state.isLoading) {
                        LinearProgressIndicator(Modifier.fillMaxWidth().padding(horizontal = 16.dp), color = Amber500)
                    }
                    OverviewContent(stats, onApiaryClick)
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun OverviewContent(s: OverviewStats, onApiaryClick: (String) -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        StatPill(stringResource(R.string.stat_overview_apiaries), s.apiaryCount, Icons.Default.Home, Modifier.weight(1f))
        StatPill(stringResource(R.string.stat_overview_hives), s.hiveCount, Icons.Default.Hive, Modifier.weight(1f))
        StatPill(stringResource(R.string.stat_overview_inspections), s.inspectionsTotal, Icons.Default.TaskAlt, Modifier.weight(1f))
    }

    SectionHeader(stringResource(R.string.stat_overview_per_apiary))
    if (s.perApiary.isEmpty()) {
        Text(
            stringResource(R.string.stat_overview_no_data),
            style    = MaterialTheme.typography.bodyMedium,
            color    = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
    } else {
        Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            s.perApiary.forEach { row -> ApiaryRow(row, onClick = { onApiaryClick(row.apiaryId) }) }
        }
    }
}

/** Two-row stat pill: label + amber icon, then the big number. */
@Composable
private fun StatPill(label: String, value: Int, icon: ImageVector, modifier: Modifier = Modifier) {
    Card(
        modifier  = modifier,
        shape     = MaterialTheme.shapes.large,
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border    = BorderStroke(1.dp, Stone200),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Text(
                    label,
                    style    = MaterialTheme.typography.labelMedium,
                    color    = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    modifier = Modifier.weight(1f)
                )
                Box(
                    Modifier.size(24.dp).background(Amber500.copy(alpha = 0.15f), RoundedCornerShape(6.dp)),
                    contentAlignment = Alignment.Center
                ) { Icon(icon, contentDescription = null, modifier = Modifier.size(14.dp), tint = Amber600) }
            }
            Text("$value", style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold))
        }
    }
}

@Composable
private fun ApiaryRow(row: ApiaryStatsSummary, onClick: () -> Unit) {
    Card(
        onClick   = onClick,
        modifier  = Modifier.fillMaxWidth(),
        shape     = MaterialTheme.shapes.large,
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border    = BorderStroke(1.dp, Stone200),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Row(
            Modifier.fillMaxWidth().heightIn(min = 64.dp).padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(row.apiaryName, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold))
                Text(
                    stringResource(R.string.stat_overview_row_format, row.hiveCount, row.inspectionsTotal),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Icon(
                Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
