package com.hivepulse.app.ui.calendar

import com.hivepulse.app.data.api.CalendarEntryOut
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The ribbon draws the beekeeper's year as twelve months across. Every function here has an edge
 * that a drawn bar would only ever show as "slightly wrong" -- a leap year, an entry that runs
 * over New Year, a one-day entry too thin for a gloved finger -- which is why the arithmetic is
 * tested and not the pixels.
 *
 * These mirror the website's `__tests__/yearRibbon.test.ts` case for case. The two have to agree:
 * a beekeeper who looks at the year on the phone and on the website must see the same shape.
 */
class YearRibbonTests {

    private fun entry(
        key: String = "swarm-check",
        category: String = "swarm",
        title: String = "Swarm control",
        body: String = "Every nine days.",
        start: String = "2026-05-01",
        end: String = "2026-06-30",
        intervalDays: Int? = 9,
        honey: String? = null,
        active: Boolean? = false,
    ) = CalendarEntryOut(key, category, title, body, start, end, intervalDays, honey, active)

    // ── The length of the year ───────────────────────────────────────────────────────────────

    @Test
    fun `counts a leap year as a day longer`() {
        assertEquals(365, YearRibbon.daysInYear(2026))
        assertEquals(366, YearRibbon.daysInYear(2028))
    }

    @Test
    fun `places the first of January at nought and the last of December at the end`() {
        assertEquals(0, YearRibbon.dayOffset("2026-01-01", 2026))
        assertEquals(1, YearRibbon.dayOffset("2026-01-02", 2026))
        assertEquals(364, YearRibbon.dayOffset("2026-12-31", 2026))
        // An entry of the year before is negative, which is what lets a bar be cut at the edge.
        assertEquals(-17, YearRibbon.dayOffset("2025-12-15", 2026))
    }

    // ── A bar on the ribbon ──────────────────────────────────────────────────────────────────

    @Test
    fun `spans the days the entry covers, counting both ends`() {
        val bar = YearRibbon.barFor(entry(start = "2026-05-01", end = "2026-05-31"), 2026)!!
        val total = YearRibbon.daysInYear(2026).toDouble()
        assertEquals((YearRibbon.dayOffset("2026-05-01", 2026) / total) * 100, bar.left, 1e-9)
        // 31 days, not 30: an entry that ends on the day it starts is one day long.
        assertEquals((31 / total) * 100, bar.width, 1e-9)
        assertTrue(!bar.clippedStart && !bar.clippedEnd)
    }

    @Test
    fun `gives a single day enough width to be tapped`() {
        val bar = YearRibbon.barFor(entry(start = "2026-05-01", end = "2026-05-01"), 2026)!!
        // One day is 0.27% of a year, which no finger can hit.
        assertTrue("a one-day bar must be widened", bar.width >= 1.1)
    }

    @Test
    fun `cuts an entry that started last year at the edge and says it did`() {
        val bar = YearRibbon.barFor(entry(start = "2025-12-15", end = "2026-02-10"), 2026)!!
        assertEquals(0.0, bar.left, 1e-9)
        assertTrue(bar.clippedStart)
        assertTrue(!bar.clippedEnd)
        val total = YearRibbon.daysInYear(2026).toDouble()
        assertEquals(((YearRibbon.dayOffset("2026-02-10", 2026) + 1) / total) * 100, bar.width, 1e-9)
    }

    @Test
    fun `cuts an entry that runs into next year at the other edge`() {
        val bar = YearRibbon.barFor(entry(start = "2026-11-25", end = "2027-01-15"), 2026)!!
        assertTrue(bar.clippedEnd)
        assertTrue(!bar.clippedStart)
        assertEquals(100.0, bar.left + bar.width, 1e-9)
    }

    @Test
    fun `never lets a bar reach past the right edge`() {
        // A one-day entry on 31 December would be widened past the end by the tap floor.
        val bar = YearRibbon.barFor(entry(start = "2026-12-31", end = "2026-12-31"), 2026)!!
        assertTrue("left + width must stay within the ribbon", bar.left + bar.width <= 100.0 + 1e-9)
    }

    @Test
    fun `drops an entry that does not touch the year at all`() {
        assertNull(YearRibbon.barFor(entry(start = "2025-03-01", end = "2025-04-01"), 2026))
        assertNull(YearRibbon.barFor(entry(start = "2027-03-01", end = "2027-04-01"), 2026))
    }

    // ── The rows ─────────────────────────────────────────────────────────────────────────────

    @Test
    fun `keeps the row order and leaves out the rows with nothing in them`() {
        val rows = YearRibbon.rowsFor(
            listOf(
                entry(key = "winter-rest", category = "winter", start = "2026-01-01", end = "2026-02-10"),
                entry(key = "first-inspection", category = "inspection", start = "2026-03-01", end = "2026-03-31"),
            ),
            2026,
        )
        assertEquals(listOf(YearRibbon.Row.INSPECTION, YearRibbon.Row.WINTER), rows.map { it.row })
    }

    @Test
    fun `draws bloom, migration and harvest on one row`() {
        val rows = YearRibbon.rowsFor(
            listOf(
                entry(key = "spring-bloom", category = "bloom", start = "2026-03-15", end = "2026-04-30"),
                entry(key = "migrate-acacia", category = "migration", honey = "acacia", start = "2026-05-10", end = "2026-05-30"),
                entry(key = "mystery-harvest", category = "harvest", start = "2026-07-01", end = "2026-07-20"),
            ),
            2026,
        )
        assertEquals(1, rows.size)
        assertEquals(YearRibbon.Row.FORAGE, rows[0].row)
        assertEquals(3, rows[0].bars.size)
    }

    @Test
    fun `leaves every bar its own category, which is the only thing left telling them apart`() {
        val rows = YearRibbon.rowsFor(
            listOf(
                entry(key = "spring-bloom", category = "bloom", start = "2026-03-15", end = "2026-04-30"),
                entry(key = "mystery-harvest", category = "harvest", start = "2026-07-01", end = "2026-07-20"),
            ),
            2026,
        )
        assertEquals(listOf("bloom", "harvest"), rows[0].bars.map { it.entry.category })
    }

    @Test
    fun `draws a forage as one bar from the move to the end of its harvest`() {
        // You drive to the rape on 15 April and spin it on 5 June. That is one stretch of time
        // with two halves, and as two bars it landed on two lanes.
        val rows = YearRibbon.rowsFor(
            listOf(
                entry(key = "migrate-rapeseed", category = "migration", honey = "rapeseed", start = "2026-04-15", end = "2026-05-05"),
                entry(key = "harvest-rapeseed", category = "harvest", honey = "rapeseed", start = "2026-05-15", end = "2026-06-05"),
            ),
            2026,
        )
        assertEquals(1, rows[0].bars.size)
        val bar = rows[0].bars[0]
        assertEquals("migrate-rapeseed", bar.entry.key)
        assertEquals("harvest-rapeseed", bar.harvest?.key)
        // 15 April to 5 June inclusive, not 15 April to 5 May.
        val expected = ((YearRibbon.dayOffset("2026-06-05", 2026) + 1 - YearRibbon.dayOffset("2026-04-15", 2026))
            / YearRibbon.daysInYear(2026).toDouble()) * 100
        assertEquals(expected, bar.width, 1e-9)
    }

    @Test
    fun `splits that bar where the harvest begins`() {
        val rows = YearRibbon.rowsFor(
            listOf(
                entry(key = "migrate-rapeseed", category = "migration", honey = "rapeseed", start = "2026-04-15", end = "2026-05-05"),
                entry(key = "harvest-rapeseed", category = "harvest", honey = "rapeseed", start = "2026-05-15", end = "2026-06-05"),
            ),
            2026,
        )
        // 30 days of the 52 the bar covers are behind it when the harvest starts.
        assertEquals((30.0 / 52.0) * 100, rows[0].bars[0].split!!, 0.1)
    }

    @Test
    fun `leaves a forage with no harvest entry as a bar of its own`() {
        // Chestnut, lavender and sunflower had no harvest entry until they were written.
        val rows = YearRibbon.rowsFor(
            listOf(entry(key = "migrate-lavender", category = "migration", honey = "lavender", start = "2026-06-15", end = "2026-07-31")),
            2026,
        )
        assertEquals(1, rows[0].bars.size)
        assertNull(rows[0].bars[0].harvest)
        assertNull(rows[0].bars[0].split)
    }

    @Test
    fun `leaves a harvest that belongs to no plant alone`() {
        // A harvest with no plant must never be folded into somebody else's move, which is what
        // would happen if the lookup ignored the forage.
        val rows = YearRibbon.rowsFor(
            listOf(entry(key = "mystery-harvest", category = "harvest", honey = null, start = "2026-07-20", end = "2026-08-10")),
            2026,
        )
        assertEquals(1, rows[0].bars.size)
        assertEquals("mystery-harvest", rows[0].bars[0].entry.key)
    }

    @Test
    fun `does not pair a harvest with a move of a different plant`() {
        val units = YearRibbon.pairForages(
            listOf(
                entry(key = "migrate-linden", category = "migration", honey = "linden"),
                entry(key = "harvest-heather", category = "harvest", honey = "heather"),
            ),
        )
        assertEquals(2, units.size)
        assertNull(units[0].harvest)
    }

    @Test
    fun `drops a forage pair to five bars where three rows needed ten`() {
        // The whole point of the merge: fewer bars, and every plant on one line.
        val forages = listOf(
            listOf("rapeseed", "2026-04-15", "2026-05-05", "2026-05-15", "2026-06-05"),
            listOf("acacia", "2026-05-10", "2026-05-30", "2026-05-28", "2026-06-15"),
            listOf("linden", "2026-06-15", "2026-07-10", "2026-07-08", "2026-07-31"),
            listOf("fir", "2026-06-01", "2026-07-31", "2026-07-15", "2026-08-31"),
            listOf("heather", "2026-08-01", "2026-09-10", "2026-09-05", "2026-09-30"),
        )
        val entries = forages.flatMap { (honey, ms, me, hs, he) ->
            listOf(
                entry(key = "migrate-$honey", category = "migration", honey = honey, start = ms, end = me),
                entry(key = "harvest-$honey", category = "harvest", honey = honey, start = hs, end = he),
            )
        }
        val rows = YearRibbon.rowsFor(entries, 2026)
        assertEquals(5, rows[0].bars.size)
        assertTrue("five plants must fit in three lanes", rows[0].lanes.size <= 3)
    }

    @Test
    fun `does not merge anything else`() {
        // Two care entries are two bars, however close together they sit.
        val rows = YearRibbon.rowsFor(
            listOf(
                entry(key = "comb-renewal", category = "care", start = "2026-04-01", end = "2026-04-30"),
                entry(key = "foulbrood-check", category = "care", start = "2026-05-01", end = "2026-05-30"),
            ),
            2026,
        )
        assertEquals(2, rows[0].bars.size)
        assertTrue(rows[0].bars.all { it.harvest == null })
    }

    @Test
    fun `shows the same run once even though the API repeats it per year`() {
        val same = entry(key = "swarm-check", start = "2026-05-01", end = "2026-06-30")
        val rows = YearRibbon.rowsFor(listOf(same, same.copy()), 2026)
        assertEquals(1, rows[0].bars.size)
    }

    @Test
    fun `keeps two genuine runs of one entry in the same year`() {
        val rows = YearRibbon.rowsFor(
            listOf(
                entry(key = "swarm-check", start = "2026-05-01", end = "2026-05-31"),
                entry(key = "swarm-check", start = "2026-07-01", end = "2026-07-31"),
            ),
            2026,
        )
        assertEquals(2, rows[0].bars.size)
    }

    @Test
    fun `sorts the bars of a row by when they start, so the row reads left to right`() {
        val rows = YearRibbon.rowsFor(
            listOf(
                entry(key = "late", category = "care", start = "2026-09-01", end = "2026-09-20"),
                entry(key = "early", category = "care", start = "2026-03-01", end = "2026-03-20"),
            ),
            2026,
        )
        assertEquals(listOf("early", "late"), rows[0].bars.map { it.entry.key })
    }

    // ── The lanes within a row ───────────────────────────────────────────────────────────────

    private fun bar(left: Double, width: Double) = YearRibbon.Bar(
        entry = entry(), left = left, width = width, clippedStart = false, clippedEnd = false,
    )

    @Test
    fun `keeps bars that do not overlap on one lane`() {
        assertEquals(1, YearRibbon.lanesFor(listOf(bar(0.0, 10.0), bar(20.0, 10.0))).size)
    }

    @Test
    fun `puts two overlapping bars on two lanes`() {
        val lanes = YearRibbon.lanesFor(listOf(bar(0.0, 20.0), bar(10.0, 20.0)))
        assertEquals(2, lanes.size)
        assertEquals(1, lanes[0].size)
        assertEquals(1, lanes[1].size)
    }

    @Test
    fun `uses no more lanes than the busiest moment needs`() {
        // Three open at once, then room again: three lanes, and the fourth bar rejoins the first.
        val lanes = YearRibbon.lanesFor(listOf(bar(0.0, 30.0), bar(5.0, 30.0), bar(10.0, 30.0), bar(50.0, 10.0)))
        assertEquals(3, lanes.size)
        assertEquals(2, lanes[0].size)
    }

    @Test
    fun `separates bars that merely touch, which would otherwise read as one`() {
        // Ends exactly where the next begins: one long bar to the eye, so they go on two lanes.
        assertEquals(2, YearRibbon.lanesFor(listOf(bar(0.0, 10.0), bar(10.0, 10.0))).size)
    }

    @Test
    fun `keeps bars on one lane once the gap is clear`() {
        assertEquals(1, YearRibbon.lanesFor(listOf(bar(0.0, 10.0), bar(10.0 + YearRibbon.LANE_GAP, 10.0))).size)
    }

    @Test
    fun `loses no bar and leaves every lane in date order`() {
        val bars = listOf(bar(0.0, 30.0), bar(5.0, 10.0), bar(18.0, 30.0), bar(60.0, 5.0), bar(62.0, 5.0))
        val lanes = YearRibbon.lanesFor(bars)
        assertEquals(bars.size, lanes.sumOf { it.size })
        for (lane in lanes) {
            assertEquals(lane.map { it.left }.sorted(), lane.map { it.left })
        }
    }

    @Test
    fun `gives every row its lanes alongside its bars`() {
        val rows = YearRibbon.rowsFor(
            listOf(
                entry(key = "a", category = "care", start = "2026-04-01", end = "2026-06-30"),
                entry(key = "b", category = "care", start = "2026-05-01", end = "2026-07-31"),
            ),
            2026,
        )
        assertEquals(2, rows[0].bars.size)
        assertEquals(2, rows[0].lanes.size)
    }

    // ── Today's line ─────────────────────────────────────────────────────────────────────────

    @Test
    fun `sits inside today rather than on the boundary with yesterday`() {
        val at = YearRibbon.todayPosition("2026-07-01", 2026)!!
        val total = YearRibbon.daysInYear(2026).toDouble()
        assertEquals(((YearRibbon.dayOffset("2026-07-01", 2026) + 0.5) / total) * 100, at, 1e-9)
    }

    @Test
    fun `is left off when today is in another year`() {
        assertNull(YearRibbon.todayPosition("2025-07-01", 2026))
        assertNull(YearRibbon.todayPosition("2027-07-01", 2026))
    }

    // ── The month grid ───────────────────────────────────────────────────────────────────────

    @Test
    fun `has twelve columns that exactly fill the ribbon`() {
        val columns = YearRibbon.monthColumns(2026)
        assertEquals(12, columns.size)
        assertEquals(0.0, columns.first().left, 1e-9)
        assertEquals(100.0, columns.last().left + columns.last().width, 1e-9)
        assertEquals(100.0, columns.sumOf { it.width }, 1e-9)
    }

    @Test
    fun `gives February its extra day in a leap year`() {
        val plain = YearRibbon.monthColumns(2026)[1]
        val leap = YearRibbon.monthColumns(2028)[1]
        assertTrue("February 2028 covers more days", leap.width * 366 > plain.width * 365)
    }

    // ── The seasons behind the bars ──────────────────────────────────────────────────────────

    @Test
    fun `splits the year into runs of months that share a season`() {
        val segments = YearRibbon.seasonSegments(2026)
        assertEquals(
            listOf(
                YearRibbon.Season.WINTER, YearRibbon.Season.SPRING,
                YearRibbon.Season.SUMMER, YearRibbon.Season.AUTUMN, YearRibbon.Season.WINTER,
            ),
            segments.map { it.season },
        )
        assertEquals(1, segments.first().fromMonth)
        assertEquals(2, segments.first().toMonth)
    }

    @Test
    fun `does not join January and December into one winter`() {
        val segments = YearRibbon.seasonSegments(2026)
        val winters = segments.filter { it.season == YearRibbon.Season.WINTER }
        assertEquals(2, winters.size)
        assertEquals(12, winters.last().fromMonth)
        assertEquals(12, winters.last().toMonth)
    }

    @Test
    fun `covers the ribbon with no gap between the segments`() {
        val segments = YearRibbon.seasonSegments(2026)
        assertEquals(0.0, segments.first().left, 1e-9)
        assertEquals(100.0, segments.sumOf { it.width }, 1e-9)
        for ((before, after) in segments.zipWithNext()) {
            assertEquals(after.left, before.left + before.width, 1e-9)
        }
    }

    // ── The two sides agree ──────────────────────────────────────────────────────────────────

    @Test
    fun `rows cover every category the backend can send`() {
        // A category with no row would silently vanish from the ribbon. The list is the enum of
        // docs/api-contract.md; a new one has to be given a row here and on the website.
        val categories = listOf(
            "inspection", "swarm", "bloom", "migration", "harvest",
            "varroa", "feeding", "care", "winter",
        )
        for (category in categories) {
            assertTrue("$category has no row", YearRibbon.rowOf(category) != null)
        }
        assertNull(YearRibbon.rowOf("something-new"))
    }
}
