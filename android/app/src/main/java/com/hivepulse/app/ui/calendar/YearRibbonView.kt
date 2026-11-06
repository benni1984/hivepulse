package com.hivepulse.app.ui.calendar

import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.hivepulse.app.R
import com.hivepulse.app.data.api.CalendarEntryOut
import com.hivepulse.app.ui.moves.Forage
import com.hivepulse.app.ui.theme.Amber500
import com.hivepulse.app.ui.theme.Amber600
import com.hivepulse.app.ui.theme.Stone200
import com.hivepulse.app.ui.theme.Stone500
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

/**
 * The beekeeper's year at a glance: twelve months across, a row per subject, a bar per job.
 *
 * The list answers "what do I do now". This answers what the list cannot: how the year hangs
 * together -- that swarm control runs straight through the first honey, that the varroa treatment
 * sits in the gap after the supers come off, that feeding and winter preparation are the same six
 * weeks.
 *
 * **Why this scrolls sideways and the website's does not.** The website draws the ribbon from
 * tablet width up and gives a phone a plain vertical list instead, because twelve months across
 * 360 pixels is thirty pixels a month and unreadable. That reasoning is about the *viewport*, and
 * on the web there is no good answer: a sideways-scrolling strip inside a page fights the page's
 * own scrolling. In an app it does not -- swiping a strip sideways is an ordinary gesture -- so
 * here the canvas is simply made wider than the screen ([MIN_CANVAS]) and the year is dragged
 * through, and on a tablet or in landscape the canvas fills the width and nothing needs dragging
 * at all.
 *
 * The row labels stand in a column that does not scroll, so you still know which row you are
 * looking at after dragging into August. It costs a fifth of a phone's width, which is worth it:
 * a label above a row that is being dragged sideways tells you less than it looks like, because
 * the thing you lose track of is the row, not the subject.
 *
 * The iPhone's `YearRibbonView.swift` is laid out the same way, down to the constants.
 */

/**
 * How wide the year is drawn, at the least.
 *
 * Two things pull against each other here, and the emulator settled it. Wide enough and a month
 * is comfortable to read; too wide and "the whole year in one picture" shows a quarter of a year
 * and needs four drags, which is not a picture of anything. At 640dp a month is 53dp -- room for
 * "Jan" and for a three-week bar to be 37dp, which a gloved finger can hit -- and about six
 * months are on a phone screen at once, so the year is two drags rather than four.
 */
private val MIN_CANVAS = 640.dp

/** The height of one lane of bars, and the gap between two lanes. */
private val LANE_HEIGHT = 26.dp
private val LANE_GAP = 4.dp

/** The gap between one row and the next, the height of the month strip, and the label column. */
private val ROW_SPACING = 14.dp
private val MONTH_HEIGHT = 24.dp

/**
 * The row names column. Every point here is a point the year does not get, and on a phone that
 * is the one thing the screen is for, so it is as narrow as two lines of the longest name allow.
 */
private val LABEL_WIDTH = 58.dp

/** A quiet, still tint per season, so winter and summer are tellable at a glance. */
private fun seasonTint(season: YearRibbon.Season): Color = when (season) {
    YearRibbon.Season.WINTER -> Color(0xFFF1F5F9)
    YearRibbon.Season.SPRING -> Color(0xFFF0FDF4)
    YearRibbon.Season.SUMMER -> Color(0xFFFEFCE8)
    YearRibbon.Season.AUTUMN -> Color(0xFFFEF3EC)
}

/** The colour of a bar, which is its category -- the only thing left telling them apart on a shared row. */
internal fun barTint(category: String): Color = when (category) {
    "inspection" -> Color(0xFF16A34A)
    "swarm" -> Color(0xFFDC2626)
    "bloom" -> Color(0xFF65A30D)
    "migration" -> Color(0xFF0891B2)
    "harvest" -> Amber600
    "varroa" -> Color(0xFFB91C1C)
    "feeding" -> Color(0xFFD97706)
    "care" -> Color(0xFF7C3AED)
    "winter" -> Color(0xFF475569)
    else -> Stone500
}

internal fun rowLabelRes(row: YearRibbon.Row): Int = when (row) {
    YearRibbon.Row.INSPECTION -> R.string.calendar_category_inspection
    YearRibbon.Row.SWARM -> R.string.calendar_category_swarm
    YearRibbon.Row.FORAGE -> R.string.calendar_row_forage
    YearRibbon.Row.VARROA -> R.string.calendar_category_varroa
    YearRibbon.Row.FEEDING -> R.string.calendar_category_feeding
    YearRibbon.Row.CARE -> R.string.calendar_category_care
    YearRibbon.Row.WINTER -> R.string.calendar_category_winter
}

/** The name on a bar: the plant for a forage, otherwise the job. */
@Composable
internal fun barLabel(bar: YearRibbon.Bar): String {
    val honey = bar.entry.honey
    if (honey != null) {
        Forage.labelRes(honey)?.let { return stringResource(it) }
        return honey
    }
    return bar.entry.title
}

/** "Jan", "Feb" -- as short as the language makes them. */
internal fun shortMonth(month: Int, locale: Locale = Locale.getDefault()): String =
    LocalDate.of(2026, month, 1).month.getDisplayName(TextStyle.SHORT_STANDALONE, locale)

/**
 * Lays children out at a fraction of the parent's width: `left` and `width` as percentages.
 *
 * Everything the arithmetic produces is a percentage of the year, so the same numbers work at
 * every canvas width. This is the one place that turns them into pixels.
 */
@Composable
private fun PercentRow(
    modifier: Modifier = Modifier,
    placements: List<Pair<Double, Double>>,
    content: @Composable () -> Unit,
) {
    Layout(modifier = modifier, content = { content() }) { measurables, constraints ->
        val total = constraints.maxWidth
        val placed = measurables.mapIndexed { index, measurable ->
            val (left, width) = placements.getOrElse(index) { 0.0 to 100.0 }
            // At least one pixel: a bar rounded away to nothing would be a job that vanished.
            val pixels = ((width / 100.0) * total).toInt().coerceAtLeast(1)
            measurable.measure(
                constraints.copy(minWidth = pixels, maxWidth = pixels),
            ) to ((left / 100.0) * total).toInt()
        }
        val height = placed.maxOfOrNull { it.first.height } ?: 0
        layout(total, height) {
            for ((placeable, x) in placed) placeable.placeRelative(x, 0)
        }
    }
}

/**
 * The whole ribbon, scrolled sideways as one piece.
 *
 * Every strip -- the month header and each row -- carries the *same* [ScrollState], so dragging
 * any of them drags all of them. Separate states would let the rows slide out of step with the
 * months above, which is worse than no ribbon at all: the bars would be over the wrong dates.
 */
@Composable
fun YearRibbonCanvas(
    state: YearRibbonState,
    picked: YearRibbon.Bar?,
    onPick: (YearRibbon.Bar) -> Unit,
    modifier: Modifier = Modifier,
) {
    val scroll: ScrollState = rememberScrollState()
    val screen = LocalConfiguration.current.screenWidthDp.dp
    // On a tablet or in landscape the year fits, and then it should fill the width rather than
    // sit in a [MIN_CANVAS] block with a gap beside it.
    val canvas: Dp = maxOf(MIN_CANVAS, screen - 32.dp - LABEL_WIDTH - 8.dp)
    val rows = state.rows
    val todayAt = state.todayAt
    // The grid and the scenery are the same for every row, and both are pure arithmetic over the
    // year; computing them per row would redo the same twelve divisions seven times a frame.
    val months = remember(state.year) { YearRibbon.monthColumns(state.year) }
    val seasons = remember(state.year) { YearRibbon.seasonSegments(state.year) }

    Row(modifier = modifier.testTag("yearRibbon"), horizontalArrangement = Arrangement.spacedBy(8.dp)) {

        // ── The row names, in a column that does not scroll ────────────────────────────────
        // So that you still know which row you are looking at after dragging into August. The
        // heights come from the same lane counts as the rows themselves, which is what keeps the
        // two columns level without either having to measure the other.
        Column(Modifier.width(LABEL_WIDTH)) {
            Spacer(Modifier.height(MONTH_HEIGHT))
            for (row in rows) {
                Box(
                    Modifier
                        .padding(top = ROW_SPACING)
                        .height(LANE_HEIGHT * row.lanes.size + LANE_GAP * (row.lanes.size - 1)),
                ) {
                    Text(
                        stringResource(rowLabelRes(row.row)),
                        // Two lines of 11dp fit the 26dp a single-lane row is tall, and the
                        // longest of these names needs two in every language ("Schwarmkontrolle",
                        // "Contrôle de l'essaimage"). At the theme's own label size the second
                        // line did not fit and the name was cut off instead of wrapping.
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 9.sp,
                            lineHeight = 11.sp,
                        ),
                        color = Stone500,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.testTag("ribbonRowLabel"),
                    )
                }
            }
        }

        Column {

        // ── The months, tinted by season ───────────────────────────────────────────────────
        Box(Modifier.horizontalScroll(scroll)) {
            Box(Modifier.width(canvas).clip(RoundedCornerShape(8.dp))) {
                PercentRow(placements = seasons.map { it.left to it.width }) {
                    for (segment in seasons) {
                        Box(Modifier.fillMaxWidth().height(MONTH_HEIGHT).background(seasonTint(segment.season)))
                    }
                }
                PercentRow(placements = months.map { it.left to it.width }) {
                    for (column in months) {
                        Text(
                            shortMonth(column.month),
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                            color = Stone500,
                            maxLines = 1,
                            overflow = TextOverflow.Clip,
                            modifier = Modifier.height(MONTH_HEIGHT).wrapContentHeight(Alignment.CenterVertically)
                                .padding(start = 6.dp),
                        )
                    }
                }
            }
        }

        // ── A row per subject ──────────────────────────────────────────────────────────────
        for (row in rows) {
            Spacer(Modifier.height(ROW_SPACING))
            val rowHeight = LANE_HEIGHT * row.lanes.size + LANE_GAP * (row.lanes.size - 1)
            Box(Modifier.horizontalScroll(scroll)) {
                Box(Modifier.width(canvas)) {
                    // The month grid, faint, so a bar can be read against the calendar.
                    PercentRow(placements = months.map { it.left to it.width }) {
                        for (column in months) {
                            Box(
                                Modifier.fillMaxWidth().height(rowHeight)
                                    .background(if (column.month % 2 == 0) Color(0x08000000) else Color.Transparent),
                            )
                        }
                    }
                    Column(verticalArrangement = Arrangement.spacedBy(LANE_GAP)) {
                        for (lane in row.lanes) {
                            PercentRow(placements = lane.map { it.left to it.width }) {
                                for (bar in lane) BarBlock(bar, picked = sameBar(picked, bar), onPick = onPick)
                            }
                        }
                    }
                    // Today, over the bars rather than under them: it is the one line a beekeeper
                    // looks for first, and a bar would hide it.
                    if (todayAt != null) {
                        PercentRow(placements = listOf(todayAt to 0.4)) {
                            Box(Modifier.fillMaxWidth().height(rowHeight).background(Amber500))
                        }
                    }
                }
            }
        }
        }
    }
}

/** Whether two bars are the same job: the entry key and its start, which is what makes a run. */
internal fun sameBar(a: YearRibbon.Bar?, b: YearRibbon.Bar?): Boolean =
    a != null && b != null && a.entry.id == b.entry.id

/**
 * One bar. A forage is drawn in two colours: the move, then its harvest as an amber tail.
 *
 * The seam is a hard stop in a gradient rather than two boxes, so a bar one pixel wider than its
 * own label still shows both halves instead of dropping one.
 */
@Composable
private fun BarBlock(bar: YearRibbon.Bar, picked: Boolean, onPick: (YearRibbon.Bar) -> Unit) {
    val base = barTint(bar.entry.category)
    val split = bar.split
    val fill = if (split != null) {
        val at = (split / 100.0).toFloat().coerceIn(0f, 1f)
        Brush.horizontalGradient(0f to base, at to base, at to Amber600, 1f to Amber600)
    } else {
        Brush.horizontalGradient(0f to base, 1f to base)
    }
    Box(
        Modifier
            .height(LANE_HEIGHT)
            .clip(RoundedCornerShape(5.dp))
            .background(fill)
            .then(if (picked) Modifier.border(2.dp, Color.White, RoundedCornerShape(5.dp)) else Modifier)
            .clickable { onPick(bar) }
            .testTag("ribbonBar"),
        contentAlignment = Alignment.CenterStart,
    ) {
        Text(
            barLabel(bar),
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
            color = Color.White,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(horizontal = 6.dp),
        )
    }
}

/** The dates of a bar: a forage reads from the move to the end of its harvest. */
internal fun barDates(bar: YearRibbon.Bar): String =
    shortDay(bar.entry.start) + " – " + shortDay(bar.harvest?.end ?: bar.entry.end)

/**
 * A photograph of the thing itself: the plant in flower, a capped queen cell, the mite on a bee.
 *
 * The bar says *when*; this says what you are looking for. The author and the licence sit under
 * it, which is what CC BY and CC BY-SA ask for and what [YearPhotos] carries for every picture.
 *
 * The file is in the app's own assets, not fetched: at the apiary there is usually no signal, and
 * a year screen that loses its pictures off-grid would lose them exactly where they are wanted.
 */
@Composable
fun YearPhotoFigure(photo: YearPhoto, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(3.dp)) {
        AsyncImage(
            model = "file:///android_asset/${photo.file}",
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxWidth().height(150.dp).clip(RoundedCornerShape(8.dp))
                .testTag("yearPhoto"),
        )
        Text(
            stringResource(R.string.calendar_photo_credit, photo.author, photo.licence),
            style = MaterialTheme.typography.labelSmall,
            color = Stone500,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.testTag("yearPhotoCredit"),
        )
    }
}

/** The entry, or both entries of a forage, under the ribbon once a bar is tapped. */
@Composable
fun RibbonDetail(bar: YearRibbon.Bar, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, Stone200, RoundedCornerShape(12.dp))
            .padding(14.dp)
            .testTag("ribbonDetail"),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        // One picture for the pair: a forage shows its plant, which is what both halves are about.
        YearPhotos.of(bar.entry.key, bar.entry.honey)?.let { YearPhotoFigure(it) }
        DetailPart(bar.entry)
        bar.harvest?.let {
            Box(Modifier.fillMaxWidth().height(1.dp).background(Stone200))
            DetailPart(it)
        }
    }
}

@Composable
private fun DetailPart(entry: CalendarEntryOut) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            shortDay(entry.start) + " – " + shortDay(entry.end),
            style = MaterialTheme.typography.labelSmall, color = Stone500,
        )
        Text(
            entry.title,
            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
        )
        Text(entry.body, style = MaterialTheme.typography.bodySmall, color = Stone500)
    }
}
