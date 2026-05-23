package com.hivepulse.app.ui.hornet

import android.Manifest
import android.annotation.SuppressLint
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.hivepulse.app.R
import com.hivepulse.app.data.api.HornetTrapOut
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.tasks.await
import java.time.LocalDate

// ── Mode

private enum class TrapMode { HOME, NEARBY, SEARCH, REGISTER, TRAP_DETAIL }

// ── Root composable

@Composable
fun HornetTrapsContent(vm: HornetViewModel) {
    val state by vm.state.collectAsState()
    var mode by remember { mutableStateOf(TrapMode.HOME) }

    when (mode) {
        TrapMode.HOME -> TrapHomeView(
            onNearby = { mode = TrapMode.NEARBY },
            onSearch = { mode = TrapMode.SEARCH },
            onRegister = { mode = TrapMode.REGISTER }
        )
        TrapMode.NEARBY -> TrapNearbyView(
            state = state,
            vm = vm,
            onBack = { mode = TrapMode.HOME; vm.clearTrapState() },
            onOpenTrap = { code ->
                vm.loadTrap(code)
                mode = TrapMode.TRAP_DETAIL
            }
        )
        TrapMode.SEARCH -> TrapSearchView(
            state = state,
            vm = vm,
            onBack = { mode = TrapMode.HOME },
            onFound = { mode = TrapMode.TRAP_DETAIL }
        )
        TrapMode.REGISTER -> TrapRegisterView(
            state = state,
            vm = vm,
            onBack = { mode = TrapMode.HOME },
            onSuccess = { mode = TrapMode.TRAP_DETAIL }
        )
        TrapMode.TRAP_DETAIL -> state.currentTrap?.let { trap ->
            TrapDetailView(
                trap = trap,
                state = state,
                vm = vm,
                onBack = { mode = TrapMode.HOME; vm.clearTrapState() }
            )
        } ?: Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    }
}

// ── Home

@Composable
private fun TrapHomeView(
    onNearby: () -> Unit,
    onSearch: () -> Unit,
    onRegister: () -> Unit
) {
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(stringResource(R.string.hornet_traps_title), style = MaterialTheme.typography.titleLarge)
        Text(stringResource(R.string.hornet_traps_subtitle),
            style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)

        Spacer(Modifier.height(8.dp))

        TrapActionCard(
            icon = { Icon(Icons.Default.LocationOn, null, tint = MaterialTheme.colorScheme.tertiary) },
            title = stringResource(R.string.hornet_traps_nearby),
            subtitle = stringResource(R.string.hornet_traps_nearby_searching),
            onClick = onNearby
        )
        TrapActionCard(
            icon = { Text("🔑", style = MaterialTheme.typography.titleLarge) },
            title = stringResource(R.string.hornet_traps_search),
            subtitle = stringResource(R.string.hornet_traps_search_code),
            onClick = onSearch
        )
        TrapActionCard(
            icon = { Text("➕", style = MaterialTheme.typography.titleLarge) },
            title = stringResource(R.string.hornet_traps_new),
            subtitle = stringResource(R.string.hornet_traps_hint),
            onClick = onRegister
        )
    }
}

@Composable
private fun TrapActionCard(
    icon: @Composable () -> Unit,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            icon()
            Column(Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleSmall)
                Text(subtitle, style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

// ── Nearby

@SuppressLint("MissingPermission")
@Composable
private fun TrapNearbyView(
    state: HornetState,
    vm: HornetViewModel,
    onBack: () -> Unit,
    onOpenTrap: (String) -> Unit
) {
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        try {
            val fusedClient = LocationServices.getFusedLocationProviderClient(context)
            val cts = CancellationTokenSource()
            val loc = fusedClient.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, cts.token).await()
            if (loc != null) vm.loadNearbyTraps(loc.latitude, loc.longitude)
        } catch (_: Exception) {}
    }

    Column(Modifier.fillMaxSize()) {
        BackBar(title = stringResource(R.string.hornet_traps_nearby), onBack = onBack)

        when {
            state.trapLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            state.nearbyTraps.isEmpty() -> Box(Modifier.fillMaxSize().padding(24.dp),
                contentAlignment = Alignment.Center) {
                Text(stringResource(R.string.hornet_traps_no_nearby),
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            else -> LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(state.nearbyTraps, key = { it.accessCode }) { nt ->
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(nt.name, style = MaterialTheme.typography.titleSmall)
                                Text("${nt.distanceM} m",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.tertiary)
                            }
                            Text("${stringResource(R.string.hornet_traps_total)}: ${nt.totalCaught}",
                                style = MaterialTheme.typography.bodySmall)
                            TextButton(onClick = { onOpenTrap(nt.accessCode) }) {
                                Text(stringResource(R.string.hornet_traps_log_catch) + " →")
                            }
                        }
                    }
                }
            }
        }
    }
}

// ── Search

@Composable
private fun TrapSearchView(
    state: HornetState,
    vm: HornetViewModel,
    onBack: () -> Unit,
    onFound: () -> Unit
) {
    var code by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize()) {
        BackBar(title = stringResource(R.string.hornet_traps_search), onBack = onBack)

        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(
                value = code,
                onValueChange = { code = it.uppercase().take(8) },
                label = { Text(stringResource(R.string.hornet_traps_search_code)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Ascii)
            )
            Button(
                onClick = {
                    vm.loadTrap(code)
                    // Navigate once loading completes and trap is set — observed via effect
                },
                enabled = code.length == 8 && !state.trapLoading,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(stringResource(R.string.hornet_traps_search))
            }

            LaunchedEffect(state.currentTrap) {
                if (state.currentTrap != null) onFound()
            }

            state.trapError?.let {
                Text(it, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}

// ── Register

@SuppressLint("MissingPermission")
@Composable
private fun TrapRegisterView(
    state: HornetState,
    vm: HornetViewModel,
    onBack: () -> Unit,
    onSuccess: () -> Unit
) {
    val context = LocalContext.current
    var name by remember { mutableStateOf("") }
    var lat by remember { mutableStateOf("") }
    var lon by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var owner by remember { mutableStateOf("") }
    var gpsLoading by remember { mutableStateOf(false) }
    var createdTrap by remember { mutableStateOf<HornetTrapOut?>(null) }

    Column(Modifier.fillMaxSize()) {
        BackBar(title = stringResource(R.string.hornet_traps_new), onBack = onBack)

        if (createdTrap != null) {
            // Success: show access code
            val trap = createdTrap!!
            Column(
                Modifier.fillMaxWidth().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text("✅", style = MaterialTheme.typography.displaySmall)
                Text(stringResource(R.string.hornet_traps_success), style = MaterialTheme.typography.titleMedium)
                Text(trap.name, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(stringResource(R.string.hornet_traps_code),
                            style = MaterialTheme.typography.labelSmall)
                        Text(trap.accessCode,
                            style = MaterialTheme.typography.headlineMedium.copy(
                                letterSpacing = 6.sp,
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                            ))
                    }
                }
                Button(onClick = {
                    vm.setCurrentTrap(trap)
                    onSuccess()
                }, modifier = Modifier.fillMaxWidth()) {
                    Text(stringResource(R.string.hornet_traps_log_catch))
                }
            }
        } else {
            LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item {
                    OutlinedTextField(
                        value = name, onValueChange = { name = it },
                        label = { Text(stringResource(R.string.hornet_traps_name)) },
                        modifier = Modifier.fillMaxWidth(), singleLine = true
                    )
                }
                item {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically) {
                        OutlinedTextField(
                            value = lat, onValueChange = { lat = it },
                            label = { Text("Lat") },
                            modifier = Modifier.weight(1f), singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                        )
                        OutlinedTextField(
                            value = lon, onValueChange = { lon = it },
                            label = { Text("Lon") },
                            modifier = Modifier.weight(1f), singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                        )
                        IconButton(onClick = {
                            gpsLoading = true
                            val fusedClient = LocationServices.getFusedLocationProviderClient(context)
                            val cts = CancellationTokenSource()
                            fusedClient.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, cts.token)
                                .addOnSuccessListener { loc ->
                                    if (loc != null) {
                                        lat = "%.6f".format(loc.latitude)
                                        lon = "%.6f".format(loc.longitude)
                                    }
                                    gpsLoading = false
                                }
                                .addOnFailureListener { gpsLoading = false }
                        }, enabled = !gpsLoading) {
                            Icon(Icons.Default.LocationOn, contentDescription = stringResource(R.string.hornet_traps_gps))
                        }
                    }
                }
                item {
                    OutlinedTextField(
                        value = notes, onValueChange = { notes = it },
                        label = { Text(stringResource(R.string.hornet_traps_notes)) },
                        modifier = Modifier.fillMaxWidth(), maxLines = 3
                    )
                }
                item {
                    OutlinedTextField(
                        value = owner, onValueChange = { owner = it },
                        label = { Text(stringResource(R.string.hornet_traps_owner)) },
                        modifier = Modifier.fillMaxWidth(), singleLine = true
                    )
                }
                item {
                    Button(
                        onClick = {
                            val latVal = lat.toDoubleOrNull() ?: return@Button
                            val lonVal = lon.toDoubleOrNull() ?: return@Button
                            vm.createTrap(
                                name = name, latitude = latVal, longitude = lonVal,
                                notes = notes.ifBlank { null },
                                ownerName = owner.ifBlank { null },
                                onSuccess = { trap -> createdTrap = trap }
                            )
                        },
                        enabled = name.isNotBlank() && lat.isNotBlank() && lon.isNotBlank() && !state.trapLoading,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(stringResource(R.string.hornet_traps_submit))
                    }
                }
                state.trapError?.let {
                    item { Text(it, color = MaterialTheme.colorScheme.error) }
                }
            }
        }
    }
}

// ── Trap Detail

@Composable
private fun TrapDetailView(
    trap: HornetTrapOut,
    state: HornetState,
    vm: HornetViewModel,
    onBack: () -> Unit
) {
    var count by remember { mutableStateOf("1") }
    var date by remember { mutableStateOf(LocalDate.now().toString()) }

    Column(Modifier.fillMaxSize()) {
        BackBar(title = trap.name, onBack = onBack)

        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)) {

            // Info card
            item {
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("📍 ${trap.latitude.toBigDecimal().setScale(4, java.math.RoundingMode.HALF_UP)}, " +
                                    "${trap.longitude.toBigDecimal().setScale(4, java.math.RoundingMode.HALF_UP)}",
                                style = MaterialTheme.typography.bodySmall)
                            Text("🐝 ${stringResource(R.string.hornet_traps_total)}: ${trap.totalCaught}",
                                style = MaterialTheme.typography.labelMedium)
                        }
                        trap.notes?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                        Text(trap.accessCode,
                            style = MaterialTheme.typography.labelLarge.copy(
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                                letterSpacing = 2.sp
                            ))
                    }
                }
            }

            // Log catch form
            item {
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(stringResource(R.string.hornet_traps_log_catch),
                            style = MaterialTheme.typography.titleSmall)
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = count, onValueChange = { count = it },
                                label = { Text(stringResource(R.string.hornet_traps_count)) },
                                modifier = Modifier.weight(0.4f), singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                            )
                            OutlinedTextField(
                                value = date, onValueChange = { date = it },
                                label = { Text(stringResource(R.string.hornet_traps_date)) },
                                modifier = Modifier.weight(0.6f), singleLine = true
                            )
                        }
                        Button(
                            onClick = {
                                val c = count.toIntOrNull()?.takeIf { it > 0 } ?: return@Button
                                vm.addTrapCatch(trap.accessCode, c, date)
                            },
                            enabled = !state.trapLoading,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(stringResource(R.string.hornet_traps_log_submit))
                        }
                        state.trapSuccess?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
                        state.trapError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    }
                }
            }

            // Catch history
            val sorted = trap.catches.sortedByDescending { it.caughtOn }
            if (sorted.isEmpty()) {
                item {
                    Text(stringResource(R.string.hornet_traps_no_catches),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(vertical = 8.dp))
                }
            } else {
                item {
                    Text(stringResource(R.string.hornet_traps_history),
                        style = MaterialTheme.typography.titleSmall)
                }
                items(sorted, key = { it.id }) { c ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(c.caughtOn, style = MaterialTheme.typography.bodyMedium)
                        Text("${c.count} 🐝", style = MaterialTheme.typography.labelLarge)
                    }
                    HorizontalDivider(Modifier.padding(top = 4.dp))
                }
            }
        }
    }
}

// ── Shared

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BackBar(title: String, onBack: () -> Unit) {
    TopAppBar(
        title = { Text(title, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis) },
        navigationIcon = {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.hornet_traps_back))
            }
        }
    )
}

private val Int.sp get() = androidx.compose.ui.unit.TextUnit(this.toFloat(), androidx.compose.ui.unit.TextUnitType.Sp)
