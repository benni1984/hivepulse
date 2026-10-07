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

/** A way back: the place some of the hives stood before they came to this apiary, and which hives those are. */
data class ReturnSuggestion(val apiaryId: String, val name: String, val hiveIds: List<String>)

object MoveRoutes {

    /**
     * "Back to where they came from": for the hives standing in [apiaryId], the place each one was taken from
     * when it came here, grouped by that place. A hive that never moved here, or whose previous place is gone
     * or not among [places] (not the caller's own), is left out: there is nowhere to send it back to.
     * The same rule as the website's.
     */
    fun returnSuggestions(
        moves: List<HiveMoveOut>,
        hiveIds: List<String>,
        apiaryId: String,
        places: List<Pair<String, String>>,
    ): List<ReturnSuggestion> {
        val here = hiveIds.toSet()
        val latest = HashMap<String, HiveMoveOut>()
        for (move in moves) {
            if (move.hiveId !in here || move.to.apiaryId != apiaryId) continue
            val seen = latest[move.hiveId]
            val newer = seen == null || move.movedOn > seen.movedOn ||
                (move.movedOn == seen.movedOn && move.createdAt > seen.createdAt)
            if (newer) latest[move.hiveId] = move
        }

        val names = places.toMap()
        val byPlace = LinkedHashMap<String, MutableList<String>>()
        for (hiveId in hiveIds) {
            val from = latest[hiveId]?.from?.apiaryId ?: continue
            if (from == apiaryId || from !in names) continue
            byPlace.getOrPut(from) { mutableListOf() }.add(hiveId)
        }
        return byPlace
            .map { (id, ids) -> ReturnSuggestion(id, names.getValue(id), ids) }
            .sortedWith(compareByDescending<ReturnSuggestion> { it.hiveIds.size }.thenBy { it.name })
    }

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
