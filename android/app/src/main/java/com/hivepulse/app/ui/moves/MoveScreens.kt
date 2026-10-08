package com.hivepulse.app.ui.moves

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.drawable.BitmapDrawable
import android.view.MotionEvent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.LocationOn
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.android.gms.location.LocationServices
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import com.hivepulse.app.R
import com.hivepulse.app.data.api.HiveMoveOut
import com.hivepulse.app.data.api.MoveResultOut
import com.hivepulse.app.ui.common.ErrorBanner
import com.hivepulse.app.ui.common.LoadingScreen
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.BoundingBox
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polyline
import java.io.File
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

/** The forage as the user should read it: the translated name of a known key, or the text as written. */
private fun forageText(context: Context, value: String): String =
    Forage.labelRes(value)?.let { context.getString(it) } ?: value

@Composable
private fun forageLabel(value: String): String = forageText(LocalContext.current, value)

// ── Taking hives elsewhere ────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class, ExperimentalPermissionsApi::class)
@Composable
fun MoveHivesScreen(
    onBack: () -> Unit,
    onMoved: (MoveResultOut) -> Unit,
    vm: MoveHivesViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val locationPerm = rememberPermissionState(android.Manifest.permission.ACCESS_FINE_LOCATION)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.moves_title)) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } },
            )
        }
    ) { padding ->
        if (state.isLoading) {
            LoadingScreen()
            return@Scaffold
        }
        LazyColumn(
            Modifier.padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            state.error?.let { item { ErrorBanner(it) { vm.clearError() } } }

            if (state.returns.isNotEmpty()) {
                item { Text(stringResource(R.string.moves_back_hint), style = MaterialTheme.typography.titleSmall) }
                items(state.returns, key = { "back-" + it.apiaryId }) { suggestion ->
                    OutlinedButton(
                        onClick = { vm.sendBack(suggestion) },
                        modifier = Modifier.fillMaxWidth().testTag("moveBack-" + suggestion.apiaryId),
                    ) {
                        Text(stringResource(R.string.moves_back_to, suggestion.name, suggestion.hiveIds.size))
                    }
                }
            }
            item { Text(stringResource(R.string.moves_select_hives), style = MaterialTheme.typography.titleSmall) }
            item {
                TextButton(onClick = vm::toggleAll, modifier = Modifier.testTag("moveSelectAll")) {
                    Text(stringResource(R.string.moves_select_all))
                }
            }
            items(state.hives, key = { it.id }) { hive ->
                Row(
                    Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Checkbox(
                        checked = hive.id in state.selected,
                        onCheckedChange = { vm.toggle(hive.id) },
                        modifier = Modifier.testTag("moveHive-" + hive.id),
                    )
                    Text(hive.name)
                }
            }

            item { Text(stringResource(R.string.moves_target), style = MaterialTheme.typography.titleSmall) }
            items(state.targets, key = { "target-" + it.id }) { apiary ->
                TargetRow(apiary.name, selected = state.target == apiary.id) { vm.setTarget(apiary.id) }
            }
            item {
                TargetRow(
                    stringResource(R.string.moves_target_new),
                    selected = state.target == NEW_PLACE,
                    modifier = Modifier.testTag("moveTargetNew"),
                ) { vm.setTarget(NEW_PLACE) }
            }
            if (state.target == NEW_PLACE) {
                item {
                    OutlinedTextField(
                        value = state.newName,
                        onValueChange = vm::setNewName,
                        label = { Text(stringResource(R.string.moves_new_name)) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("moveNewName"),
                    )
                }
                item {
                    OutlinedTextField(
                        value = state.newAddress,
                        onValueChange = vm::setNewAddress,
                        label = { Text(stringResource(R.string.moves_new_address)) },
                        supportingText = { Text(stringResource(R.string.moves_new_address_hint)) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        val lat = state.latitude
                        val lon = state.longitude
                        if (lat != null && lon != null) {
                            Text(String.format("%.5f, %.5f", lat, lon), style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.testTag("movePosition"))
                        }
                        OutlinedButton(
                            onClick = {
                                if (locationPerm.status.isGranted) {
                                    val fused = LocationServices.getFusedLocationProviderClient(context)
                                    scope.launch {
                                        try {
                                            fused.lastLocation.await()?.let { vm.setPosition(it.latitude, it.longitude) }
                                        } catch (_: Exception) {}
                                    }
                                } else {
                                    locationPerm.launchPermissionRequest()
                                }
                            },
                            modifier = Modifier.testTag("moveUseLocation"),
                        ) {
                            Icon(Icons.Default.LocationOn, null)
                            Spacer(Modifier.width(4.dp))
                            Text(stringResource(R.string.action_use_my_location))
                        }
                    }
                }
            }

            item {
                DateField(
                    label = stringResource(R.string.moves_date),
                    value = state.movedOn,
                    onChange = { it?.let(vm::setMovedOn) },
                    notAfterToday = true,
                    modifier = Modifier.testTag("moveDate"),
                )
            }

            item { Text(stringResource(R.string.moves_forage), style = MaterialTheme.typography.titleSmall) }
            item {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    FilterChip(
                        selected = state.forage.isEmpty(),
                        onClick = { vm.setForage("") },
                        label = { Text(stringResource(R.string.moves_forage_none)) },
                    )
                    Forage.keys.filter { it != "other" }.forEach { key ->
                        FilterChip(
                            selected = state.forage == key,
                            onClick = { vm.setForage(key) },
                            label = { Text(forageLabel(key)) },
                            modifier = Modifier.testTag("forage-$key"),
                        )
                    }
                    FilterChip(
                        selected = state.forage == OTHER_FORAGE,
                        onClick = { vm.setForage(OTHER_FORAGE) },
                        label = { Text(forageLabel("other")) },
                    )
                }
            }
            if (state.forage == OTHER_FORAGE) {
                item {
                    OutlinedTextField(
                        value = state.otherForage,
                        onValueChange = { vm.setOtherForage(it.take(100)) },
                        label = { Text(stringResource(R.string.moves_forage_other)) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }

            item {
                OutlinedTextField(
                    value = state.note,
                    onValueChange = vm::setNote,
                    label = { Text(stringResource(R.string.moves_note)) },
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            item {
                Button(
                    onClick = { vm.submit(onMoved) },
                    enabled = state.canSubmit,
                    modifier = Modifier.fillMaxWidth().testTag("moveSubmit"),
                ) {
                    if (state.isSubmitting) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                    else Text(stringResource(R.string.moves_submit, state.selected.size))
                }
            }
        }
    }
}

@Composable
private fun TargetRow(label: String, selected: Boolean, modifier: Modifier = Modifier, onSelect: () -> Unit) {
    Row(
        modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        RadioButton(selected = selected, onClick = onSelect)
        Text(label)
    }
}

/** A date chosen from a calendar; the value is the server's day format, YYYY-MM-DD. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun DateField(
    label: String,
    value: String?,
    onChange: (String?) -> Unit,
    modifier: Modifier = Modifier,
    notAfterToday: Boolean = false,
    clearable: Boolean = false,
) {
    var open by remember { mutableStateOf(false) }
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedButton(onClick = { open = true }, modifier = modifier) {
            Text(label + ": " + (value ?: "—"))
        }
        if (clearable && value != null) {
            TextButton(onClick = { onChange(null) }) { Text(stringResource(R.string.moves_clear)) }
        }
    }
    if (open) {
        val endOfToday = LocalDate.now().plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli() - 1
        val picker = rememberDatePickerState(
            initialSelectedDateMillis = value?.let { LocalDate.parse(it).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli() },
            selectableDates = object : SelectableDates {
                override fun isSelectableDate(utcTimeMillis: Long) = !notAfterToday || utcTimeMillis <= endOfToday
            },
        )
        DatePickerDialog(
            onDismissRequest = { open = false },
            confirmButton = {
                TextButton(onClick = {
                    picker.selectedDateMillis?.let {
                        onChange(Instant.ofEpochMilli(it).atZone(ZoneOffset.UTC).toLocalDate().toString())
                    }
                    open = false
                }) { Text(stringResource(R.string.moves_date_ok)) }
            },
            dismissButton = { TextButton(onClick = { open = false }) { Text(stringResource(R.string.action_cancel)) } },
        ) { DatePicker(state = picker) }
    }
}

// ── Where a hive has stood ────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HiveMovesScreen(onBack: () -> Unit, vm: HiveMovesViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.moves_history_title)) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } },
            )
        }
    ) { padding ->
        LazyColumn(Modifier.padding(padding), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (state.loaded && state.moves.isEmpty()) {
                item { Text(stringResource(R.string.moves_history_empty), color = MaterialTheme.colorScheme.onSurfaceVariant) }
            }
            if (MoveRoutes.hasPositions(state.routes)) {
                item { MovesMap(state.routes, Modifier.fillMaxWidth().height(320.dp).clip(MaterialTheme.shapes.large)) }
                item {
                    Text(
                        stringResource(R.string.heatmap_osm_attribution),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            items(state.moves, key = { it.id }) { move -> MoveListItem(move) }
        }
    }
}

@Composable
private fun MoveListItem(move: HiveMoveOut, showHive: Boolean = false) {
    ListItem(
        headlineContent = { Text(move.movedOn) },
        supportingContent = {
            Column {
                if (showHive) Text(move.hiveName)
                Text(move.from.name + " → " + move.to.name, style = MaterialTheme.typography.bodySmall)
                move.note?.takeIf { it.isNotBlank() }?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                if (move.to.latitude == null || move.to.longitude == null) {
                    Text(
                        stringResource(R.string.moves_no_position),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        },
        trailingContent = move.forage?.let { forage -> { AssistChip(onClick = {}, label = { Text(forageLabel(forage)) }) } },
    )
}

// ── The map of all journeys ───────────────────────────────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MovesOverviewScreen(onBack: () -> Unit, vm: MovesOverviewViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.moves_overview_title)) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } },
            )
        }
    ) { padding ->
        LazyColumn(Modifier.padding(padding), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            state.error?.let { item { ErrorBanner(it) { vm.clearError() } } }
            item {
                Text(
                    stringResource(R.string.moves_overview_intro),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            item {
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    DateField(
                        label = stringResource(R.string.moves_from),
                        value = state.from,
                        onChange = { vm.setRange(it, state.to) },
                        clearable = true,
                        modifier = Modifier.testTag("movesFrom"),
                    )
                    DateField(
                        label = stringResource(R.string.moves_to),
                        value = state.to,
                        onChange = { vm.setRange(state.from, it) },
                        clearable = true,
                        modifier = Modifier.testTag("movesTo"),
                    )
                }
            }
            if (state.isLoading) item { LinearProgressIndicator(Modifier.fillMaxWidth()) }
            if (state.moves.isEmpty() && !state.isLoading && state.error == null) {
                item { Text(stringResource(R.string.moves_overview_empty), color = MaterialTheme.colorScheme.onSurfaceVariant) }
            }
            if (state.moves.isNotEmpty()) {
                if (MoveRoutes.hasPositions(state.routes)) {
                    item { MovesMap(state.routes, Modifier.fillMaxWidth().height(320.dp).clip(MaterialTheme.shapes.large)) }
                    item {
                        Text(
                            stringResource(R.string.heatmap_osm_attribution),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                } else {
                    item { Text(stringResource(R.string.moves_no_position_at_all), color = MaterialTheme.colorScheme.onSurfaceVariant) }
                }
                items(state.moves, key = { it.id }) { move -> MoveListItem(move, showHive = true) }
            }
        }
    }
}

// ── The map ───────────────────────────────────────────────────────────────────────────────────

private val PALETTE = intArrayOf(
    0xFFD97706.toInt(), 0xFF0F766E.toInt(), 0xFF7C3AED.toInt(), 0xFFBE123C.toInt(),
    0xFF1D4ED8.toInt(), 0xFF4D7C0F.toInt(), 0xFFC2410C.toInt(), 0xFF0E7490.toInt(),
)

private fun routeColor(route: MoveRoute): Int = PALETTE[route.colorIndex % PALETTE.size]

/** A numbered disc for a stop on the map: a house for where the journey started. */
private fun pin(context: Context, order: Int, color: Int): BitmapDrawable {
    val size = (28 * context.resources.displayMetrics.density).toInt()
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    paint.color = 0xFFFFFFFF.toInt()
    canvas.drawCircle(size / 2f, size / 2f, size / 2f, paint)
    paint.color = color
    canvas.drawCircle(size / 2f, size / 2f, size / 2f - size * 0.08f, paint)
    paint.color = 0xFFFFFFFF.toInt()
    paint.textAlign = Paint.Align.CENTER
    paint.textSize = size * 0.5f
    paint.isFakeBoldText = true
    canvas.drawText(if (order == 0) "⌂" else order.toString(), size / 2f, size / 2f - (paint.descent() + paint.ascent()) / 2, paint)
    return BitmapDrawable(context.resources, bitmap)
}

/** The journeys of hives: a line per hive through the places it was taken to, numbered in order. */
@SuppressLint("ClickableViewAccessibility")
@Composable
fun MovesMap(routes: List<MoveRoute>, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val startLabel = stringResource(R.string.moves_start)
    val mapView = remember {
        Configuration.getInstance().apply {
            // OSM tile usage policy requires an identifying user agent; keep tiles in app cache (no storage permission)
            userAgentValue    = context.packageName
            osmdroidBasePath  = context.cacheDir
            osmdroidTileCache = File(context.cacheDir, "osmdroid")
        }
        MapView(context).apply {
            setTileSource(TileSourceFactory.MAPNIK)
            setMultiTouchControls(true)
            minZoomLevel = 3.0
            maxZoomLevel = 18.0
            controller.setZoom(5.0)
            controller.setCenter(GeoPoint(48.0, 10.0))
            // Stop the surrounding scroll column from stealing pan/zoom gestures
            setOnTouchListener { view, event ->
                if (event.action == MotionEvent.ACTION_DOWN) view.parent?.requestDisallowInterceptTouchEvent(true)
                false
            }
        }
    }
    DisposableEffect(mapView) {
        mapView.onResume()
        onDispose {
            mapView.onPause()
            mapView.onDetach()
        }
    }
    AndroidView(
        factory = { mapView },
        modifier = modifier.testTag("movesMap"),
        update = { view ->
            view.overlays.clear()
            val all = mutableListOf<GeoPoint>()
            routes.forEach { route ->
                val line = route.points.map { GeoPoint(it.latitude, it.longitude) }
                all += line
                if (line.size > 1) {
                    view.overlays.add(Polyline(view).apply {
                        setPoints(line)
                        outlinePaint.color = routeColor(route)
                        outlinePaint.strokeWidth = 8f
                    })
                }
                route.points.forEach { point ->
                    view.overlays.add(Marker(view).apply {
                        position = GeoPoint(point.latitude, point.longitude)
                        icon = pin(view.context, point.order, routeColor(route))
                        setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                        title = point.name
                        snippet = listOfNotNull(
                            route.hiveName,
                            if (point.order == 0) startLabel else point.date,
                            point.forage?.let { forageText(view.context, it) },
                        ).joinToString("\n")
                    })
                }
            }
            // The view has no size until it is laid out, and zooming to a box needs one.
            view.post {
                if (all.size > 1) view.zoomToBoundingBox(BoundingBox.fromGeoPoints(all), false, 80)
                else if (all.size == 1) {
                    view.controller.setZoom(11.0)
                    view.controller.setCenter(all.first())
                }
                view.invalidate()
            }
        },
    )
}
