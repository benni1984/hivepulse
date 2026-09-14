package com.hivepulse.app.data.api

import com.google.gson.Gson
import org.junit.Assert.*
import org.junit.Test

class HeatmapDtoTest {

    @Test
    fun `CommunityHeatmap parses backend GeoJSON including null metrics`() {
        val json = """{"type":"FeatureCollection","features":[{"type":"Feature",
            "geometry":{"type":"Polygon","coordinates":[[[9.75,47.75],[10.25,47.75],[10.25,48.25],[9.75,48.25],[9.75,47.75]]]},
            "properties":{"avg_varroa":null,"mood_score":78,"avg_brood":5.1,"swarm_pct":12,"apiary_count":6,"inspection_count":34}}]}"""

        val heatmap = Gson().fromJson(json, CommunityHeatmap::class.java)
        val feature = heatmap.features.single()

        assertEquals(5, feature.geometry.coordinates.single().size)
        assertEquals(listOf(9.75, 47.75), feature.geometry.coordinates.single().first())
        assertEquals(
            CommunityHeatmapProperties(null, 78, 5.1, 12, 6, 34),
            feature.properties
        )
    }
}
