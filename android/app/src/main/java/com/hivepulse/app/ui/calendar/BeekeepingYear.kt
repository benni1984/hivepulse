package com.hivepulse.app.ui.calendar

import com.hivepulse.app.data.api.CalendarEntryOut
import java.time.LocalDate
import java.util.Locale

/** One row of the endless timeline: a month header, the divider where today falls, or an entry. */
sealed class TimelineItem(val id: String) {
    /** [month] is "2026-05". */
    data class Month(val month: String) : TimelineItem("month-$month")
    data object Today : TimelineItem("today")
    data class Entry(val entry: CalendarEntryOut) : TimelineItem(entry.id)
}

/** The arithmetic behind the timeline, the same rules as the website's and the iPhone's. */
object BeekeepingYear {

    /** The windows the timeline asks for: about a third of a year each. */
    const val WINDOW_DAYS = 120

    /** The countries offered for the region, as ISO 3166-1 alpha-2 codes. */
    val COUNTRY_CODES = listOf(
        "AL", "AD", "AT", "BE", "BA", "BG", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GR", "HR",
        "HU", "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NL", "NO", "PL", "PT", "RO",
        "RS", "SE", "SI", "SK", "SM", "TR", "UA",
    )

    /** The name of a country in the given language; the code itself when it cannot be named. */
    fun countryName(code: String, language: String): String =
        Locale("", code).getDisplayCountry(Locale(language)).ifBlank { code }

    fun addDays(day: String, days: Int): String = LocalDate.parse(day.take(10)).plusDays(days.toLong()).toString()

    /** The first of the month [monthsAgo] months before the one [day] is in. */
    fun firstOfMonth(day: String, monthsAgo: Int = 0): String =
        LocalDate.parse(day.take(10)).withDayOfMonth(1).minusMonths(monthsAgo.toLong()).toString()

    /** Entries of several windows in one list, once each, oldest first. */
    fun merge(current: List<CalendarEntryOut>, incoming: List<CalendarEntryOut>): List<CalendarEntryOut> =
        (current + incoming).associateBy { it.id }.values.sortedWith(compareBy({ it.start }, { it.key }))

    /**
     * A header for every month an entry starts in, the entries of that month, and a divider where today falls:
     * after the entries that started before it and before the ones that start later.
     */
    fun timeline(entries: List<CalendarEntryOut>, today: String): List<TimelineItem> {
        val items = mutableListOf<TimelineItem>()
        var month = ""
        var todayShown = false
        val todayMonth = today.take(7)

        fun header(value: String) {
            items += TimelineItem.Month(value)
            month = value
        }
        fun showToday() {
            if (!todayShown) {
                items += TimelineItem.Today
                todayShown = true
            }
        }

        for (entry in entries) {
            if (!todayShown && entry.start > today) {
                if (month != todayMonth) header(todayMonth)
                showToday()
            }
            val entryMonth = entry.start.take(7)
            if (entryMonth != month) header(entryMonth)
            items += TimelineItem.Entry(entry)
        }
        if (entries.isNotEmpty() && !todayShown && entries.last().start <= today) {
            if (month != todayMonth) header(todayMonth)
            showToday()
        }
        return items
    }
}
