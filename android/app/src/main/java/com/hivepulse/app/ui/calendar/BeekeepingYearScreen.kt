package com.hivepulse.app.ui.calendar

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
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
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BeekeepingYearScreen(onBack: () -> Unit, vm: BeekeepingYearViewModel = hiltViewModel(), regionVm: RegionViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    val listState = rememberLazyListState()
    val items = state.items
    var positioned by remember { mutableStateOf(false) }
    var showRegion by remember { mutableStateOf(false) }

    // Opens at today. The header row above the list counts as the first two rows.
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
        if (!state.isLoaded && !state.failed) {
            LoadingScreen()
            return@Scaffold
        }
        LazyColumn(
            Modifier.padding(padding).testTag("beekeepingYearList"),
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
                    modifier = Modifier.padding(top = 12.dp, bottom = 24.dp))
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
