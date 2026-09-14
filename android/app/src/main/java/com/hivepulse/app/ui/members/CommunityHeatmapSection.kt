package com.hivepulse.app.ui.members

import android.annotation.SuppressLint
import android.view.MotionEvent
import androidx.annotation.StringRes
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.hivepulse.app.R
import com.hivepulse.app.data.api.CommunityHeatmap
import com.hivepulse.app.data.api.CommunityHeatmapProperties
import com.hivepulse.app.ui.common.InfoRow
import com.hivepulse.app.ui.theme.Stone200
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Polygon
import java.io.File

/** Members-only regional health map — Android counterpart of the web `CommunityMap`. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CommunityHeatmapSection(
    heatmap: CommunityHeatmap?,
    overlay: HeatmapOverlay,
    onOverlayChange: (HeatmapOverlay) -> Unit,
) {
    var selected by remember(heatmap) { mutableStateOf<CommunityHeatmapProperties?>(null) }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(stringResource(R.string.heatmap_section_title), style = MaterialTheme.typography.titleMedium)

        if (heatmap == null || heatmap.features.isEmpty()) {
            Text(
                stringResource(R.string.heatmap_empty),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            return@Column
        }

        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HeatmapOverlay.entries.forEach { ov ->
                FilterChip(
                    selected = ov == overlay,
                    onClick  = { onOverlayChange(ov) },
                    label    = { Text(stringResource(ov.labelRes)) }
                )
            }
        }

        HeatmapMap(
            heatmap     = heatmap,
            overlay     = overlay,
            onCellClick = { selected = it },
            modifier    = Modifier.fillMaxWidth().height(320.dp).clip(MaterialTheme.shapes.large)
        )
        Text(
            stringResource(R.string.heatmap_osm_attribution),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        FlowRow(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            legendLevels(overlay).forEach { level ->
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Box(Modifier.size(12.dp).background(Color(level.argb(overlay)), RoundedCornerShape(2.dp)))
                    Text(
                        stringResource(legendLabel(level, overlay)),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        selected?.let { CellDetails(it) } ?: Text(
            stringResource(R.string.heatmap_hint),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@SuppressLint("ClickableViewAccessibility")
@Composable
private fun HeatmapMap(
    heatmap: CommunityHeatmap,
    overlay: HeatmapOverlay,
    onCellClick: (CommunityHeatmapProperties) -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
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
            maxZoomLevel = 10.0
            controller.setZoom(4.0)
            controller.setCenter(GeoPoint(51.0, 10.0))
            // Stop the surrounding scroll column from stealing pan/zoom gestures
            setOnTouchListener { view, event ->
                if (event.action == MotionEvent.ACTION_DOWN) view.parent?.requestDisallowInterceptTouchEvent(true)
                false
            }
        }
    }
    DisposableEffect(mapView) {
        mapView.onResume()
        onDispose { mapView.onPause(); mapView.onDetach() }
    }

    AndroidView(factory = { mapView }, modifier = modifier, update = { map ->
        map.overlays.removeAll { it is Polygon }
        heatmap.features.forEach { feature ->
            val ring = feature.geometry.coordinates.firstOrNull() ?: return@forEach
            map.overlays.add(Polygon(map).apply {
                points = ring.map { GeoPoint(it[1], it[0]) }
                fillPaint.color = heatLevel(feature.properties, overlay).argb(overlay)
                fillPaint.alpha = 166   // ≈ 0.65 opacity, same as web
                outlinePaint.color = android.graphics.Color.WHITE
                outlinePaint.strokeWidth = 1f
                setOnClickListener { _, _, _ -> onCellClick(feature.properties); true }
            })
        }
        map.invalidate()
    })
}

@Composable
private fun CellDetails(p: CommunityHeatmapProperties) {
    Card(
        shape     = MaterialTheme.shapes.large,
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border    = BorderStroke(1.dp, Stone200),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp)) {
            Text(
                stringResource(R.string.heatmap_cell_summary, p.apiaryCount, p.inspectionCount),
                style = MaterialTheme.typography.titleSmall
            )
            InfoRow(stringResource(R.string.heatmap_cell_varroa), p.avgVarroa?.let { "%.1f".format(it) } ?: "—")
            InfoRow(stringResource(R.string.heatmap_cell_mood), p.moodScore?.let { "$it%" } ?: "—")
            InfoRow(stringResource(R.string.heatmap_cell_brood), p.avgBrood?.let { "%.1f".format(it) } ?: "—")
            InfoRow(stringResource(R.string.heatmap_cell_swarm), "${p.swarmPct}%")
        }
    }
}

private val HeatmapOverlay.labelRes: Int
    @StringRes get() = when (this) {
        HeatmapOverlay.VARROA -> R.string.heatmap_overlay_varroa
        HeatmapOverlay.MOOD   -> R.string.heatmap_overlay_mood
        HeatmapOverlay.SWARM  -> R.string.heatmap_overlay_swarm
        HeatmapOverlay.BROOD  -> R.string.heatmap_overlay_brood
    }

@StringRes
private fun legendLabel(level: HeatLevel, overlay: HeatmapOverlay): Int = when (level) {
    HeatLevel.NO_DATA -> R.string.heatmap_level_no_data
    HeatLevel.GOOD -> when (overlay) {
        HeatmapOverlay.VARROA -> R.string.heatmap_varroa_low
        HeatmapOverlay.MOOD   -> R.string.heatmap_mood_good
        HeatmapOverlay.SWARM  -> R.string.heatmap_swarm_low
        HeatmapOverlay.BROOD  -> R.string.heatmap_brood_strong
    }
    HeatLevel.FAIR -> when (overlay) {
        HeatmapOverlay.VARROA -> R.string.heatmap_varroa_medium
        HeatmapOverlay.MOOD   -> R.string.heatmap_mood_fair
        HeatmapOverlay.SWARM  -> R.string.heatmap_swarm_medium
        HeatmapOverlay.BROOD  -> R.string.heatmap_brood_fair
    }
    HeatLevel.POOR -> when (overlay) {
        HeatmapOverlay.VARROA -> R.string.heatmap_varroa_high
        HeatmapOverlay.MOOD   -> R.string.heatmap_mood_low
        HeatmapOverlay.SWARM  -> R.string.heatmap_swarm_high
        HeatmapOverlay.BROOD  -> R.string.heatmap_brood_low
    }
}

/** Web palette: green / amber / red / grey (brood "strong" uses the darker green, as on web). */
private fun HeatLevel.argb(overlay: HeatmapOverlay): Int = when (this) {
    HeatLevel.GOOD    -> if (overlay == HeatmapOverlay.BROOD) 0xFF16A34A.toInt() else 0xFF22C55E.toInt()
    HeatLevel.FAIR    -> 0xFFF59E0B.toInt()
    HeatLevel.POOR    -> 0xFFEF4444.toInt()
    HeatLevel.NO_DATA -> 0xFF9CA3AF.toInt()
}
