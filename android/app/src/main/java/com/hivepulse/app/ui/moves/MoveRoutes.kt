package com.hivepulse.app.ui.moves

import androidx.annotation.StringRes
import com.hivepulse.app.R
import com.hivepulse.app.data.api.HiveMoveOut

/** The forage keys the clients offer. Anything else a beekeeper typed is shown as written. */
object Forage {
    val keys = listOf(
        "acacia", "rapeseed", "orchard", "dandelion", "linden", "chestnut", "fir", "heather", "sunflower", "lavender", "other",
    )

    fun isKnown(value: String?): Boolean = value != null && value in keys

    /** The string resource of a known key; null for text somebody typed by hand. */
    @StringRes
    fun labelRes(value: String): Int? = when (value) {
        "acacia"    -> R.string.forage_acacia
        "rapeseed"  -> R.string.forage_rapeseed
        "orchard"   -> R.string.forage_orchard
        "dandelion" -> R.string.forage_dandelion
        "linden"    -> R.string.forage_linden
        "chestnut"  -> R.string.forage_chestnut
        "fir"       -> R.string.forage_fir
        "heather"   -> R.string.forage_heather
        "sunflower" -> R.string.forage_sunflower
        "lavender"  -> R.string.forage_lavender
        "other"     -> R.string.forage_other
        else        -> null
    }
}

data class MovePoint(
    val latitude: Double,
    val longitude: Double,
    val name: String,
    /** Day of the move that brought the hive here; the starting point has none. */
    val date: String?,
    val forage: String?,
    /** 0 for the place the journey started, then 1, 2, ... in order. */
    val order: Int,
)

data class MoveRoute(
    val hiveId: String,
    val hiveName: String,
    val points: List<MovePoint>,
    /** Index into the palette, so two hives on one map get different lines. */
    val colorIndex: Int,
)

object MoveRoutes {

    /**
     * The journeys on the map: per hive, the place it started from followed by every place it was taken
     * to, oldest first. A place without coordinates is skipped (the server could not find its address), but
     * the numbering still counts it, so "stop 3" means the third move. The same rule as the website's.
     */
    fun build(moves: List<HiveMoveOut>): List<MoveRoute> {
        val byHive = LinkedHashMap<String, MutableList<HiveMoveOut>>()
        moves.forEach { byHive.getOrPut(it.hiveId) { mutableListOf() }.add(it) }

        return byHive.entries.mapIndexed { index, (hiveId, list) ->
            val ordered = list.sortedWith(compareBy({ it.movedOn }, { it.createdAt }))
            val points = mutableListOf<MovePoint>()
            val first = ordered.first().from
            if (first.latitude != null && first.longitude != null) {
                points += MovePoint(first.latitude, first.longitude, first.name, null, null, 0)
            }
            ordered.forEachIndexed { i, move ->
                val to = move.to
                if (to.latitude != null && to.longitude != null) {
                    points += MovePoint(to.latitude, to.longitude, to.name, move.movedOn, move.forage, i + 1)
                }
            }
            MoveRoute(hiveId, ordered.first().hiveName, points, index)
        }
    }

    fun hasPositions(routes: List<MoveRoute>): Boolean = routes.any { it.points.isNotEmpty() }
}
