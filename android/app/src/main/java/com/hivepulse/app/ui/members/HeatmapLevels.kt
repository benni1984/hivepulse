package com.hivepulse.app.ui.members

import com.hivepulse.app.data.api.CommunityHeatmapProperties

enum class HeatmapOverlay { VARROA, MOOD, SWARM, BROOD }

/** Traffic-light bucket for one heatmap cell. Thresholds mirror the web `CommunityMap`. */
enum class HeatLevel { GOOD, FAIR, POOR, NO_DATA }

fun heatLevel(props: CommunityHeatmapProperties, overlay: HeatmapOverlay): HeatLevel = when (overlay) {
    // avgVarroa is the mean varroa level: 0 none, 1 low, 2 medium, 3 high
    HeatmapOverlay.VARROA -> props.avgVarroa?.let {
        if (it < 1) HeatLevel.GOOD else if (it < 2) HeatLevel.FAIR else HeatLevel.POOR
    } ?: HeatLevel.NO_DATA
    HeatmapOverlay.MOOD -> props.moodScore?.let {
        if (it >= 70) HeatLevel.GOOD else if (it >= 40) HeatLevel.FAIR else HeatLevel.POOR
    } ?: HeatLevel.NO_DATA
    HeatmapOverlay.SWARM -> props.swarmPct.let {
        if (it < 10) HeatLevel.GOOD else if (it < 30) HeatLevel.FAIR else HeatLevel.POOR
    }
    HeatmapOverlay.BROOD -> props.avgBrood?.let {
        if (it >= 5) HeatLevel.GOOD else if (it >= 3) HeatLevel.FAIR else HeatLevel.POOR
    } ?: HeatLevel.NO_DATA
}

/** Legend buckets for an overlay — swarm has no "no data" entry because `swarm_pct` is never null. */
fun legendLevels(overlay: HeatmapOverlay): List<HeatLevel> =
    if (overlay == HeatmapOverlay.SWARM) listOf(HeatLevel.GOOD, HeatLevel.FAIR, HeatLevel.POOR)
    else HeatLevel.entries
