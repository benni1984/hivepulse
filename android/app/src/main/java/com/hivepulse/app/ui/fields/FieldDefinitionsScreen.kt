package com.hivepulse.app.ui.fields

import androidx.annotation.StringRes
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.R
import com.hivepulse.app.data.api.FieldDefinitionCreate
import com.hivepulse.app.data.api.FieldDefinitionOut
import com.hivepulse.app.data.api.FieldDefinitionUpdate
import com.hivepulse.app.data.repository.FieldDefinitionRepository
import com.hivepulse.app.ui.common.ErrorBanner
import com.hivepulse.app.ui.common.ToggleButtonGroup
import com.hivepulse.app.ui.theme.Amber500
import com.hivepulse.app.ui.theme.Stone200
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class FieldMessage { CREATED, SAVED }

data class FieldDefinitionsState(
    val fields: List<FieldDefinitionOut> = emptyList(),
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val error: String? = null,
    val message: FieldMessage? = null
)

/** Select options are entered one per line, like on the web. */
internal fun parseOptions(text: String): List<String> =
    text.lines().map { it.trim() }.filter { it.isNotEmpty() }

@HiltViewModel
class FieldDefinitionsViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val repo: FieldDefinitionRepository
) : ViewModel() {

    /** null → the user's own fields; otherwise fields that only apply inside this apiary. */
    val apiaryId: String? = savedState.get<String>("apiaryId")?.ifBlank { null }

    private val _state = MutableStateFlow(FieldDefinitionsState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.list(apiaryId) }
            .onSuccess { f -> _state.update { it.copy(isLoading = false, fields = f) } }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message ?: e.cause?.message) } }
    }

    fun create(name: String, target: String, type: String, optionsText: String, required: Boolean, onDone: () -> Unit = {}) =
        viewModelScope.launch {
            _state.update { it.copy(isSaving = true, error = null) }
            val body = FieldDefinitionCreate(
                target    = target,
                name      = name.trim(),
                type      = type,
                options   = if (type == "select") parseOptions(optionsText) else emptyList(),
                required  = required,
                sortOrder = 0
            )
            runCatching { repo.create(apiaryId, body) }
                .onSuccess { fd ->
                    _state.update { it.copy(isSaving = false, fields = it.fields + fd, message = FieldMessage.CREATED) }
                    onDone()
                }
                .onFailure { e -> _state.update { it.copy(isSaving = false, error = e.message ?: e.cause?.message) } }
        }

    /** Target and type are fixed after creation (the API only accepts name, options and required). */
    fun update(field: FieldDefinitionOut, name: String, optionsText: String, required: Boolean, onDone: () -> Unit = {}) =
        viewModelScope.launch {
            _state.update { it.copy(isSaving = true, error = null) }
            val body = FieldDefinitionUpdate(
                name     = name.trim(),
                options  = if (field.type == "select") parseOptions(optionsText) else null,
                required = required
            )
            runCatching { repo.update(apiaryId, field.id, body) }
                .onSuccess { updated ->
                    _state.update { s ->
                        s.copy(
                            isSaving = false,
                            fields   = s.fields.map { if (it.id == updated.id) updated else it },
                            message  = FieldMessage.SAVED
                        )
                    }
                    onDone()
                }
                .onFailure { e -> _state.update { it.copy(isSaving = false, error = e.message ?: e.cause?.message) } }
        }

    fun delete(id: String) = viewModelScope.launch {
        runCatching { repo.delete(apiaryId, id) }
            .onSuccess { _state.update { s -> s.copy(fields = s.fields.filter { it.id != id }) } }
            .onFailure { e -> _state.update { it.copy(error = e.message ?: e.cause?.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
    fun clearMessage() = _state.update { it.copy(message = null) }
}

private val TARGETS = listOf(
    "inspection" to R.string.fielddefs_target_inspection,
    "hive"       to R.string.fielddefs_target_hive,
)
private val TYPES = listOf(
    "text"    to R.string.fielddefs_type_text,
    "number"  to R.string.fielddefs_type_number,
    "boolean" to R.string.fielddefs_type_boolean,
    "date"    to R.string.fielddefs_type_date,
    "select"  to R.string.fielddefs_type_select,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FieldDefinitionsScreen(
    onBack: () -> Unit,
    vm: FieldDefinitionsViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    val isApiaryScope = vm.apiaryId != null
    var showCreate by remember { mutableStateOf(false) }
    var editing    by remember { mutableStateOf<FieldDefinitionOut?>(null) }
    var deleting   by remember { mutableStateOf<FieldDefinitionOut?>(null) }

    val snackbarHostState = remember { SnackbarHostState() }
    val createdText = stringResource(R.string.fielddefs_create_success)
    val savedText   = stringResource(R.string.fielddefs_save_success)
    LaunchedEffect(state.message) {
        state.message?.let {
            snackbarHostState.showSnackbar(if (it == FieldMessage.CREATED) createdText else savedText)
            vm.clearMessage()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(if (isApiaryScope) R.string.fielddefs_apiary_title else R.string.fielddefs_title)) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } }
            )
        },
        floatingActionButton = {
            // Stable content description: the FAB label animates in, so its text node isn't reliably
            // addressable (same approach as the New Apiary FAB)
            val newFieldLabel = stringResource(R.string.fielddefs_new)
            ExtendedFloatingActionButton(
                onClick        = { showCreate = true },
                icon           = { Icon(Icons.Default.Add, contentDescription = null) },
                text           = { Text(newFieldLabel) },
                containerColor = Amber500,
                contentColor   = MaterialTheme.colorScheme.onPrimary,
                modifier       = Modifier.semantics { contentDescription = newFieldLabel },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        LazyColumn(
            Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 96.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            item {
                Text(
                    stringResource(if (isApiaryScope) R.string.fielddefs_apiary_subtitle else R.string.fielddefs_subtitle),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            state.error?.let { item { ErrorBanner(it) { vm.clearError() } } }
            when {
                state.isLoading && state.fields.isEmpty() -> item {
                    Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Amber500)
                    }
                }
                state.fields.isEmpty() -> item {
                    Text(
                        stringResource(R.string.fielddefs_empty),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(vertical = 24.dp)
                    )
                }
                else -> items(state.fields, key = { it.id }) { fd ->
                    FieldRow(fd, onEdit = { editing = fd }, onDelete = { deleting = fd })
                }
            }
        }
    }

    if (showCreate) {
        FieldDefinitionDialog(
            existing  = null,
            isSaving  = state.isSaving,
            onDismiss = { showCreate = false },
            onSubmit  = { name, target, type, options, required ->
                vm.create(name, target, type, options, required) { showCreate = false }
            }
        )
    }

    editing?.let { fd ->
        FieldDefinitionDialog(
            existing  = fd,
            isSaving  = state.isSaving,
            onDismiss = { editing = null },
            onSubmit  = { name, _, _, options, required ->
                vm.update(fd, name, options, required) { editing = null }
            }
        )
    }

    deleting?.let { fd ->
        AlertDialog(
            onDismissRequest = { deleting = null },
            title = { Text(fd.name) },
            text  = { Text(stringResource(R.string.fielddefs_delete_confirm)) },
            confirmButton = {
                TextButton(
                    onClick = { vm.delete(fd.id); deleting = null },
                    colors  = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) { Text(stringResource(R.string.action_delete)) }
            },
            dismissButton = { TextButton(onClick = { deleting = null }) { Text(stringResource(R.string.action_cancel)) } }
        )
    }
}

@Composable
private fun FieldRow(fd: FieldDefinitionOut, onEdit: () -> Unit, onDelete: () -> Unit) {
    Card(
        modifier  = Modifier.fillMaxWidth(),
        shape     = MaterialTheme.shapes.large,
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border    = BorderStroke(1.dp, Stone200),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Row(
            Modifier.fillMaxWidth().heightIn(min = 64.dp).padding(start = 16.dp, end = 4.dp, top = 10.dp, bottom = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(fd.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold))
                val summary = listOfNotNull(
                    labelFor(TARGETS, fd.target),
                    labelFor(TYPES, fd.type),
                    if (fd.required) stringResource(R.string.fielddefs_required) else null
                ).joinToString(" · ")
                Text(summary, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (fd.type == "select" && fd.options.isNotEmpty()) {
                    Text(
                        fd.options.joinToString(", "),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            IconButton(onClick = onEdit) {
                Icon(Icons.Default.Edit, contentDescription = stringResource(R.string.fielddefs_edit_title))
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, contentDescription = stringResource(R.string.action_delete), tint = MaterialTheme.colorScheme.error)
            }
        }
    }
}

@Composable
private fun labelFor(entries: List<Pair<String, Int>>, key: String): String =
    entries.firstOrNull { it.first == key }?.let { stringResource(it.second) } ?: key

@Composable
private fun FieldDefinitionDialog(
    existing: FieldDefinitionOut?,
    isSaving: Boolean,
    onDismiss: () -> Unit,
    onSubmit: (name: String, target: String, type: String, options: String, required: Boolean) -> Unit,
) {
    val isCreate = existing == null
    var name     by remember { mutableStateOf(existing?.name ?: "") }
    var target   by remember { mutableStateOf(existing?.target ?: "inspection") }
    var type     by remember { mutableStateOf(existing?.type ?: "text") }
    var options  by remember { mutableStateOf(existing?.options?.joinToString("\n") ?: "") }
    var required by remember { mutableStateOf(existing?.required ?: false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(if (isCreate) R.string.fielddefs_create_title else R.string.fielddefs_edit_title)) },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it.take(200) },
                    label = { Text(stringResource(R.string.fielddefs_name)) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                if (isCreate) {
                    ToggleButtonGroup(
                        label    = stringResource(R.string.fielddefs_target),
                        options  = TARGETS.map { stringResource(it.second) },
                        selected = TARGETS.indexOfFirst { it.first == target }.takeIf { it >= 0 },
                        onSelect = { idx -> idx?.let { target = TARGETS[it].first } },
                    )
                    // Two per row — five equal-width buttons would truncate their labels in a dialog
                    TYPES.chunked(2).forEachIndexed { row, chunk ->
                        ToggleButtonGroup(
                            label    = if (row == 0) stringResource(R.string.fielddefs_type) else "",
                            options  = chunk.map { stringResource(it.second) },
                            selected = chunk.indexOfFirst { it.first == type }.takeIf { it >= 0 },
                            onSelect = { idx -> idx?.let { type = chunk[it].first } },
                        )
                    }
                }
                if (type == "select") {
                    OutlinedTextField(
                        value = options,
                        onValueChange = { options = it },
                        label = { Text(stringResource(R.string.fielddefs_options)) },
                        minLines = 3,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                Row(
                    Modifier
                        .fillMaxWidth()
                        .heightIn(min = 48.dp)
                        .toggleable(value = required, role = Role.Switch, onValueChange = { required = it }),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(stringResource(R.string.fielddefs_required), style = MaterialTheme.typography.bodyMedium)
                    Switch(checked = required, onCheckedChange = null)
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onSubmit(name, target, type, options, required) },
                enabled = !isSaving && name.isNotBlank() && (type != "select" || parseOptions(options).isNotEmpty())
            ) { Text(stringResource(if (isCreate) R.string.fielddefs_create_btn else R.string.fielddefs_save_btn)) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringResource(R.string.action_cancel)) } }
    )
}
