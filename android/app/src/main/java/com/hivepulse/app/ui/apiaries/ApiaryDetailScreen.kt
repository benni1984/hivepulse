package com.hivepulse.app.ui.apiaries

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.R
import com.hivepulse.app.data.api.ApiaryOut
import com.hivepulse.app.data.api.HiveCreateRequest
import com.hivepulse.app.data.api.HiveOut
import com.hivepulse.app.data.api.canEdit
import com.hivepulse.app.data.api.isOwner
import com.hivepulse.app.data.repository.ApiaryRepository
import com.hivepulse.app.data.repository.HiveRepository
import com.hivepulse.app.ui.common.ErrorBanner
import com.hivepulse.app.ui.common.LoadingScreen
import com.hivepulse.app.ui.hives.HiveEditDialog
import com.hivepulse.app.ui.theme.Amber500
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ApiaryDetailState(
    val apiaryName: String = "",
    val apiary: ApiaryOut? = null,
    val hives: List<HiveOut> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ApiaryDetailViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val apiaryRepo: ApiaryRepository,
    private val hiveRepo: HiveRepository
) : ViewModel() {
    private val apiaryId = savedState.get<String>("apiaryId")!!
    private val _state = MutableStateFlow(ApiaryDetailState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true) }
        runCatching {
            val apiary = apiaryRepo.get(apiaryId)
            val hives  = hiveRepo.listForApiary(apiaryId)
            _state.update { it.copy(isLoading = false, apiaryName = apiary.name, apiary = apiary, hives = hives) }
        }.onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    /** A hive made by hand; a refusal (the server words it) shows as the banner and keeps the list as it was. */
    fun createHive(name: String, hiveType: String, acquisitionDate: String?, notes: String?, onDone: () -> Unit = {}) =
        viewModelScope.launch {
            if (name.isBlank()) return@launch
            runCatching {
                hiveRepo.create(
                    apiaryId,
                    HiveCreateRequest(name.trim(), hiveType, acquisitionDate?.trim()?.ifBlank { null }, notes?.trim()?.ifBlank { null }),
                )
            }
                .onSuccess { created ->
                    _state.update { it.copy(hives = it.hives + created) }
                    onDone()
                }
                .onFailure { e -> _state.update { it.copy(error = e.message ?: e.cause?.message) } }
        }

    fun deleteHive(id: String) = viewModelScope.launch {
        runCatching { hiveRepo.delete(id) }
            .onSuccess { _state.update { it.copy(hives = it.hives.filter { h -> h.id != id }) } }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    /** Saves name, description, address and public-map visibility; keeps the stored coordinates. */
    fun updateApiary(name: String, description: String?, address: String?, isPublic: Boolean, onDone: () -> Unit = {}) =
        viewModelScope.launch {
            val current = _state.value.apiary ?: return@launch
            if (name.isBlank()) return@launch
            runCatching {
                apiaryRepo.update(
                    apiaryId, name.trim(), description?.trim()?.ifBlank { null },
                    current.latitude, current.longitude, address?.trim()?.ifBlank { null }, isPublic,
                )
            }
                .onSuccess { updated ->
                    _state.update { it.copy(apiary = updated, apiaryName = updated.name) }
                    onDone()
                }
                .onFailure { e -> _state.update { it.copy(error = e.message) } }
        }

    fun clearError() = _state.update { it.copy(error = null) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ApiaryDetailScreen(
    apiaryId: String,
    onHiveClick: (String) -> Unit,
    onBack: () -> Unit,
    onFieldsClick: () -> Unit = {},
    onShareClick: () -> Unit = {},
    onMoveClick: () -> Unit = {},
    onTreatmentsClick: () -> Unit = {},
    vm: ApiaryDetailViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    var showEdit by remember { mutableStateOf(false) }
    var showNewHive by remember { mutableStateOf(false) }
    // Coming back from the move screen: the hives that left must be gone from this list.
    LaunchedEffect(apiaryId) { vm.load() }

    Scaffold(
        floatingActionButton = {
            // Making a hive by hand, as the web has it: a sticker is not needed to start. Not for somebody who was
            // given single hives of this apiary: the server would refuse.
            if (state.apiary?.canEdit != false) {
                val newHiveLabel = stringResource(R.string.action_new_hive)
                ExtendedFloatingActionButton(
                    onClick        = { showNewHive = true },
                    icon           = { Icon(Icons.Default.Add, contentDescription = null) },
                    text           = { Text(newHiveLabel) },
                    containerColor = Amber500,
                    contentColor   = MaterialTheme.colorScheme.onPrimary,
                    modifier       = Modifier.semantics { contentDescription = newHiveLabel },
                )
            }
        },
        topBar = {
        TopAppBar(
            title = { Text(state.apiaryName) },
            navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } },
            actions = {
                // Taking hives to where something is in bloom is the owner's to do.
                if (state.apiary?.isOwner == true && state.hives.isNotEmpty()) {
                    IconButton(onClick = onMoveClick, modifier = Modifier.testTag("moveHivesButton")) {
                        Icon(Icons.Default.SwapHoriz, contentDescription = stringResource(R.string.moves_title))
                    }
                }
                // Inviting stays with the owner.
                if (state.apiary?.isOwner == true) {
                    IconButton(onClick = onShareClick, modifier = Modifier.testTag("shareApiaryButton")) {
                        Icon(Icons.Default.Group, contentDescription = stringResource(R.string.sharing_title))
                    }
                }
                // Somebody who has single hives of it cannot work on the apiary around them: no treatment for all
                // of its hives, no fields, no editing. Same order as the iPhone's toolbar.
                if (state.apiary?.canEdit == true) {
                    IconButton(onClick = onTreatmentsClick, modifier = Modifier.testTag("apiaryTreatmentsButton")) {
                        Icon(Icons.Default.Medication, contentDescription = stringResource(R.string.treatments_title))
                    }
                }
                if (state.apiary?.canEdit != false) {
                    IconButton(onClick = onFieldsClick) {
                        Icon(Icons.Default.Tune, contentDescription = stringResource(R.string.fielddefs_apiary_title))
                    }
                }
                if (state.apiary?.canEdit == true) {
                    IconButton(onClick = { showEdit = true }) {
                        Icon(Icons.Default.Edit, contentDescription = stringResource(R.string.action_edit_apiary))
                    }
                }
            }
        )
    }) { padding ->
        when {
            state.isLoading -> LoadingScreen()
            else -> LazyColumn(Modifier.padding(padding), contentPadding = PaddingValues(bottom = 88.dp)) {
                state.error?.let { item { ErrorBanner(it) { vm.clearError() } } }
                if (state.hives.isEmpty()) {
                    item {
                        Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                            Text(stringResource(R.string.empty_hives_title))
                        }
                    }
                } else {
                    items(state.hives) { hive ->
                        // Only the owner deletes: the server would refuse anybody else.
                        HiveListItem(
                            hive,
                            onClick = { onHiveClick(hive.id) },
                            onDelete = if (hive.isOwner) ({ vm.deleteHive(hive.id) }) else null,
                        )
                        HorizontalDivider()
                    }
                }
            }
        }
    }

    if (showNewHive) {
        HiveEditDialog(
            hive = null,
            onDismiss = { showNewHive = false },
            onSave = { name, hiveType, acquisitionDate, notes ->
                vm.createHive(name, hiveType, acquisitionDate, notes) { showNewHive = false }
            },
        )
    }

    val apiary = state.apiary
    if (showEdit && apiary != null) {
        ApiaryFormDialog(
            initial = apiary,
            onConfirm = { name, desc, _, _, addr, isPublic ->
                vm.updateApiary(name, desc, addr, isPublic) { showEdit = false }
            },
            onDismiss = { showEdit = false },
        )
    }
}

@Composable
fun HiveListItem(hive: HiveOut, onClick: () -> Unit, onDelete: (() -> Unit)? = null) {
    ListItem(
        headlineContent  = { Text(hive.name) },
        supportingContent = {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AssistChip(onClick = {}, label = { Text(hive.hiveType.replace("_", " ").replaceFirstChar { it.uppercase() }) })
                hive.lastInspectionAt?.let {
                    Text(stringResource(R.string.label_last_inspection, it.take(10)), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                } ?: Text(stringResource(R.string.label_never_inspected), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
            }
        },
        trailingContent = onDelete?.let { { IconButton(onClick = it) { Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error) } } },
        modifier = Modifier.clickable(onClick = onClick)
    )
}
