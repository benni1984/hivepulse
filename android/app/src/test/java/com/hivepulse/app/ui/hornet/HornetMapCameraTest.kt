package com.hivepulse.app.ui.hornet

import com.hivepulse.app.data.api.HornetNestFeature
import com.hivepulse.app.data.api.HornetNestGeometry
import com.hivepulse.app.data.api.HornetNestProperties
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Where the hornet map points when it opens (#556).
 *
 * The iPhone answers the same question in `HornetMapRegionTests`; this is the copy that needs no
 * emulator, no tiles and no location permission.
 */
class HornetMapCameraTest {

    private fun nest(lat: Double, lng: Double) = HornetNestFeature(
        type = "Feature",
        // GeoJSON order, which is the mistake this test exists to keep catching.
        geometry = HornetNestGeometry(type = "Point", coordinates = listOf(lng, lat)),
        properties = HornetNestProperties(
            id = "n-1",
            status = "found",
            reporterName = null,
            notes = null,
            photoUrl = null,
            createdAt = "2026-11-23T10:00:00",
        ),
    )

    @Test
    fun `nothing known at all falls back to western Europe`() {
        assertEquals(HornetMapCamera.wideEurope, HornetMapCamera.of(emptyList(), here = null))
    }

    @Test
    fun `the beekeeper wins over the nests`() {
        // Where the nests are is what the map draws; where you are is the question it answers.
        val camera = HornetMapCamera.of(
            listOf(nest(41.9, -8.6), nest(52.2, 21.0)),
            here = LatLng(47.37, 8.54),
        )

        assertEquals(HornetMapCamera.At(LatLng(47.37, 8.54), HornetMapCamera.NEARBY_ZOOM), camera)
    }

    @Test
    fun `an empty region of their own beats a cluster three countries away`() {
        // The whole point: no reports nearby is an answer, and being thrown to Portugal is not.
        val camera = HornetMapCamera.of(listOf(nest(41.9, -8.6)), here = LatLng(51.05, 13.74))

        assertEquals(HornetMapCamera.At(LatLng(51.05, 13.74), HornetMapCamera.NEARBY_ZOOM), camera)
    }

    @Test
    fun `a single nest is centred, not fitted`() {
        // Fitting a box around one point zooms until the map is one green square.
        val camera = HornetMapCamera.of(listOf(nest(47.0, 8.0)), here = null)

        assertEquals(HornetMapCamera.At(LatLng(47.0, 8.0), HornetMapCamera.NEARBY_ZOOM), camera)
    }

    @Test
    fun `several nests are fitted into the box that holds them all`() {
        val camera = HornetMapCamera.of(
            listOf(nest(47.0, 8.0), nest(51.0, 13.0), nest(49.0, 2.0)),
            here = null,
        )

        assertEquals(
            HornetMapCamera.Around(NestBounds(south = 47.0, west = 2.0, north = 51.0, east = 13.0)),
            camera,
        )
    }

    @Test
    fun `latitude and longitude are not swapped`() {
        // 8 degrees of latitude is the Sahara; 47 degrees of longitude is Kazakhstan.
        val camera = HornetMapCamera.of(listOf(nest(47.0, 8.0)), here = null)

        val at = camera as HornetMapCamera.At
        assertEquals(47.0, at.centre.latitude, 0.0)
        assertEquals(8.0, at.centre.longitude, 0.0)
    }

    @Test
    fun `a point with no coordinates is left out rather than drawn at null island`() {
        val camera = HornetMapCamera.of(
            listOf(
                HornetNestFeature(
                    type = "Feature",
                    geometry = HornetNestGeometry(type = "Point", coordinates = emptyList()),
                    properties = nest(0.0, 0.0).properties,
                ),
            ),
            here = null,
        )

        assertEquals(HornetMapCamera.wideEurope, camera)
    }

    @Test
    fun `the nearby zoom tells one village from the next`() {
        // Not an arbitrary number: below about 10 a village is a dot among dots, and the iPhone
        // uses a span that works out to roughly this.
        assertTrue(HornetMapCamera.NEARBY_ZOOM in 11.0..14.0)
    }
}
