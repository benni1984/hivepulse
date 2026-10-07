package com.hivepulse.app.ui.members

import org.junit.Assert.*
import org.junit.Test
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.hypot

class HeatBlobsTest {

    /** A cell as the backend sends it: a GeoJSON ring of `[lon, lat]` points. */
    private fun cell(minLon: Double, minLat: Double, maxLon: Double, maxLat: Double) = listOf(
        listOf(minLon, minLat), listOf(maxLon, minLat), listOf(maxLon, maxLat),
        listOf(minLon, maxLat), listOf(minLon, minLat),
    )

    @Test
    fun `puts the patch in the middle of the cell`() {
        val blob = blobFor(cell(8.0, 50.0, 8.5, 50.5))!!
        assertEquals(50.25, blob.lat, 1e-9)
        assertEquals(8.25, blob.lon, 1e-9)
    }

    @Test
    fun `reaches a little beyond the cell, so that neighbours blend`() {
        // 0.5 degrees of latitude is about 55.7 km; the patch is three quarters of the larger side.
        val blob = blobFor(cell(0.0, 0.0, 0.5, 0.5))!!
        assertTrue(blob.radiusMeters > 55_000 * 0.7)
        assertTrue(blob.radiusMeters < 55_700 * 0.8)
    }

    @Test
    fun `measures the width in kilometres, which shrink towards the pole`() {
        val equator = blobFor(cell(0.0, 0.0, 2.0, 1.0))!!
        val north = blobFor(cell(0.0, 70.0, 2.0, 71.0))!!
        assertTrue(north.radiusMeters < equator.radiusMeters)
    }

    @Test
    fun `has nothing to draw for an empty or broken ring`() {
        assertNull(blobFor(emptyList()))
        assertNull(blobFor(listOf(listOf(Double.NaN, 1.0))))
        assertNull(blobFor(listOf(listOf(1.0))))
    }

    @Test
    fun `fades like web - each circle is smaller than the one below and the layers stay faint`() {
        val scales = BLOB_RINGS.map { it.scale }
        assertEquals(scales.sortedDescending(), scales)
        assertEquals(8, scales.size)
        assertEquals(1.0, scales.first(), 1e-9)
        assertTrue(BLOB_RINGS.all { it.alpha in 1..50 })
        // 0.09 per layer, as the web component uses.
        assertEquals(0.09, BLOB_RING_ALPHA / 255.0, 0.005)
    }

    @Test
    fun `the tap target is smaller than the patch but covers its coloured middle`() {
        assertTrue(BLOB_HIT_SCALE < 1.0)
        assertTrue(BLOB_HIT_SCALE > BLOB_RINGS.last().scale)
    }

    @Test
    fun `draws a closed circle around the centre`() {
        val blob = blobFor(cell(8.0, 50.0, 8.5, 50.5))!!
        val points = circlePoints(blob, scale = 1.0, steps = 24)

        assertEquals(25, points.size)
        assertArrayEquals(points.first(), points.last(), 1e-12)

        // Every point sits at the radius from the centre — measured in metres, not degrees.
        val metresPerDegreeLat = 111_320.0
        val metresPerDegreeLon = metresPerDegreeLat * cos(Math.toRadians(blob.lat))
        points.forEach { point ->
            val distance = hypot(
                (point[0] - blob.lat) * metresPerDegreeLat,
                (point[1] - blob.lon) * metresPerDegreeLon,
            )
            assertEquals(blob.radiusMeters, distance, blob.radiusMeters * 0.01)
        }
    }

    @Test
    fun `a smaller ring draws a smaller circle`() {
        val blob = blobFor(cell(0.0, 0.0, 1.0, 1.0))!!
        val outer = circlePoints(blob, scale = 1.0)
        val inner = circlePoints(blob, scale = 0.5)
        assertEquals(outer.size, inner.size)
        assertTrue(abs(inner[0][0] - blob.lat) < abs(outer[0][0] - blob.lat))
    }
}
