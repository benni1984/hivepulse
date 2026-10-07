package com.hivepulse.app.ui.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hivepulse.app.R
import com.hivepulse.app.data.api.PlannedTreatmentOut
import com.hivepulse.app.data.api.isOverdue
import com.hivepulse.app.ui.common.ErrorBanner
import com.hivepulse.app.ui.moves.DateField

private val Good = Color(0xFF166534)
private val Warn = Color(0xFFB45309)

private fun reasonText(context: android.content.Context, reason: String): String {
    val res = when (reason) {
        "varroa_high"    -> R.string.home_reason_varroa_high
        "swarm_cells"    -> R.string.home_reason_swarm_cells
        "aggressive"     -> R.string.home_reason_aggressive
        "varroa_medium"  -> R.string.home_reason_varroa_medium
        "nervous"        -> R.string.home_reason_nervous
        "queen_not_seen" -> R.string.home_reason_queen_not_seen
        else             -> null
    }
    // A reason this app does not know yet is shown as the server sent it.
    return res?.let { context.getString(it) } ?: reason
}

/**
 * What a beekeeper wants to know on opening the app, as cards at the top of the apiary list: what is due, how
 * the hives are, what is coming up, and an announcement the server can switch on.
 */
fun LazyListScope.homeSummaryItems(
    state: HomeState,
    onHiveClick: (String) -> Unit,
    onMarkDone: (PlannedTreatmentOut) -> Unit,
    onDismissError: () -> Unit,
) {
    val home = state.home
    if (!state.isVisible || home == null) return

    state.error?.let { item { ErrorBanner(it, onDismissError) } }

    if (!home.inSeason) {
        item {
            Text(
                stringResource(R.string.home_out_of_season),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }

    // ── Next inspection ──────────────────────────────────────────────────────────────────────
    item {
        Card(Modifier.fillMaxWidth().testTag("homeInspections")) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(stringResource(R.string.home_next_inspection), style = MaterialTheme.typography.titleSmall)
                val inspections = home.inspections
                val first = inspections.next.firstOrNull()
                if (inspections.overdueCount > 0) {
                    Text(
                        stringResource(R.string.home_overdue, inspections.overdueCount),
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.error,
                    )
                } else if (first != null) {
                    Text(
                        stringResource(R.string.home_due_on, formatDay(first.dueOn)),
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    )
                    if (inspections.dueSoonCount > 0) {
                        Text(stringResource(R.string.home_due_soon, inspections.dueSoonCount), style = MaterialTheme.typography.bodySmall)
                    }
                }
                inspections.next.forEach { item ->
                    Column(Modifier.fillMaxWidth().clickable { onHiveClick(item.hiveId) }.padding(vertical = 4.dp)) {
                        Text(item.hiveName, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold))
                        Text(item.apiaryName, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        val late = item.overdueDays > 0
                        Text(
                            (if (late) stringResource(R.string.home_due_since, formatDay(item.dueOn)) else formatDay(item.dueOn)) +
                                (if (item.lastInspectionOn == null) " · " + stringResource(R.string.home_never_inspected) else ""),
                            style = MaterialTheme.typography.bodySmall,
                            color = if (late) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }

    // ── Health ───────────────────────────────────────────────────────────────────────────────
    item {
        val context = LocalContext.current
        Card(Modifier.fillMaxWidth().testTag("homeHealth")) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(stringResource(R.string.home_health), style = MaterialTheme.typography.titleSmall)
                val health = home.health
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(stringResource(R.string.home_health_ok, health.ok), color = Good, style = MaterialTheme.typography.labelLarge)
                    Text(stringResource(R.string.home_health_watch, health.watch), color = Warn, style = MaterialTheme.typography.labelLarge)
                    Text(stringResource(R.string.home_health_alert, health.alert), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.labelLarge)
                    Text(stringResource(R.string.home_health_unknown, health.unknown), color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelLarge)
                }
                if (health.attention.isEmpty()) {
                    Text(stringResource(R.string.home_no_concerns), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                health.attention.forEach { item ->
                    Column(Modifier.fillMaxWidth().clickable { onHiveClick(item.hiveId) }.padding(vertical = 4.dp)) {
                        Text(item.hiveName, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold))
                        Text(item.apiaryName, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(
                            item.reasons.joinToString(", ") { reasonText(context, it) },
                            style = MaterialTheme.typography.bodySmall,
                            color = if (item.status == "alert") MaterialTheme.colorScheme.error else Warn,
                        )
                    }
                }
            }
        }
    }

    // ── Treatments ───────────────────────────────────────────────────────────────────────────
    item {
        Card(Modifier.fillMaxWidth().testTag("homeTreatments")) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(stringResource(R.string.home_treatments), style = MaterialTheme.typography.titleSmall)
                val treatments = home.treatments
                if (treatments.overdueCount > 0) {
                    Text(
                        stringResource(R.string.home_treatments_overdue, treatments.overdueCount),
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.error,
                    )
                }
                if (treatments.upcoming.isEmpty()) {
                    Text(stringResource(R.string.home_no_treatments), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                treatments.upcoming.forEach { item ->
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(item.product, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold))
                            Text(item.target.name, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(
                                if (item.isOverdue) stringResource(R.string.home_due_since, formatDay(item.dueOn)) else formatDay(item.dueOn),
                                style = MaterialTheme.typography.bodySmall,
                                color = if (item.isOverdue) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        OutlinedButton(onClick = { onMarkDone(item) }, modifier = Modifier.testTag("homeMarkDone")) {
                            Text(stringResource(R.string.home_mark_done))
                        }
                    }
                }
            }
        }
    }

    // ── An announcement, when the operator switched one on ───────────────────────────────────
    home.ad?.let { ad ->
        item {
            Card(Modifier.fillMaxWidth().testTag("homeAd"), colors = CardDefaults.outlinedCardColors()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    AssistChip(onClick = {}, label = { Text(ad.label) })
                    Text(ad.title, style = MaterialTheme.typography.titleMedium)
                    Text(ad.body, style = MaterialTheme.typography.bodyMedium)
                    ad.url?.let { url ->
                        val uriHandler = androidx.compose.ui.platform.LocalUriHandler.current
                        TextButton(onClick = { runCatching { uriHandler.openUri(url) } }) {
                            Text(url.removePrefix("https://").removePrefix("http://"))
                        }
                    }
                }
            }
        }
    }
}

/**
 * The treatments planned for one hive or for every hive of an apiary: what is coming, what is done, and the
 * form to plan another.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TreatmentsScreen(onBack: () -> Unit, vm: TreatmentsViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    var toDelete by remember { mutableStateOf<PlannedTreatmentOut?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.treatments_title)) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } },
            )
        }
    ) { padding ->
        LazyColumn(Modifier.padding(padding), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            state.error?.let { item { ErrorBanner(it) { vm.clearError() } } }

            item {
                Text(
                    stringResource(if (vm.isHive) R.string.treatments_intro_hive else R.string.treatments_intro_apiary),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            item {
                OutlinedTextField(
                    value = state.product,
                    onValueChange = { vm.setProduct(it.take(200)) },
                    label = { Text(stringResource(R.string.treatments_product)) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("treatmentProduct"),
                )
            }
            item {
                DateField(
                    label = stringResource(R.string.treatments_due_on),
                    value = state.dueOn,
                    onChange = { it?.let(vm::setDueOn) },
                    modifier = Modifier.testTag("treatmentDue"),
                )
            }
            item {
                OutlinedTextField(
                    value = state.note,
                    onValueChange = vm::setNote,
                    label = { Text(stringResource(R.string.treatments_note)) },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            item {
                Button(onClick = vm::plan, enabled = state.canPlan, modifier = Modifier.fillMaxWidth().testTag("treatmentPlan")) {
                    if (state.isSaving) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                    else Text(stringResource(R.string.treatments_plan))
                }
            }

            if (state.open.isEmpty() && !state.isLoading) {
                item { Text(stringResource(R.string.treatments_empty), color = MaterialTheme.colorScheme.onSurfaceVariant) }
            }
            items(state.open, key = { it.id }) { item ->
                ListItem(
                    headlineContent = { Text(item.product) },
                    supportingContent = {
                        Column {
                            Text(
                                if (item.isOverdue) stringResource(R.string.treatments_overdue, formatDay(item.dueOn))
                                else stringResource(R.string.treatments_due_on_date, formatDay(item.dueOn)),
                                color = if (item.isOverdue) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            item.note?.takeIf { it.isNotBlank() }?.let { Text(it) }
                        }
                    },
                    trailingContent = {
                        Row {
                            IconButton(onClick = { vm.markDone(item) }, modifier = Modifier.testTag("treatmentDone")) {
                                Icon(Icons.Default.Check, contentDescription = stringResource(R.string.home_mark_done), tint = Good)
                            }
                            IconButton(onClick = { toDelete = item }, modifier = Modifier.testTag("treatmentDelete")) {
                                Icon(Icons.Default.Delete, contentDescription = stringResource(R.string.action_delete), tint = MaterialTheme.colorScheme.error)
                            }
                        }
                    },
                )
            }

            if (state.done.isNotEmpty()) {
                item { Text(stringResource(R.string.treatments_done_title), style = MaterialTheme.typography.titleSmall) }
                items(state.done, key = { "done-" + it.id }) { item ->
                    ListItem(
                        headlineContent = { Text(item.product) },
                        supportingContent = { Text(stringResource(R.string.treatments_done_on, formatDay(item.doneOn))) },
                        trailingContent = {
                            TextButton(onClick = { vm.reopen(item) }, modifier = Modifier.testTag("treatmentReopen")) {
                                Text(stringResource(R.string.treatments_reopen))
                            }
                        },
                    )
                }
            }
        }
    }

    toDelete?.let { item ->
        AlertDialog(
            onDismissRequest = { toDelete = null },
            title = { Text(stringResource(R.string.action_delete)) },
            text = { Text(stringResource(R.string.treatments_confirm_delete)) },
            confirmButton = {
                TextButton(onClick = { vm.delete(item); toDelete = null }, modifier = Modifier.testTag("treatmentConfirmDelete")) {
                    Text(stringResource(R.string.action_delete), color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = { TextButton(onClick = { toDelete = null }) { Text(stringResource(R.string.action_cancel)) } },
        )
    }
}
