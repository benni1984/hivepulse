package com.hivepulse.app.ui.calendar

import com.hivepulse.app.data.api.CalendarEntryOut
import java.time.LocalDate
import java.util.Locale

/**
 * Laying the beekeeper's year out as a ribbon: twelve months across, one row per subject.
 *
 * A port of the website's `lib/yearRibbon.ts`, function for function and edge for edge. The
 * arithmetic lives apart from the Composable so it can be tested without an emulator, and
 * because every one of these functions has an edge a drawn bar would only show as "slightly
 * wrong": a leap year, an entry that runs over New Year, an entry that starts in December and
 * ends in the window of the year after.
 *
 * Everything is returned as a percentage of the ribbon's width, so the same numbers work at
 * phone width and on a tablet without re-measuring anything.
 */
object YearRibbon {

    enum class Season { WINTER, SPRING, SUMMER, AUTUMN }

    /** Which season a month belongs to, as a beekeeper would divide the year. */
    fun seasonOfMonth(month: Int): Season = when {
        month <= 2 || month == 12 -> Season.WINTER
        month <= 5 -> Season.SPRING
        month <= 8 -> Season.SUMMER
        else -> Season.AUTUMN
    }

    /**
     * A row of the ribbon. Six are a category of their own; [FORAGE] is three of them at once.
     *
     * Bloom, migration and harvest are one story told in three steps -- something comes into
     * flower, you drive the colonies to it, you take the honey off -- and on three separate rows
     * that story is read across a gap rather than along a line. Rape blooms on 15 April and is
     * spun on 15 May; on one row those two bars nearly touch and the sequence is obvious.
     */
    enum class Row { INSPECTION, SWARM, FORAGE, VARROA, FEEDING, CARE, WINTER }

    /** Which row a category is drawn in. An unknown category gets no row and is left out. */
    fun rowOf(category: String): Row? = when (category) {
        "inspection" -> Row.INSPECTION
        "swarm" -> Row.SWARM
        "bloom", "migration", "harvest" -> Row.FORAGE
        "varroa" -> Row.VARROA
        "feeding" -> Row.FEEDING
        "care" -> Row.CARE
        "winter" -> Row.WINTER
        else -> null
    }

    /** The order the rows appear in: roughly the order a beekeeper meets them through the year. */
    val ROWS: List<Row> = listOf(
        Row.INSPECTION, Row.SWARM, Row.FORAGE, Row.VARROA, Row.FEEDING, Row.CARE, Row.WINTER,
    )

    /**
     * One bar of the ribbon.
     *
     * @param entry the entry this bar draws, so a tap can show it. For a forage, the move.
     * @param harvest the harvest of this forage, drawn as the tail of the same bar. A move and
     *   its harvest are one plant: you drive to the rape, and three weeks later you spin it. As
     *   two bars they landed on different lanes and the sequence was something you had to
     *   reconstruct; as one bar it is the shape of the thing.
     * @param split where the harvest begins, in percent of this bar's own width.
     * @param left distance from the left edge of the ribbon, in percent.
     * @param width width in percent. Never zero: a one-day entry still has to be tappable.
     * @param clippedStart true when the entry reaches past the start of the year, so the bar can
     *   be drawn open-ended rather than dropped or stretched.
     */
    data class Bar(
        val entry: CalendarEntryOut,
        val left: Double,
        val width: Double,
        val clippedStart: Boolean,
        val clippedEnd: Boolean,
        val harvest: CalendarEntryOut? = null,
        val split: Double? = null,
    )

    /** A row with its bars in date order, and those bars stacked into lanes so none overlaps. */
    data class RibbonRow(val row: Row, val bars: List<Bar>, val lanes: List<List<Bar>>)

    /**
     * The gap a bar keeps from the next one in its lane, in percent of the year.
     *
     * Two bars that merely touch read as one long bar. A fifth of a percent is about three
     * quarters of a day -- invisible as a date, plain as a seam.
     */
    const val LANE_GAP = 0.2

    data class SeasonSegment(
        val season: Season,
        /** First and last month of the run, 1-based and inclusive. */
        val fromMonth: Int,
        val toMonth: Int,
        val left: Double,
        val width: Double,
    )

    data class MonthColumn(val month: Int, val left: Double, val width: Double)

    /** Days in the year, so a bar in a leap year is not a day and a half out by December. */
    fun daysInYear(year: Int): Int = if (LocalDate.of(year, 1, 1).isLeapYear) 366 else 365

    /** 0 for 1 January, 1 for 2 January. Parses the `YYYY-MM-DD` the API sends. */
    fun dayOffset(iso: String, year: Int): Int =
        (LocalDate.parse(iso.take(10)).toEpochDay() - LocalDate.of(year, 1, 1).toEpochDay()).toInt()

    /**
     * Where an entry sits on the ribbon, or null when it does not touch this year at all.
     *
     * An entry that reaches past either edge is cut at the edge and says so, rather than being
     * dropped or drawn overflowing: "winter rest" genuinely does start before January.
     */
    fun barFor(entry: CalendarEntryOut, year: Int, harvest: CalendarEntryOut? = null): Bar? {
        val total = daysInYear(year).toDouble()
        val rawStart = dayOffset(entry.start, year).toDouble()
        // Inclusive end: an entry that ends on the day it starts is one day long, not zero.
        // A forage runs to the end of its harvest, which is always the later of the two.
        val rawEnd = dayOffset(harvest?.end ?: entry.end, year).toDouble() + 1
        if (rawEnd <= 0 || rawStart >= total) return null

        val start = maxOf(0.0, rawStart)
        val end = minOf(total, rawEnd)
        // A single day is about 0.27% of a year, too thin to hit with a finger -- let alone a
        // gloved one; the floor is what makes every bar reachable.
        val width = maxOf(1.1, ((end - start) / total) * 100)
        val left = (start / total) * 100

        var split: Double? = null
        if (harvest != null && end > start) {
            val at = dayOffset(harvest.start, year).toDouble().coerceIn(0.0, total)
            // Relative to what is actually drawn, so a bar cut off at New Year still splits in
            // the right place rather than off its own end.
            split = (((at - start) / (end - start)) * 100).coerceIn(0.0, 100.0)
        }

        return Bar(
            entry = entry,
            left = left,
            width = minOf(width, 100 - left),
            clippedStart = rawStart < 0,
            clippedEnd = rawEnd > total,
            harvest = if (split != null) harvest else null,
            split = split,
        )
    }

    /** A move and, when there is one, the harvest of the same plant. */
    data class ForageUnit(val entry: CalendarEntryOut, val harvest: CalendarEntryOut? = null)

    /**
     * Moves and harvests of the same forage, brought together.
     *
     * Every harvest of a named forage follows its move: it starts as the flow ends and runs two
     * to four weeks longer, so the pair is one stretch of time with two halves. A forage with no
     * harvest entry stays a single bar, and a harvest that belongs to no plant stays one too.
     */
    fun pairForages(entries: List<CalendarEntryOut>): List<ForageUnit> {
        val harvests = entries
            .filter { it.category == "harvest" && it.honey != null }
            .associateBy { it.honey!! }

        val paired = mutableSetOf<String>()
        val units = entries.map { entry ->
            val harvest = if (entry.category == "migration" && entry.honey != null) {
                harvests[entry.honey]
            } else null
            if (harvest != null) paired += harvest.id
            ForageUnit(entry, harvest)
        }
        // The harvests that were folded into a move are not bars of their own any more.
        return units.filterNot { it.entry.id in paired }
    }

    /**
     * The rows of the ribbon, in [ROWS] order, with the empty ones left out.
     *
     * The same entry can arrive twice for one year -- the API repeats an entry for every year the
     * window reaches, and a window of thirteen months catches two runs of the same thing. Both
     * are kept when they really are two runs in this year (a swarm check in spring and in
     * summer), and the duplicate of one run is not.
     */
    fun rowsFor(entries: List<CalendarEntryOut>, year: Int): List<RibbonRow> {
        val seen = mutableSetOf<String>()
        val once = entries.filter { seen.add("${it.key}:${it.start}:${it.end}") }

        val byRow = mutableMapOf<Row, MutableList<Bar>>()
        for (unit in pairForages(once)) {
            val bar = barFor(unit.entry, year, unit.harvest) ?: continue
            val row = rowOf(unit.entry.category) ?: continue
            byRow.getOrPut(row) { mutableListOf() } += bar
        }

        return ROWS.mapNotNull { row ->
            val bars = byRow[row]?.sortedBy { it.left } ?: return@mapNotNull null
            if (bars.isEmpty()) null else RibbonRow(row, bars, lanesFor(bars))
        }
    }

    /**
     * Bars stacked into lanes, so that two things happening at once are two lines and not one
     * illegible overlap.
     *
     * Beekeeping overlaps by nature: the swarm season runs through the first harvest, five
     * migrations are open at the same time in June. Drawing those on one line either hides a bar
     * behind another or shortens both into something untrue.
     *
     * Greedy, taking the earliest bar first and putting it in the first lane with room: for
     * intervals sorted by start this uses the fewest lanes possible, so a row never grows taller
     * than its busiest moment needs.
     */
    fun lanesFor(bars: List<Bar>): List<List<Bar>> {
        val lanes = mutableListOf<MutableList<Bar>>()
        for (bar in bars.sortedBy { it.left }) {
            val lane = lanes.firstOrNull { it.last().let { last -> last.left + last.width + LANE_GAP <= bar.left } }
            if (lane != null) lane += bar else lanes += mutableListOf(bar)
        }
        return lanes
    }

    /** Where today's line goes, in percent, or null when today is in another year. */
    fun todayPosition(today: String, year: Int): Double? {
        val total = daysInYear(year).toDouble()
        val offset = dayOffset(today, year).toDouble()
        if (offset < 0 || offset >= total) return null
        // Mid-day, so the line sits inside today rather than on the boundary with yesterday.
        return ((offset + 0.5) / total) * 100
    }

    /** Month columns, as percentages, so the grid lines land on the first of each month. */
    fun monthColumns(year: Int): List<MonthColumn> {
        val total = daysInYear(year).toDouble()
        return (1..12).map { month ->
            val start = dayOffset(String.format(Locale.ROOT, "%04d-%02d-01", year, month), year).toDouble()
            val next = if (month == 12) total
            else dayOffset(String.format(Locale.ROOT, "%04d-%02d-01", year, month + 1), year).toDouble()
            MonthColumn(month, (start / total) * 100, ((next - start) / total) * 100)
        }
    }

    /**
     * Runs of consecutive months that share a season, for the scenery behind the bars.
     *
     * January and December are both winter but are not one run -- the year has two ends, and a
     * single stretched winter panel would have to span the whole ribbon to cover them.
     */
    fun seasonSegments(year: Int): List<SeasonSegment> {
        val segments = mutableListOf<SeasonSegment>()
        for (column in monthColumns(year)) {
            val season = seasonOfMonth(column.month)
            val last = segments.lastOrNull()
            if (last != null && last.season == season && last.toMonth == column.month - 1) {
                segments[segments.size - 1] = last.copy(
                    toMonth = column.month,
                    width = last.width + column.width,
                )
                continue
            }
            segments += SeasonSegment(season, column.month, column.month, column.left, column.width)
        }
        return segments
    }
}
