package com.hivepulse.app.ui.hives

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.EventNote
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.R
import com.hivepulse.app.data.api.HiveOut
import com.hivepulse.app.data.api.InspectionOut
import com.hivepulse.app.data.repository.HiveRepository
import com.hivepulse.app.data.repository.InspectionRepository
import com.hivepulse.app.ui.common.ErrorBanner
import com.hivepulse.app.ui.common.InfoRow
import com.hivepulse.app.ui.common.LoadingScreen
import com.hivepulse.app.ui.common.SectionHeader
import com.hivepulse.app.ui.theme.Amber500
import com.hivepulse.app.ui.theme.Stone200
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HiveDetailState(
    val hive: HiveOut? = null,
    val inspections: List<InspectionOut> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
)

@HiltViewModel
class HiveDetailViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val hiveRepo: HiveRepository,
    private val inspRepo: InspectionRepository,
) : ViewModel() {
    val hiveId = savedState.get<String>("hiveId")!!
    private val _state = MutableStateFlow(HiveDetailState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true) }
        runCatching {
            val hive  = hiveRepo.get(hiveId)
            val insps = inspRepo.list(hiveId).items
            _state.update { it.copy(isLoading = false, hive = hive, inspections = insps) }
        }.onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun deleteInspection(id: String) = viewModelScope.launch {
        runCatching { inspRepo.delete(id) }
            .onSuccess { _state.update { it.copy(inspections = it.inspections.filter { i -> i.id != id }) } }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HiveDetailScreen(
    hiveId: String,
    onInspectionClick: (String, String) -> Unit,
    onAddInspection: (String) -> Unit,
    onStatsClick: (String) -> Unit,
    onBack: () -> Unit,
    vm: HiveDetailViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.hive?.name ?: "", style = MaterialTheme.typography.titleLarge) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } },
                actions = {
                    IconButton(onClick = { onStatsClick(hiveId) }) {
                        Icon(Icons.Default.BarChart, contentDescription = stringResource(R.string.action_stats))
                    }
                }
            )
        },
        floatingActionButton = {
            val newInspectionLabel = stringResource(R.string.action_new_inspection)
            ExtendedFloatingActionButton(
                onClick        = { onAddInspection(hiveId) },
                icon           = { Icon(Icons.Default.Add, contentDescription = null) },
                text           = { Text(newInspectionLabel) },
                containerColor = Amber500,
                contentColor   = MaterialTheme.colorScheme.onPrimary,
                modifier       = Modifier.semantics { contentDescription = newInspectionLabel },
            )
        }
    ) { padding ->
        when {
            state.isLoading -> LoadingScreen()
            else -> LazyColumn(
                Modifier.padding(padding),
                contentPadding = PaddingValues(bottom = 88.dp),
            ) {
                state.error?.let { item { ErrorBanner(it) { vm.clearError() } } }

                state.hive?.let { hive ->
                    item { SectionHeader(stringResource(R.string.section_details)) }
                    item {
                        Card(
                            modifier  = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                            shape     = MaterialTheme.shapes.large,
                            colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border    = BorderStroke(1.dp, Stone200),
                            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                        ) {
                            Column(Modifier.padding(16.dp)) {
                                InfoRow(stringResource(R.string.field_hive_type),
                                    hive.hiveType.replace("_", " ").replaceFirstChar { it.uppercase() })
                                hive.acquisitionDate?.let { InfoRow(stringResource(R.string.field_acquisition_date), it) }
                                if (hive.latitude != null && hive.longitude != null) {
                                    InfoRow(stringResource(R.string.field_location), "%.4f, %.4f".format(hive.latitude, hive.longitude))
                                }
                                hive.notes?.takeIf { it.isNotBlank() }?.let { InfoRow(stringResource(R.string.field_notes), it) }
                            }
                        }
                    }

                    if (hive.customFields.isNotEmpty()) {
                        item { SectionHeader(stringResource(R.string.section_custom_fields)) }
                        item {
                            Card(
                                modifier  = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                                shape     = MaterialTheme.shapes.large,
                                colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                border    = BorderStroke(1.dp, Stone200),
                                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                            ) {
                                Column(Modifier.padding(16.dp)) {
                                    hive.customFields.forEach { (k, v) -> InfoRow(k, v?.toString() ?: "—") }
                                }
                            }
                        }
                    }
                }

                item { SectionHeader(stringResource(R.string.section_inspections)) }
                if (state.inspections.isEmpty()) {
                    item {
                        Text(stringResource(R.string.empty_inspections),
                            Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                } else {
                    items(state.inspections) { insp ->
                        InspectionListItem(insp,
                            onClick   = { onInspectionClick(insp.id, hiveId) },
                            onDelete  = { vm.deleteInspection(insp.id) })
                    }
                }
            }
        }
    }
}

@Composable
fun InspectionListItem(insp: InspectionOut, onClick: () -> Unit, onDelete: (() -> Unit)? = null) {
    Card(
        modifier  = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
            .clickable(onClick = onClick),
        shape     = MaterialTheme.shapes.large,
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border    = BorderStroke(1.dp, Stone200),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 68.dp)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.AutoMirrored.Filled.EventNote, contentDescription = null,
                modifier = Modifier.size(28.dp), tint = Amber500)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(insp.date, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    insp.mood?.let {
                        val emoji = when (it) { "calm" -> "😌"; "nervous" -> "😤"; "aggressive" -> "😡"; else -> "" }
                        Text("$emoji ${it.replaceFirstChar { c -> c.uppercase() }}", style = MaterialTheme.typography.bodySmall)
                    }
                    insp.varroaCount?.let { Text("🐛 $it", style = MaterialTheme.typography.bodySmall) }
                    if (insp.queenSeen == true) Text("👑", style = MaterialTheme.typography.bodySmall)
                }
            }
            if (onDelete != null) {
                IconButton(onClick = onDelete, modifier = Modifier.size(48.dp)) {
                    Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}
