package com.hivepulse.app.ui.members

import kotlin.math.cos
import kotlin.math.max
import kotlin.math.sin

/**
 * The regional health map draws each grid cell as a soft round patch instead of a hard rectangle: a few circles of
 * the same colour, growing in size and each only faintly opaque, so the colour is strongest in the middle and
 * fades out towards the edge. Where neighbouring patches meet, their colours blend like a real heat map.
 *
 * Web (`lib/heatBlobs.ts`) and iOS (`HeatBlobs.swift`) use the same numbers.
 */

/** Centre and outer radius of the patch for one cell. */
data class HeatBlob(val lat: Double, val lon: Double, val radiusMeters: Double)

/** One circle of the stack: its size as a share of the outer radius, and the opacity it adds. */
data class BlobRing(val scale: Double, val alpha: Int)

/** 0.09 opacity per layer, as on web, in the 0–255 alpha osmdroid paints with. */
const val BLOB_RING_ALPHA: Int = 23

/** Eight faint layers, largest first, adding up to about 0.57 opacity in the middle. */
val BLOB_RINGS: List<BlobRing> =
    listOf(1.0, 0.88, 0.76, 0.64, 0.52, 0.4, 0.28, 0.16).map { BlobRing(it, BLOB_RING_ALPHA) }

/** Share of the outer radius that reacts to a tap: the part of the patch that still carries visible colour. */
const val BLOB_HIT_SCALE: Double = 0.7

private const val METRES_PER_DEGREE = 111_320.0

/** Centre and outer radius for a cell given as a GeoJSON ring of `[lon, lat]` points, or null if it has none. */
fun blobFor(ring: List<List<Double>>): HeatBlob? {
    val points = ring.filter { it.size >= 2 && it[0].isFinite() && it[1].isFinite() }
    if (points.isEmpty()) return null

    val lons = points.map { it[0] }
    val lats = points.map { it[1] }
    val minLon = lons.min()
    val maxLon = lons.max()
    val minLat = lats.min()
    val maxLat = lats.max()
    val lat = (minLat + maxLat) / 2
    val lon = (minLon + maxLon) / 2

    val height = (maxLat - minLat) * METRES_PER_DEGREE
    val width = (maxLon - minLon) * METRES_PER_DEGREE * cos(Math.toRadians(lat))
    // A little more than half the cell, so that neighbouring patches overlap and blend.
    return HeatBlob(lat, lon, max(height, width) * 0.75)
}

/**
 * The patch as a closed polygon, because osmdroid draws circles as polygons anyway. [scale] is the ring's share
 * of the outer radius; the result is a list of `[lat, lon]` points, first point repeated at the end.
 */
fun circlePoints(blob: HeatBlob, scale: Double, steps: Int = 36): List<DoubleArray> {
    val radius = blob.radiusMeters * scale
    val latPerMetre = 1 / METRES_PER_DEGREE
    // A degree of longitude is shorter the further north the patch sits, so a circle in metres is wider in degrees.
    val lonPerMetre = latPerMetre / max(cos(Math.toRadians(blob.lat)), 0.01)
    return (0..steps).map { step ->
        val angle = 2 * Math.PI * step / steps
        doubleArrayOf(
            blob.lat + radius * latPerMetre * sin(angle),
            blob.lon + radius * lonPerMetre * cos(angle),
        )
    }
}
