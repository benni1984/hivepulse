package com.hivepulse.app.ui.calendar

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hivepulse.app.R
import com.hivepulse.app.data.api.CalendarEntryOut
import com.hivepulse.app.data.api.RegionOut
import com.hivepulse.app.data.api.shift
import com.hivepulse.app.data.api.isLocated
import com.hivepulse.app.ui.common.LoadingScreen
import com.hivepulse.app.ui.moves.Forage
import com.hivepulse.app.ui.theme.Amber500
import com.hivepulse.app.ui.theme.Amber600
import com.hivepulse.app.ui.theme.Forest600
import com.hivepulse.app.ui.theme.Red500
import com.hivepulse.app.ui.theme.Stone200
import com.hivepulse.app.ui.theme.Stone500
import com.hivepulse.app.ui.theme.Stone900
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

private fun tintOf(category: String): Color = when (category) {
    "inspection", "bloom" -> Forest600
    "swarm", "varroa" -> Red500
    "feeding", "harvest" -> Amber600
    else -> Stone500
}

private fun categoryLabel(category: String): Int? = when (category) {
    "inspection" -> R.string.calendar_category_inspection
    "swarm" -> R.string.calendar_category_swarm
    "feeding" -> R.string.calendar_category_feeding
    "varroa" -> R.string.calendar_category_varroa
    "harvest" -> R.string.calendar_category_harvest
    "migration" -> R.string.calendar_category_migration
    "bloom" -> R.string.calendar_category_bloom
    "care" -> R.string.calendar_category_care
    "winter" -> R.string.calendar_category_winter
    else -> null
}

/** "2026-05" as the month and year the reader knows. */
internal fun monthName(month: String, locale: Locale = Locale.getDefault()): String = runCatching {
    val date = LocalDate.parse("$month-01")
    date.month.getDisplayName(TextStyle.FULL_STANDALONE, locale).replaceFirstChar { it.titlecase(locale) } + " " + date.year
}.getOrDefault(month)

/** "2026-05-12" as day and abbreviated month. */
internal fun shortDay(day: String, locale: Locale = Locale.getDefault()): String = runCatching {
    LocalDate.parse(day.take(10)).format(DateTimeFormatter.ofPattern("d MMM", locale))
}.getOrDefault(day)

/**
 * The beekeeper's year as an endless timeline: what to do when, month by month, moved to the beekeeper's place.
 * It opens at today and loads the next and the previous stretch of the year as it is scrolled.
 */
/**
 * Which of the two views of the year is on screen.
 *
 * [LIST] answers "what do I do now", month by month, with the whole text of every entry.
 * [RIBBON] answers what the list cannot: how the year hangs together, as one picture.
 */
enum class YearView { LIST, RIBBON }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BeekeepingYearScreen(
    onBack: () -> Unit,
    vm: BeekeepingYearViewModel = hiltViewModel(),
    regionVm: RegionViewModel = hiltViewModel(),
    ribbonVm: YearRibbonViewModel = hiltViewModel(),
) {
    var view by remember { mutableStateOf(YearView.LIST) }
    val state by vm.state.collectAsState()
    val listState = rememberLazyListState()
    val items = state.items
    var positioned by remember { mutableStateOf(false) }
    var showRegion by remember { mutableStateOf(false) }

    // Opens at today. The intro and the region line sit above the entries and count as the first
    // two rows of the list; the view switch is outside it.
    LaunchedEffect(state.isLoaded) {
        if (state.isLoaded && !positioned) {
            val today = items.indexOfFirst { it is TimelineItem.Today }
            if (today >= 0) listState.scrollToItem(today + 2)
            positioned = true
        }
    }

    // Reaching either end asks for the next stretch, once the list has opened at today.
    LaunchedEffect(positioned, listState) {
        if (!positioned) return@LaunchedEffect
        snapshotFlow { listState.layoutInfo.visibleItemsInfo.map { it.index } to listState.layoutInfo.totalItemsCount }
            .collect { (visible, total) ->
                if (visible.isEmpty()) return@collect
                if (visible.first() <= 2) vm.loadEarlier()
                if (visible.last() >= total - 3) vm.loadLater()
            }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.calendar_title)) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } },
            )
        }
    ) { padding ->
        if (view == YearView.RIBBON) {
            YearRibbonPane(
                vm = ribbonVm,
                onView = { view = it },
                modifier = Modifier.padding(padding),
            )
            return@Scaffold
        }
        if (!state.isLoaded && !state.failed) {
            LoadingScreen()
            return@Scaffold
        }
        // The switch is above the list, not the first row of it. The list opens scrolled to
        // today, a LazyColumn does not compose what is off screen, and as a row the switch was
        // therefore simply gone -- a beekeeper would have had to scroll back through the year to
        // find the other view. The emulator found this; neither the compiler nor a unit test can.
        Column(Modifier.padding(padding)) {
            YearViewSwitch(
                view,
                onView = { view = it },
                modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp),
            )
            LazyColumn(
            Modifier.testTag("beekeepingYearList"),
            state = listState,
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item(key = "intro") {
                Text(stringResource(R.string.calendar_intro), style = MaterialTheme.typography.bodySmall, color = Stone500)
            }
            item(key = "region") {
                state.region?.let { RegionLine(it, onChange = { showRegion = true }) }
                if (state.failed && !state.isLoaded) {
                    Text(stringResource(R.string.calendar_load_error), color = MaterialTheme.colorScheme.error)
                }
            }
            items(items, key = { it.id }) { item ->
                when (item) {
                    is TimelineItem.Month -> Text(
                        monthName(item.month),
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.padding(top = 12.dp),
                    )
                    is TimelineItem.Today -> TodayDivider(state.today)
                    is TimelineItem.Entry -> EntryCard(item.entry)
                }
            }
            item(key = "disclaimer") {
                Text(stringResource(R.string.calendar_disclaimer), style = MaterialTheme.typography.bodySmall, color = Stone500,
                    modifier = Modifier.padding(top = 12.dp))
            }
            item(key = "rate") {
                YearFeedbackLink(Modifier.padding(top = 10.dp, bottom = 24.dp))
            }
        }
        }
    }

    if (showRegion) {
        AlertDialog(
            onDismissRequest = { showRegion = false; vm.load() },
            title = { Text(stringResource(R.string.region_title)) },
            text = { RegionForm(regionVm) },
            confirmButton = {
                TextButton(onClick = { showRegion = false; vm.load() }, modifier = Modifier.testTag("regionDone")) {
                    Text(stringResource(R.string.action_done))
                }
            },
        )
    }
}

@Composable
private fun RegionLine(region: RegionOut, onChange: () -> Unit) {
    val place = if (region.source == "postal_code") {
        listOfNotNull(region.country?.let { BeekeepingYear.countryName(it, appLanguage()) }, region.postalCode)
            .filter { it.isNotBlank() }.joinToString(" ")
    } else stringResource(R.string.calendar_region_from_apiary)
    val text = when {
        region.source == "default" || region.source == null -> stringResource(R.string.calendar_region_none)
        region.shift == 0 -> stringResource(R.string.calendar_region_no_shift, place)
        region.shift > 0 -> stringResource(R.string.calendar_region_later, place, region.shift)
        else -> stringResource(R.string.calendar_region_earlier, place, -region.shift)
    }
    Column(verticalArrangement = Arrangement.spacedBy(4.dp), modifier = Modifier.testTag("calendarRegion")) {
        Text(text, style = MaterialTheme.typography.bodyMedium)
        if (!region.isLocated) {
            Text(stringResource(R.string.calendar_not_located), style = MaterialTheme.typography.labelMedium, color = Red500)
        }
        TextButton(onClick = onChange, modifier = Modifier.testTag("changeRegionButton")) {
            Text(stringResource(if (region.source == "default" || region.source == null) R.string.calendar_set_region else R.string.calendar_change_region))
        }
    }
}

@Composable
private fun TodayDivider(today: String) {
    Row(Modifier.fillMaxWidth().testTag("calendarToday"), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Box(Modifier.weight(1f).height(2.dp).background(Amber500))
        Text(
            stringResource(R.string.calendar_today, shortDay(today)),
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold), color = Amber600,
        )
        Box(Modifier.weight(1f).height(2.dp).background(Amber500))
    }
}

@Composable
private fun Chip(text: String, color: Color, filled: Boolean = false) {
    Text(
        text,
        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
        color = if (filled) Color.White else color,
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(if (filled) color else color.copy(alpha = 0.15f))
            .padding(horizontal = 10.dp, vertical = 3.dp),
    )
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun EntryCard(entry: CalendarEntryOut) {
    val tint = tintOf(entry.category)
    Card(
        modifier = Modifier.fillMaxWidth().testTag("calendarEntry"),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(if (entry.isActive) 2.dp else 1.dp, if (entry.isActive) Amber500 else Stone200),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Row(Modifier.height(IntrinsicSize.Min)) {
            Box(Modifier.width(5.dp).fillMaxHeight().background(tint))
            Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                // A photograph of the thing itself, when there is one: the plant in flower, a
                // capped queen cell, the mite on a bee. The text says what to do; this says what
                // you are looking for. It comes from the app's own assets, so it is there at the
                // apiary where there is no signal.
                YearPhotos.of(entry.key, entry.honey)?.let { YearPhotoFigure(it) }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    categoryLabel(entry.category)?.let { Chip(stringResource(it), tint) }
                    if (entry.isActive) Chip(stringResource(R.string.calendar_now), Amber500, filled = true)
                    entry.honey?.let { honey ->
                        Chip(Forage.labelRes(honey)?.let { stringResource(it) } ?: honey, Amber600)
                    }
                    entry.intervalDays?.let { Chip(stringResource(R.string.calendar_interval, it), Red500) }
                }
                Text(shortDay(entry.start) + " – " + shortDay(entry.end), style = MaterialTheme.typography.labelSmall, color = Stone500)
                Text(entry.title, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Stone900)
                Text(entry.body, style = MaterialTheme.typography.bodyMedium, color = Stone500)
            }
        }
    }
}

/** Country, postal code and the hand adjustment: where the year is moved to. Used by the settings and the dialog. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegionForm(vm: RegionViewModel) {
    val state by vm.state.collectAsState()
    if (!state.isLoaded) return
    val language = appLanguage()
    val countries = remember(language) {
        BeekeepingYear.COUNTRY_CODES.map { it to BeekeepingYear.countryName(it, language) }.sortedBy { it.second }
    }
    var open by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(stringResource(R.string.region_intro), style = MaterialTheme.typography.bodySmall, color = Stone500)

        ExposedDropdownMenuBox(expanded = open, onExpandedChange = { open = it }) {
            OutlinedTextField(
                value = countries.firstOrNull { it.first == state.country }?.second ?: stringResource(R.string.region_country_none),
                onValueChange = {},
                readOnly = true,
                label = { Text(stringResource(R.string.region_country)) },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = open) },
                modifier = Modifier.fillMaxWidth().menuAnchor().testTag("regionCountry"),
            )
            ExposedDropdownMenu(expanded = open, onDismissRequest = { open = false }) {
                DropdownMenuItem(text = { Text(stringResource(R.string.region_country_none)) }, onClick = { vm.setCountry(""); open = false })
                countries.forEach { (code, name) ->
                    DropdownMenuItem(text = { Text(name) }, onClick = { vm.setCountry(code); open = false })
                }
            }
        }

        OutlinedTextField(
            value = state.postalCode,
            onValueChange = vm::setPostalCode,
            label = { Text(stringResource(R.string.region_postal)) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().testTag("regionPostal"),
        )

        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(stringResource(R.string.region_adjust) + ": " + state.adjustDays, Modifier.weight(1f))
            OutlinedButton(onClick = { vm.setAdjustDays(state.adjustDays - 1) }, modifier = Modifier.testTag("regionAdjustMinus")) { Text("−") }
            OutlinedButton(onClick = { vm.setAdjustDays(state.adjustDays + 1) }, modifier = Modifier.testTag("regionAdjustPlus")) { Text("+") }
        }
        Text(stringResource(R.string.region_adjust_hint), style = MaterialTheme.typography.bodySmall, color = Stone500)

        Button(onClick = { vm.save() }, enabled = !state.isSaving, modifier = Modifier.fillMaxWidth().testTag("saveRegionButton")) {
            if (state.isSaving) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
            else Text(stringResource(R.string.region_save))
        }
        when (state.message) {
            RegionMessage.SAVED -> Text(stringResource(R.string.region_saved), color = Forest600, style = MaterialTheme.typography.bodySmall)
            RegionMessage.NOT_LOCATED -> Text(stringResource(R.string.region_not_located), color = Red500, style = MaterialTheme.typography.bodySmall)
            RegionMessage.FAILED -> Text(stringResource(R.string.region_error), color = Red500, style = MaterialTheme.typography.bodySmall)
            null -> {}
        }
    }
}

/**
 * The two views of the year, as a segmented control with the hint of the chosen one under it.
 *
 * Both are the same year; neither is a filter of the other. The hint says which question each
 * one answers, because "List" and "Overview" on their own do not.
 */
/**
 * "Do these dates fit where your bees are? Tell us."
 *
 * The questionnaire is a web page and stays one. It needs no account, it is filled in once, and
 * it is 35 questions long -- a native copy of it on two platforms would be a large amount of
 * duplicated screen for something nobody does twice. What the apps are good for is asking the
 * question in the place where somebody is already looking at the dates and thinking "not here".
 */
@Composable
fun YearFeedbackLink(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val url = "https://hivepulse.multihead.de/${appLanguage()}/year-feedback"
    Column(modifier, verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
            stringResource(R.string.calendar_rate_hint),
            style = MaterialTheme.typography.bodySmall, color = Stone500,
        )
        Text(
            stringResource(R.string.calendar_rate_link),
            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
            color = Amber600,
            modifier = Modifier
                .testTag("yearFeedbackLink")
                .clickable {
                    context.startActivity(
                        android.content.Intent(
                            android.content.Intent.ACTION_VIEW,
                            android.net.Uri.parse(url),
                        )
                    )
                },
        )
    }
}

@Composable
fun YearViewSwitch(view: YearView, onView: (YearView) -> Unit, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
            SegmentedButton(
                selected = view == YearView.LIST,
                onClick = { onView(YearView.LIST) },
                shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
                modifier = Modifier.testTag("yearViewList"),
            ) { Text(stringResource(R.string.calendar_view_list)) }
            SegmentedButton(
                selected = view == YearView.RIBBON,
                onClick = { onView(YearView.RIBBON) },
                shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
                modifier = Modifier.testTag("yearViewRibbon"),
            ) { Text(stringResource(R.string.calendar_view_ribbon)) }
        }
        Text(
            stringResource(
                if (view == YearView.LIST) R.string.calendar_view_list_hint
                else R.string.calendar_view_ribbon_hint,
            ),
            style = MaterialTheme.typography.labelSmall, color = Stone500,
        )
    }
}

/**
 * The ribbon with its own scrolling, the switch above it and the tapped entry under it.
 *
 * Vertically it is a plain column and not a lazy list: seven rows is the whole of it, and a lazy
 * list would recycle the rows out from under a horizontal scroll they all share.
 */
@Composable
fun YearRibbonPane(vm: YearRibbonViewModel, onView: (YearView) -> Unit, modifier: Modifier = Modifier) {
    val state by vm.state.collectAsState()
    var picked by remember { mutableStateOf<YearRibbon.Bar?>(null) }
    val scroll = rememberScrollState()

    // The detail opens under the ribbon, which on a phone is under the fold: you tapped a bar and
    // nothing appeared to happen. Scrolled to, it is the answer to the tap. Only the ribbon and
    // the disclaimer are below it, so the bottom is where it is.
    LaunchedEffect(picked) {
        if (picked != null) scroll.animateScrollTo(scroll.maxValue)
    }

    // The switch stays put while the rest scrolls, for the same reason it is not a row of the
    // list: scrolled away, it is gone. Inside the scrolling column it survived a short screen and
    // died on a small one -- tapping a bar scrolls to the detail at the bottom, which carried the
    // switch off the top edge, and a tap on a node outside the viewport lands nowhere. A phone
    // user would have had to scroll back up to leave the view. CI's emulator found this; the
    // taller one it was written on did not.
    Column(modifier.fillMaxSize()) {
        YearViewSwitch(
            YearView.RIBBON,
            onView,
            modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp),
        )
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(scroll)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            if (!state.isLoaded && !state.failed) {
                LoadingScreen()
                return@Column
            }
            if (state.failed && !state.isLoaded) {
                Text(stringResource(R.string.calendar_load_error), color = MaterialTheme.colorScheme.error)
                return@Column
            }
            if (state.rows.isEmpty()) {
                Text(stringResource(R.string.calendar_ribbon_empty), color = Stone500)
                return@Column
            }

            YearRibbonCanvas(state = state, picked = picked, onPick = { picked = if (sameBar(picked, it)) null else it })
            picked?.let { RibbonDetail(it) }
            Text(
                stringResource(R.string.calendar_disclaimer),
                style = MaterialTheme.typography.bodySmall, color = Stone500,
                modifier = Modifier.padding(top = 6.dp),
            )
            YearFeedbackLink(Modifier.padding(bottom = 24.dp))
        }
    }
}
