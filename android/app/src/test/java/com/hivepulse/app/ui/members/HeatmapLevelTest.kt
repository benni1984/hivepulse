package com.hivepulse.app.ui.members

import com.hivepulse.app.data.api.CommunityHeatmapProperties
import com.hivepulse.app.ui.members.HeatLevel.*
import com.hivepulse.app.ui.members.HeatmapOverlay.*
import org.junit.Assert.*
import org.junit.Test

class HeatmapLevelTest {

    private fun props(varroa: Double? = null, mood: Int? = null, brood: Double? = null, swarm: Int = 0) =
        CommunityHeatmapProperties(varroa, mood, brood, swarm, apiaryCount = 1, inspectionCount = 1)

    @Test
    fun `varroa thresholds match web legend`() {
        // avg_varroa is the mean varroa level (0 none … 3 high)
        assertEquals(GOOD, heatLevel(props(varroa = 0.9), VARROA))
        assertEquals(FAIR, heatLevel(props(varroa = 1.0), VARROA))
        assertEquals(FAIR, heatLevel(props(varroa = 1.9), VARROA))
        assertEquals(POOR, heatLevel(props(varroa = 2.0), VARROA))
        assertEquals(NO_DATA, heatLevel(props(), VARROA))
    }

    @Test
    fun `mood thresholds match web legend`() {
        assertEquals(GOOD, heatLevel(props(mood = 70), MOOD))
        assertEquals(FAIR, heatLevel(props(mood = 69), MOOD))
        assertEquals(FAIR, heatLevel(props(mood = 40), MOOD))
        assertEquals(POOR, heatLevel(props(mood = 39), MOOD))
        assertEquals(NO_DATA, heatLevel(props(), MOOD))
    }

    @Test
    fun `swarm thresholds match web legend`() {
        assertEquals(GOOD, heatLevel(props(swarm = 9), SWARM))
        assertEquals(FAIR, heatLevel(props(swarm = 10), SWARM))
        assertEquals(FAIR, heatLevel(props(swarm = 29), SWARM))
        assertEquals(POOR, heatLevel(props(swarm = 30), SWARM))
    }

    @Test
    fun `brood thresholds match web legend`() {
        assertEquals(GOOD, heatLevel(props(brood = 5.0), BROOD))
        assertEquals(FAIR, heatLevel(props(brood = 4.9), BROOD))
        assertEquals(FAIR, heatLevel(props(brood = 3.0), BROOD))
        assertEquals(POOR, heatLevel(props(brood = 2.9), BROOD))
        assertEquals(NO_DATA, heatLevel(props(), BROOD))
    }

    @Test
    fun `swarm legend has no no-data bucket, the others do`() {
        assertFalse(NO_DATA in legendLevels(SWARM))
        listOf(VARROA, MOOD, BROOD).forEach { assertTrue(NO_DATA in legendLevels(it)) }
    }
}
