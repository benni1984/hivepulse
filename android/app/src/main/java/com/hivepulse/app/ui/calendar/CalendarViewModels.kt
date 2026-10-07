package com.hivepulse.app.ui.calendar

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.data.api.CalendarEntryOut
import com.hivepulse.app.data.api.RegionOut
import com.hivepulse.app.data.api.RegionUpdateRequest
import com.hivepulse.app.data.repository.CalendarRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.util.Locale
import javax.inject.Inject

/** The language of the app as the server knows it: "de", "fr", "es", "pl" or "en". */
fun appLanguage(locale: Locale = Locale.getDefault()): String =
    locale.language.takeIf { it in listOf("en", "de", "fr", "es", "pl") } ?: "en"

// ── The endless timeline ─────────────────────────────────────────────────────────────────────

data class BeekeepingYearState(
    val entries: List<CalendarEntryOut> = emptyList(),
    val region: RegionOut? = null,
    val today: String = LocalDate.now().toString(),
    val isLoaded: Boolean = false,
    val failed: Boolean = false,
    val isLoadingEarlier: Boolean = false,
    val isLoadingLater: Boolean = false,
    val loadedFrom: String? = null,
    val loadedTo: String? = null,
) {
    val items: List<TimelineItem> get() = BeekeepingYear.timeline(entries, today)
}

@HiltViewModel
class BeekeepingYearViewModel @Inject constructor(
    private val repo: CalendarRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(BeekeepingYearState())
    val state = _state.asStateFlow()

    init { load() }

    /**
     * The first stretch: from the month before this one, so there is a little to scroll back to. Also what runs
     * again when the region changed and every date has moved.
     */
    fun load() = viewModelScope.launch {
        _state.update { it.copy(failed = false) }
        val from = BeekeepingYear.firstOfMonth(_state.value.today, monthsAgo = 1)
        runCatching { repo.calendar(from, BeekeepingYear.WINDOW_DAYS + 31, appLanguage()) }
            .onSuccess { window ->
                _state.update {
                    it.copy(
                        entries = window.entries, region = window.region, today = window.today,
                        loadedFrom = window.start, loadedTo = window.end, isLoaded = true,
                    )
                }
            }
            .onFailure { _state.update { it.copy(failed = true) } }
    }

    fun loadLater() = viewModelScope.launch {
        val current = _state.value
        val to = current.loadedTo
        if (!current.isLoaded || current.isLoadingLater || to == null) return@launch
        _state.update { it.copy(isLoadingLater = true) }
        runCatching { repo.calendar(BeekeepingYear.addDays(to, 1), BeekeepingYear.WINDOW_DAYS, appLanguage()) }
            .onSuccess { window ->
                _state.update { it.copy(entries = BeekeepingYear.merge(it.entries, window.entries), loadedTo = window.end, isLoadingLater = false) }
            }
            .onFailure { _state.update { it.copy(failed = true, isLoadingLater = false) } }
    }

    fun loadEarlier() = viewModelScope.launch {
        val current = _state.value
        val from = current.loadedFrom
        if (!current.isLoaded || current.isLoadingEarlier || from == null) return@launch
        _state.update { it.copy(isLoadingEarlier = true) }
        val earlier = BeekeepingYear.addDays(from, -BeekeepingYear.WINDOW_DAYS)
        runCatching { repo.calendar(earlier, BeekeepingYear.WINDOW_DAYS, appLanguage()) }
            .onSuccess { window ->
                _state.update { it.copy(entries = BeekeepingYear.merge(it.entries, window.entries), loadedFrom = earlier, isLoadingEarlier = false) }
            }
            .onFailure { _state.update { it.copy(failed = true, isLoadingEarlier = false) } }
    }
}

// ── The region the year is moved to ──────────────────────────────────────────────────────────

enum class RegionMessage { SAVED, NOT_LOCATED, FAILED }

data class RegionState(
    val country: String = "",
    val postalCode: String = "",
    val adjustDays: Int = 0,
    val isLoaded: Boolean = false,
    val isSaving: Boolean = false,
    val message: RegionMessage? = null,
) {
    fun request() = RegionUpdateRequest(country, postalCode.trim(), RegionViewModel.clamp(adjustDays))
}

@HiltViewModel
class RegionViewModel @Inject constructor(
    private val repo: CalendarRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(RegionState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        // Without it the year still works, only unmoved: a failed load hides the form instead of showing an error.
        runCatching { repo.region() }.onSuccess { apply(it, loaded = true) }
    }

    private fun apply(region: RegionOut, loaded: Boolean = _state.value.isLoaded) {
        _state.update {
            it.copy(
                country = region.country.orEmpty(), postalCode = region.postalCode.orEmpty(),
                adjustDays = region.adjustDays ?: 0, isLoaded = loaded,
            )
        }
    }

    fun setCountry(value: String) = _state.update { it.copy(country = value, message = null) }
    fun setPostalCode(value: String) = _state.update { it.copy(postalCode = value.take(20), message = null) }
    fun setAdjustDays(value: Int) = _state.update { it.copy(adjustDays = clamp(value), message = null) }

    /** [onSaved] gets the saved region; a refusal shows as the message and leaves the form as it was. */
    fun save(onSaved: (RegionOut) -> Unit = {}) = viewModelScope.launch {
        _state.update { it.copy(isSaving = true, message = null) }
        runCatching { repo.updateRegion(_state.value.request()) }
            .onSuccess { saved ->
                apply(saved)
                _state.update { it.copy(isSaving = false, message = if (saved.located == false) RegionMessage.NOT_LOCATED else RegionMessage.SAVED) }
                onSaved(saved)
            }
            .onFailure { _state.update { it.copy(isSaving = false, message = RegionMessage.FAILED) } }
    }

    companion object {
        /** The adjustment is kept within what the server accepts. */
        fun clamp(days: Int): Int = days.coerceIn(-28, 28)
    }
}
