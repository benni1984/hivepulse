package com.hivepulse.app.ui.hornet

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.drawable.BitmapDrawable
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.android.gms.location.LocationServices
import com.hivepulse.app.R
import com.hivepulse.app.data.api.HornetNestFeature
import com.hivepulse.app.data.api.HornetNestProperties
import com.hivepulse.app.ui.common.LoadingScreen
import com.hivepulse.app.ui.theme.HornetDestroyed
import com.hivepulse.app.ui.theme.HornetFound
import com.hivepulse.app.ui.theme.HornetOrdered
import com.hivepulse.app.ui.theme.Stone200
import kotlinx.coroutines.tasks.await
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.BoundingBox
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import java.io.File

/**
 * The reported nests, on a map (#556).
 *
 * This tab has been called "Map" since the tracker was built and drew a list of cards until now,
 * while the iPhone and the website drew a map under the same word. A list cannot answer the
 * question somebody opens this screen with -- is one of these near me -- and the coordinates
 * were in the response the whole time.
 */
@Composable
fun HornetMapContent(vm: HornetViewModel) {
    val state by vm.state.collectAsState()

    // Both before the loading branch, so leaving and re-entering it does not restart the
    // permission state or ask for the position a second time.
    LaunchedEffect(Unit) { vm.loadNests() }
    val here = beekeeperLocation()

    if (state.isLoading && state.nests == null) {
        LoadingScreen()
        return
    }

    val features = state.nests?.features.orEmpty()

    Box(Modifier.fillMaxSize()) {
        NestMap(
            features = features,
            camera = HornetMapCamera.of(features, here),
            modifier = Modifier.fillMaxSize(),
        )

        // The map is drawn even with nothing on it, because an empty region *is* an answer: the
        // beekeeper looking at their own surroundings learns that nothing has been reported
        // there. The old screen replaced the whole tab with this message.
        if (features.isEmpty()) {
            NoNestsNotice(Modifier.align(Alignment.TopCenter).padding(12.dp))
        }

        NestLegend(Modifier.align(Alignment.BottomStart).padding(12.dp))
    }
}

/**
 * The device's last known position, but only where the permission is already there.
 *
 * Never `launchPermissionRequest()`. A dialog that appears because somebody opened a map is one
 * they refuse, and a refusal is remembered for the whole app -- including the report form and
 * the trap form, where the location genuinely is what they came for. Those two ask, because
 * there the dialog answers a button that was pressed.
 */
@OptIn(ExperimentalPermissionsApi::class)
@Composable
private fun beekeeperLocation(): LatLng? {
    val context = LocalContext.current
    val permission = rememberPermissionState(Manifest.permission.ACCESS_FINE_LOCATION)
    var here by remember { mutableStateOf<LatLng?>(null) }

    LaunchedEffect(permission.status.isGranted) {
        if (!permission.status.isGranted) return@LaunchedEffect
        here = runCatching {
            LocationServices.getFusedLocationProviderClient(context).lastLocation.await()
        }.getOrNull()?.let { LatLng(it.latitude, it.longitude) }
    }
    return here
}

/** Holds the camera that has already been applied, so panning is not undone on recomposition. */
private class AppliedCamera {
    var value: HornetMapCamera? = null
}

@SuppressLint("ClickableViewAccessibility")
@Composable
private fun NestMap(
    features: List<HornetNestFeature>,
    camera: HornetMapCamera,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val statusLabels = mapOf(
        "destruction_ordered" to stringResource(R.string.hornet_map_status_ordered),
        "destroyed" to stringResource(R.string.hornet_map_status_destroyed),
        "found" to stringResource(R.string.hornet_map_status_found),
    )
    val applied = remember { AppliedCamera() }

    val mapView = remember {
        Configuration.getInstance().apply {
            // OSM tile usage policy requires an identifying user agent; keep tiles in app cache
            // (no storage permission)
            userAgentValue = context.packageName
            osmdroidBasePath = context.cacheDir
            osmdroidTileCache = File(context.cacheDir, "osmdroid")
        }
        MapView(context).apply {
            setTileSource(TileSourceFactory.MAPNIK)
            setMultiTouchControls(true)
            minZoomLevel = 3.0
            maxZoomLevel = 18.0
            controller.setZoom(HornetMapCamera.wideEurope.zoom)
            controller.setCenter(HornetMapCamera.wideEurope.centre.geoPoint())
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
        modifier = modifier.testTag("hornetNestMap"),
        update = { view ->
            view.overlays.clear()
            features.forEach { feature ->
                val point = feature.geometry.asLatLng() ?: return@forEach
                view.overlays.add(
                    Marker(view).apply {
                        position = point.geoPoint()
                        icon = nestPin(view.context, feature.properties.statusColour())
                        setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                        title = statusLabels[feature.properties.status]
                            ?: statusLabels.getValue("found")
                        snippet = listOfNotNull(
                            feature.properties.notes,
                            feature.properties.reporterName,
                            feature.properties.createdAt.take(10),
                        ).joinToString("\n")
                    }
                )
            }
            // A view has no size until it is laid out, and fitting a box needs one.
            view.post {
                if (applied.value != camera) {
                    when (camera) {
                        is HornetMapCamera.At -> {
                            view.controller.setZoom(camera.zoom)
                            view.controller.setCenter(camera.centre.geoPoint())
                        }
                        is HornetMapCamera.Around -> view.zoomToBoundingBox(
                            BoundingBox(
                                camera.bounds.north,
                                camera.bounds.east,
                                camera.bounds.south,
                                camera.bounds.west,
                            ),
                            false,
                            80,
                        )
                    }
                    applied.value = camera
                }
                view.invalidate()
            }
        },
    )
}

private fun LatLng.geoPoint() = GeoPoint(latitude, longitude)

private fun HornetNestProperties.statusColour(): Color = when (status) {
    "destruction_ordered" -> HornetOrdered
    "destroyed" -> HornetDestroyed
    else -> HornetFound
}

/** A coloured dot in a white ring, so it reads against both land and water. */
private fun nestPin(context: Context, colour: Color): BitmapDrawable {
    val size = (20 * context.resources.displayMetrics.density).toInt()
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    paint.color = 0xFFFFFFFF.toInt()
    canvas.drawCircle(size / 2f, size / 2f, size / 2f, paint)
    paint.color = colour.toArgb()
    canvas.drawCircle(size / 2f, size / 2f, size / 2f - size * 0.18f, paint)
    return BitmapDrawable(context.resources, bitmap)
}

@Composable
private fun NoNestsNotice(modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Stone200),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Row(
            Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                Icons.Default.LocationOn,
                null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Column {
                Text(
                    stringResource(R.string.hornet_map_no_nests),
                    style = MaterialTheme.typography.titleSmall,
                )
                Text(
                    stringResource(R.string.hornet_map_hint),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun NestLegend(modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.92f),
        border = BorderStroke(1.dp, Stone200),
    ) {
        Row(
            Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            LegendItem(HornetFound, stringResource(R.string.hornet_map_status_found))
            LegendItem(HornetOrdered, stringResource(R.string.hornet_map_status_ordered))
            LegendItem(HornetDestroyed, stringResource(R.string.hornet_map_status_destroyed))
        }
    }
}

@Composable
private fun LegendItem(colour: Color, label: String) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Surface(Modifier.size(12.dp), shape = MaterialTheme.shapes.small, color = colour) {}
        Text(label, style = MaterialTheme.typography.labelSmall)
    }
}
