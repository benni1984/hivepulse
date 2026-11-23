package com.hivepulse.app.ui.hornet

import com.hivepulse.app.data.api.HornetNestFeature
import com.hivepulse.app.data.api.HornetNestGeometry

/** A point on the earth, in the order people say it in. */
data class LatLng(val latitude: Double, val longitude: Double)

/** The rectangle that holds every reported nest. */
data class NestBounds(
    val south: Double,
    val west: Double,
    val north: Double,
    val east: Double,
)

/**
 * Where the hornet map points when it opens.
 *
 * Its own type, and pure, because this is the half of the screen a test can reach: no emulator,
 * no tiles, no location permission. The iPhone keeps the same arithmetic in `HornetMapRegion`
 * (#555) and both now answer the same question the same way.
 */
sealed interface HornetMapCamera {

    /** Centred on one point, at a given zoom. */
    data class At(val centre: LatLng, val zoom: Double) : HornetMapCamera

    /** Fitted around every reported nest. */
    data class Around(val bounds: NestBounds) : HornetMapCamera

    companion object {
        /** Close enough to tell one village from the next. */
        const val NEARBY_ZOOM = 12.0

        /**
         * Most of western Europe, and the view nobody should ever actually see: what is left
         * when the device will not say where it is and nobody has reported a nest anywhere.
         *
         * Until #556 this screen had no camera at all, because it had no map: the tab called
         * "Map" drew a list of cards, and had done so since the tracker was built.
         */
        val wideEurope = At(LatLng(50.0, 9.0), 4.0)

        /**
         * Where to point.
         *
         * `here` wins whenever it is known, because where the nests are is what the map draws
         * and where you are is the question it answers. Somebody whose region has no reports
         * should see their own empty region -- that is useful -- rather than be thrown to the
         * nearest cluster three countries away.
         */
        fun of(features: List<HornetNestFeature>, here: LatLng?): HornetMapCamera {
            if (here != null) return At(here, NEARBY_ZOOM)

            val points = features.mapNotNull { it.geometry.asLatLng() }
            return when (points.size) {
                0 -> wideEurope
                // A single nest fitted to a box is a zoom at which the map is one green square.
                1 -> At(points.first(), NEARBY_ZOOM)
                else -> Around(
                    NestBounds(
                        south = points.minOf { it.latitude },
                        west = points.minOf { it.longitude },
                        north = points.maxOf { it.latitude },
                        east = points.maxOf { it.longitude },
                    )
                )
            }
        }
    }
}

/** GeoJSON order is `[longitude, latitude]`; anything shorter is not a point. */
internal fun HornetNestGeometry.asLatLng(): LatLng? =
    coordinates.takeIf { it.size >= 2 }?.let { LatLng(it[1], it[0]) }
