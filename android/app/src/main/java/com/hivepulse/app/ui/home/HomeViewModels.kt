package com.hivepulse.app.ui.home

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.data.api.HomeSummaryOut
import com.hivepulse.app.data.api.PlannedTreatmentOut
import com.hivepulse.app.data.api.TreatmentCreateRequest
import com.hivepulse.app.data.repository.HomeRepository
import com.hivepulse.app.data.repository.TreatmentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import javax.inject.Inject

/**
 * A day as the server sends it ("2026-05-12", no time) shown in the reader's format. Parsed as a plain date, so
 * it cannot slip to the day before in a time zone west of the server's.
 */
fun formatDay(day: String?): String {
    if (day.isNullOrBlank()) return ""
    return runCatching {
        LocalDate.parse(day.take(10)).format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM))
    }.getOrDefault(day)
}

// ── The summary at the top of the apiary list ────────────────────────────────────────────────

data class HomeState(
    val home: HomeSummaryOut? = null,
    val error: String? = null,
) {
    /** Somebody with no hives yet has nothing to be told; the apiary list below already explains how to start. */
    val isVisible: Boolean get() = (home?.hiveCount ?: 0) > 0
}

@HiltViewModel
class HomeSummaryViewModel @Inject constructor(
    private val homeRepo: HomeRepository,
    private val treatmentRepo: TreatmentRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(HomeState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        // The apiary list is usable without it: a failed load keeps what was there and shows no error of its own.
        runCatching { homeRepo.home() }.onSuccess { summary -> _state.update { it.copy(home = summary) } }
    }

    fun markDone(treatment: PlannedTreatmentOut) = viewModelScope.launch {
        _state.update { it.copy(error = null) }
        runCatching { treatmentRepo.markDone(treatment.id) }
            .onSuccess { load() }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}

// ── The treatments of one hive or apiary ─────────────────────────────────────────────────────

data class TreatmentsState(
    val open: List<PlannedTreatmentOut> = emptyList(),
    val done: List<PlannedTreatmentOut> = emptyList(),
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val error: String? = null,
    // The form that plans another one.
    val product: String = "",
    /** YYYY-MM-DD */
    val dueOn: String = LocalDate.now().plusDays(7).toString(),
    val note: String = "",
) {
    val canPlan: Boolean get() = product.isNotBlank() && !isSaving
}

@HiltViewModel
class TreatmentsViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val repo: TreatmentRepository,
) : ViewModel() {

    private val id = savedState.get<String>("id")!!
    val isHive = savedState.get<String>("type") == "hive"
    private val hiveId: String? = if (isHive) id else null
    private val apiaryId: String? = if (isHive) null else id

    private val _state = MutableStateFlow(TreatmentsState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true) }
        runCatching { repo.open(hiveId, apiaryId) to repo.done(hiveId, apiaryId) }
            // Each screen lists the treatments of its own target, and the last few that were done.
            .onSuccess { (open, done) -> _state.update { it.copy(isLoading = false, open = open, done = done.take(5)) } }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun setProduct(value: String) = _state.update { it.copy(product = value) }
    fun setDueOn(value: String) = _state.update { it.copy(dueOn = value) }
    fun setNote(value: String) = _state.update { it.copy(note = value) }
    fun clearError() = _state.update { it.copy(error = null) }

    fun request(): TreatmentCreateRequest {
        val current = _state.value
        return TreatmentCreateRequest(
            hiveId = hiveId, apiaryId = apiaryId,
            product = current.product.trim(), dueOn = current.dueOn,
            note = current.note.trim().ifEmpty { null },
        )
    }

    /** Sends the plan and empties the form for the next one; a refusal shows its reason and keeps the form. */
    fun plan() {
        if (!_state.value.canPlan) return
        _state.update { it.copy(isSaving = true, error = null) }
        viewModelScope.launch {
            runCatching { repo.create(request()) }
                .onSuccess {
                    _state.update { it.copy(isSaving = false, product = "", note = "", dueOn = LocalDate.now().plusDays(7).toString()) }
                    load()
                }
                // The server words the reason (only the owner may plan for an apiary, ...) in the user's language.
                .onFailure { e -> _state.update { it.copy(isSaving = false, error = e.message) } }
        }
    }

    fun markDone(treatment: PlannedTreatmentOut) = act { repo.markDone(treatment.id) }
    fun reopen(treatment: PlannedTreatmentOut) = act { repo.reopen(treatment.id) }
    fun delete(treatment: PlannedTreatmentOut) = act { repo.delete(treatment.id) }

    private fun act(action: suspend () -> Unit) = viewModelScope.launch {
        _state.update { it.copy(error = null) }
        runCatching { action() }
            .onSuccess { load() }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }
}
