package com.hivepulse.app.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.R
import com.hivepulse.app.data.api.ApiaryOut
import com.hivepulse.app.data.api.UserOut
import com.hivepulse.app.data.repository.ApiaryRepository
import com.hivepulse.app.data.repository.AuthRepository
import com.hivepulse.app.data.repository.ExportRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsState(
    val user: UserOut? = null,
    val apiaries: List<ApiaryOut> = emptyList(),
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val isChangingPassword: Boolean = false,
    val passwordChanged: Boolean = false,
    val isDeleting: Boolean = false,
    val isExporting: Boolean = false,
    val exportMessage: String? = null,
    val error: String? = null,
    val loggedOut: Boolean = false,
    val deleted: Boolean = false
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val repo: AuthRepository,
    private val apiaryRepo: ApiaryRepository,
    private val exportRepo: ExportRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(SettingsState())
    val state = _state.asStateFlow()

    init { load() }

    private fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true) }
        runCatching {
            val user = repo.getMe()
            val apiaries = apiaryRepo.list()
            _state.update { it.copy(isLoading = false, user = user, apiaries = apiaries) }
        }.onFailure { e ->
            _state.update { it.copy(isLoading = false, error = e.message) }
        }
    }

    fun updateName(name: String) = viewModelScope.launch {
        _state.update { it.copy(isSaving = true) }
        runCatching { repo.updateMe(name, null) }
            .onSuccess { u -> _state.update { it.copy(isSaving = false, user = u) } }
            .onFailure { e -> _state.update { it.copy(isSaving = false, error = e.message) } }
    }

    fun updateLocale(locale: String) = viewModelScope.launch {
        runCatching { repo.updateMe(null, locale) }
            .onSuccess { u -> _state.update { it.copy(user = u) } }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun changePassword(currentPassword: String, newPassword: String) = viewModelScope.launch {
        _state.update { it.copy(isChangingPassword = true, error = null, passwordChanged = false) }
        runCatching { repo.changePassword(currentPassword, newPassword) }
            .onSuccess { _state.update { it.copy(isChangingPassword = false, passwordChanged = true) } }
            .onFailure { e -> _state.update { it.copy(isChangingPassword = false, error = e.message) } }
    }

    fun deleteAccount() = viewModelScope.launch {
        _state.update { it.copy(isDeleting = true, error = null) }
        runCatching { repo.deleteAccount() }
            .onSuccess { _state.update { it.copy(isDeleting = false, deleted = true) } }
            .onFailure { e -> _state.update { it.copy(isDeleting = false, error = e.message) } }
    }

    fun exportApiary(apiary: ApiaryOut, format: String) = viewModelScope.launch {
        _state.update { it.copy(isExporting = true, exportMessage = null) }
        runCatching { exportRepo.exportApiary(apiary.id, apiary.name, format) }
            .onSuccess { name -> _state.update { it.copy(isExporting = false, exportMessage = name) } }
            .onFailure { e -> _state.update { it.copy(isExporting = false, error = e.message) } }
    }

    fun logout() = viewModelScope.launch {
        runCatching { repo.logout() }
        _state.update { it.copy(loggedOut = true) }
    }

    fun clearError() = _state.update { it.copy(error = null) }
    fun clearExportMessage() = _state.update { it.copy(exportMessage = null) }
    fun clearPasswordChanged() = _state.update { it.copy(passwordChanged = false) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onLogout: () -> Unit,
    onBack: () -> Unit,
    onAdminClick: () -> Unit = {},
    vm: SettingsViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    LaunchedEffect(state.loggedOut) { if (state.loggedOut) onLogout() }
    LaunchedEffect(state.deleted)   { if (state.deleted) onLogout() }

    var editName      by remember { mutableStateOf("") }
    var editingName   by remember { mutableStateOf(false) }
    var showLogout    by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var showExport    by remember { mutableStateOf(false) }
    var exportFormat  by remember { mutableStateOf("json") }
    var exportApiary  by remember { mutableStateOf<ApiaryOut?>(null) }

    // Password change local state
    var currentPw  by remember { mutableStateOf("") }
    var newPw      by remember { mutableStateOf("") }
    var confirmPw  by remember { mutableStateOf("") }
    var pwError    by remember { mutableStateOf<String?>(null) }

    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(state.exportMessage) {
        state.exportMessage?.let {
            snackbarHostState.showSnackbar(message = "Saved to Downloads: $it")
            vm.clearExportMessage()
        }
    }
    LaunchedEffect(state.passwordChanged) {
        if (state.passwordChanged) {
            currentPw = ""
            newPw = ""
            confirmPw = ""
            pwError = null
            snackbarHostState.showSnackbar(message = "Password changed successfully.")
            vm.clearPasswordChanged()
        }
    }

    LaunchedEffect(state.user) {
        state.user?.let { if (editName.isEmpty()) editName = it.name }
    }

    val locales      = listOf("en", "fr", "de", "es")
    val localeLabels = listOf("English", "Français", "Deutsch", "Español")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.screen_settings)) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } },
                actions = {
                    IconButton(onClick = { showLogout = true }) {
                        Icon(Icons.Default.ExitToApp, contentDescription = stringResource(R.string.action_logout))
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when {
            state.isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            else -> Column(
                Modifier.fillMaxSize().padding(padding).padding(16.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                state.error?.let {
                    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
                        Text(it, Modifier.padding(12.dp), color = MaterialTheme.colorScheme.onErrorContainer)
                    }
                }

                state.user?.let { user ->
                    // Account info
                    Text(stringResource(R.string.section_account), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
                    OutlinedTextField(
                        value = user.email,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text(stringResource(R.string.field_email)) },
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Display name
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        OutlinedTextField(
                            value = editName,
                            onValueChange = { editName = it; editingName = true },
                            label = { Text(stringResource(R.string.field_display_name)) },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        if (editingName) {
                            Spacer(Modifier.width(8.dp))
                            Button(
                                onClick  = { vm.updateName(editName); editingName = false },
                                enabled  = !state.isSaving && editName.isNotBlank()
                            ) {
                                if (state.isSaving) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                                else Text(stringResource(R.string.action_save))
                            }
                        }
                    }

                    // Locale
                    Text(stringResource(R.string.section_language), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
                    SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                        locales.forEachIndexed { idx, locale ->
                            SegmentedButton(
                                selected = user.locale == locale,
                                onClick  = { vm.updateLocale(locale) },
                                shape    = SegmentedButtonDefaults.itemShape(idx, locales.size)
                            ) { Text(localeLabels[idx]) }
                        }
                    }

                    // Change Password
                    Text(stringResource(R.string.section_change_password), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
                    OutlinedTextField(
                        value = currentPw,
                        onValueChange = { currentPw = it; pwError = null },
                        label = { Text(stringResource(R.string.field_current_password)) },
                        visualTransformation = PasswordVisualTransformation(),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = newPw,
                        onValueChange = { newPw = it; pwError = null },
                        label = { Text(stringResource(R.string.field_new_password)) },
                        visualTransformation = PasswordVisualTransformation(),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = confirmPw,
                        onValueChange = { confirmPw = it; pwError = null },
                        label = { Text(stringResource(R.string.field_confirm_password)) },
                        visualTransformation = PasswordVisualTransformation(),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    pwError?.let {
                        Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                    Button(
                        onClick = {
                            when {
                                newPw != confirmPw  -> pwError = "Passwords do not match."
                                newPw.length < 8    -> pwError = "Password must be at least 8 characters."
                                else -> {
                                    pwError = null
                                    vm.changePassword(currentPw, newPw)
                                }
                            }
                        },
                        enabled = !state.isChangingPassword && currentPw.isNotEmpty() && newPw.isNotEmpty() && confirmPw.isNotEmpty(),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (state.isChangingPassword) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                        else Text(stringResource(R.string.action_change_password))
                    }

                    // Admin dashboard
                    if (user.isAdmin) {
                        Text(stringResource(R.string.section_admin), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
                        OutlinedButton(
                            onClick  = onAdminClick,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Build, null, Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(stringResource(R.string.action_admin_dashboard))
                        }
                    }

                    // Data Export
                    if (state.apiaries.isNotEmpty()) {
                        Text(stringResource(R.string.section_export), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
                        OutlinedButton(
                            onClick  = {
                                exportApiary = state.apiaries.first()
                                exportFormat = "json"
                                showExport = true
                            },
                            modifier = Modifier.fillMaxWidth(),
                            enabled  = !state.isExporting
                        ) {
                            if (state.isExporting)
                                CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                            else
                                Text(stringResource(R.string.action_export_data))
                        }
                    }
                }

                Spacer(Modifier.weight(1f))

                // Danger Zone
                Text(stringResource(R.string.section_danger_zone), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.error)
                OutlinedButton(
                    onClick  = { showDeleteConfirm = true },
                    modifier = Modifier.fillMaxWidth(),
                    enabled  = !state.isDeleting,
                    colors   = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    if (state.isDeleting) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.error)
                    else Text(stringResource(R.string.action_delete_account))
                }

                OutlinedButton(
                    onClick  = { showLogout = true },
                    modifier = Modifier.fillMaxWidth(),
                    colors   = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Icon(Icons.Default.ExitToApp, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(stringResource(R.string.action_logout))
                }
            }
        }
    }

    if (showLogout) {
        AlertDialog(
            onDismissRequest = { showLogout = false },
            title   = { Text(stringResource(R.string.action_logout)) },
            text    = { Text(stringResource(R.string.alert_logout_confirm)) },
            confirmButton = {
                TextButton(onClick = { vm.logout(); showLogout = false },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)) {
                    Text(stringResource(R.string.action_logout))
                }
            },
            dismissButton = { TextButton(onClick = { showLogout = false }) { Text(stringResource(R.string.action_cancel)) } }
        )
    }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title   = { Text(stringResource(R.string.alert_delete_account_confirm)) },
            text    = { Text(stringResource(R.string.alert_delete_account_message)) },
            confirmButton = {
                TextButton(
                    onClick = { vm.deleteAccount(); showDeleteConfirm = false },
                    colors  = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Text(stringResource(R.string.alert_delete_account_action))
                }
            },
            dismissButton = { TextButton(onClick = { showDeleteConfirm = false }) { Text(stringResource(R.string.action_cancel)) } }
        )
    }

    if (showExport) {
        AlertDialog(
            onDismissRequest = { showExport = false },
            title = { Text(stringResource(R.string.action_export_data)) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Apiary picker
                    if (state.apiaries.size > 1) {
                        Text(stringResource(R.string.label_select_apiary), style = MaterialTheme.typography.bodySmall)
                        state.apiaries.forEach { apiary ->
                            Row(
                                Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RadioButton(
                                    selected = exportApiary?.id == apiary.id,
                                    onClick = { exportApiary = apiary }
                                )
                                Spacer(Modifier.width(4.dp))
                                Text(apiary.name)
                            }
                        }
                        HorizontalDivider()
                    }

                    // Format picker
                    Text(stringResource(R.string.label_select_format), style = MaterialTheme.typography.bodySmall)
                    SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                        listOf("json", "csv").forEachIndexed { idx, fmt ->
                            SegmentedButton(
                                selected = exportFormat == fmt,
                                onClick  = { exportFormat = fmt },
                                shape    = SegmentedButtonDefaults.itemShape(idx, 2)
                            ) { Text(fmt.uppercase()) }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        exportApiary?.let { vm.exportApiary(it, exportFormat) }
                        showExport = false
                    },
                    enabled = exportApiary != null
                ) { Text(stringResource(R.string.action_download)) }
            },
            dismissButton = { TextButton(onClick = { showExport = false }) { Text(stringResource(R.string.action_cancel)) } }
        )
    }
}
