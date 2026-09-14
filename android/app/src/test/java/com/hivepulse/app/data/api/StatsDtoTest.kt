package com.hivepulse.app.data.api

import com.google.gson.Gson
import org.junit.Assert.*
import org.junit.Test

class StatsDtoTest {

    @Test
    fun `OverviewStats parses backend response`() {
        val json = """{"period":{"from":"2025-01-01","to":"2025-12-31","preset":"365d"},
            "apiary_count":2,"hive_count":7,"inspections_total":31,
            "per_apiary":[{"apiary_id":"a1","apiary_name":"Home Yard","hive_count":4,"inspections_total":20}]}"""

        val stats = Gson().fromJson(json, OverviewStats::class.java)

        assertEquals(2, stats.apiaryCount)
        assertEquals(7, stats.hiveCount)
        assertEquals(31, stats.inspectionsTotal)
        assertEquals("365d", stats.period.preset)
        assertEquals(ApiaryStatsSummary("a1", "Home Yard", 4, 20), stats.perApiary.single())
    }
}
