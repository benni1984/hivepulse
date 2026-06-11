package com.hivepulse.app.ui.apiaries

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hivepulse.app.R
import com.hivepulse.app.data.api.ApiaryOut
import com.hivepulse.app.ui.common.ErrorBanner
import com.hivepulse.app.ui.common.LoadingScreen
import com.hivepulse.app.ui.theme.Amber500
import com.hivepulse.app.ui.theme.Stone200

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ApiaryListScreen(
    onApiaryClick: (String) -> Unit,
    onScanClick: () -> Unit,
    onBatchClick: () -> Unit,
    onSettingsClick: () -> Unit,
    vm: ApiaryViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    var showCreate by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.screen_apiaries), style = MaterialTheme.typography.titleLarge) },
                actions = {
                    IconButton(onClick = onBatchClick)    { Icon(Icons.Default.Print,        contentDescription = stringResource(R.string.tab_print)) }
                    IconButton(onClick = onScanClick)     { Icon(Icons.Default.QrCodeScanner, contentDescription = stringResource(R.string.tab_scan)) }
                    IconButton(onClick = onSettingsClick) { Icon(Icons.Default.Settings,      contentDescription = stringResource(R.string.tab_settings)) }
                }
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { showCreate = true },
                icon    = { Icon(Icons.Default.Add, contentDescription = null) },
                text    = { Text(stringResource(R.string.action_new_apiary)) },
                containerColor = Amber500,
                contentColor   = MaterialTheme.colorScheme.onPrimary,
            )
        }
    ) { padding ->
        Box(Modifier.padding(padding)) {
            when {
                state.isLoading && state.apiaries.isEmpty() -> LoadingScreen()
                state.apiaries.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.Hive, contentDescription = null, Modifier.size(48.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(stringResource(R.string.empty_apiaries_title), style = MaterialTheme.typography.titleMedium)
                        Text(stringResource(R.string.action_new_apiary), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                else -> LazyColumn(
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    state.error?.let { item { ErrorBanner(it) { vm.clearError() } } }
                    items(state.apiaries) { apiary ->
                        ApiaryCard(apiary, onClick = { onApiaryClick(apiary.id) }, onDelete = { vm.delete(apiary.id) })
                    }
                }
            }
        }
    }

    if (showCreate) {
        ApiaryFormDialog(
            onConfirm = { name, desc, lat, lon, addr, isPublic ->
                vm.create(name, desc, lat, lon, addr, isPublic) { showCreate = false }
            },
            onDismiss = { showCreate = false }
        )
    }
}

@Composable
private fun ApiaryCard(apiary: ApiaryOut, onClick: () -> Unit, onDelete: () -> Unit) {
    var showDeleteConfirm by remember { mutableStateOf(false) }

    Card(
        modifier  = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape     = MaterialTheme.shapes.large,
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border    = BorderStroke(1.dp, Stone200),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 72.dp)
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Amber hive icon
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .padding(end = 4.dp),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Default.Hive, contentDescription = null,
                    modifier = Modifier.size(36.dp), tint = Amber500)
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(apiary.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("${apiary.hiveCount} ${stringResource(R.string.label_hives)}",
                        style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    apiary.address?.let {
                        Text("· $it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
            IconButton(onClick = { showDeleteConfirm = true }, modifier = Modifier.size(48.dp)) {
                Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error)
            }
        }
    }

    if (showDeleteConfirm) {
        val hasHives = apiary.hiveCount > 0
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title   = { Text(stringResource(R.string.action_delete)) },
            text    = {
                Text(if (hasHives)
                    stringResource(R.string.alert_delete_apiary_has_hives, apiary.name, apiary.hiveCount)
                else stringResource(R.string.alert_delete_apiary, apiary.name))
            },
            confirmButton = {
                TextButton(
                    onClick = { onDelete(); showDeleteConfirm = false },
                    enabled = !hasHives,
                ) { Text(stringResource(R.string.action_delete), color = if (!hasHives) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.38f)) }
            },
            dismissButton = { TextButton(onClick = { showDeleteConfirm = false }) { Text(stringResource(R.string.action_cancel)) } }
        )
    }
}
