package com.hivepulse.app.ui.moves

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.data.api.ApiaryOut
import com.hivepulse.app.data.api.HiveMoveOut
import com.hivepulse.app.data.api.HiveOut
import com.hivepulse.app.data.api.MoveCreateRequest
import com.hivepulse.app.data.api.MoveResultOut
import com.hivepulse.app.data.api.NewApiaryForMove
import com.hivepulse.app.data.api.isOwner
import com.hivepulse.app.data.repository.ApiaryRepository
import com.hivepulse.app.data.repository.HiveRepository
import com.hivepulse.app.data.repository.MoveRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

// ── Taking hives elsewhere ────────────────────────────────────────────────────────────────────

const val NEW_PLACE = "__new__"
const val OTHER_FORAGE = "__other__"

data class MoveFormState(
    val hives: List<HiveOut> = emptyList(),
    /** The caller's own other apiaries: not where the hives already are, and not somebody else's. */
    val targets: List<ApiaryOut> = emptyList(),
    /** Shortcuts back to where the hives stood before; empty until the history is loaded, or without any. */
    val returns: List<ReturnSuggestion> = emptyList(),
    val selected: Set<String> = emptySet(),
    /** An apiary id, [NEW_PLACE], or empty while nothing is chosen. */
    val target: String = "",
    val newName: String = "",
    val newAddress: String = "",
    /** The server's day format, YYYY-MM-DD. */
    val movedOn: String = LocalDate.now().toString(),
    /** A forage key, [OTHER_FORAGE], or empty. */
    val forage: String = "",
    val otherForage: String = "",
    val note: String = "",
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val error: String? = null,
) {
    val allSelected: Boolean get() = hives.isNotEmpty() && selected.size == hives.size

    val canSubmit: Boolean
        get() {
            if (selected.isEmpty() || isSubmitting) return false
            return if (target == NEW_PLACE) newName.isNotBlank() else target.isNotEmpty()
        }

    /** The forage to send: a chosen key, the text typed under "other", or nothing. */
    val forageValue: String?
        get() = (if (forage == OTHER_FORAGE) otherForage.trim() else forage).ifEmpty { null }

    fun request(): MoveCreateRequest = MoveCreateRequest(
        hiveIds = hives.map { it.id }.filter { it in selected },
        toApiaryId = if (target == NEW_PLACE) null else target,
        newApiary = if (target == NEW_PLACE) NewApiaryForMove(newName.trim(), newAddress.trim().ifEmpty { null }) else null,
        movedOn = movedOn,
        forage = forageValue,
        note = note.trim().ifEmpty { null },
    )
}

@HiltViewModel
class MoveHivesViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val hiveRepo: HiveRepository,
    private val apiaryRepo: ApiaryRepository,
    private val moveRepo: MoveRepository,
) : ViewModel() {

    private val apiaryId = savedState.get<String>("apiaryId")!!
    private val _state = MutableStateFlow(MoveFormState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true) }
        val hives = runCatching { hiveRepo.listForApiary(apiaryId) }
        val apiaries = runCatching { apiaryRepo.list() }
        val targets = apiaries.getOrDefault(emptyList()).filter { a -> a.id != apiaryId && a.isOwner }
        val hiveList = hives.getOrDefault(emptyList())
        _state.update {
            it.copy(
                isLoading = false,
                hives = hiveList,
                targets = targets,
                error = (hives.exceptionOrNull() ?: apiaries.exceptionOrNull())?.message,
            )
        }
        // Only a shortcut: without the history the form works as it did.
        runCatching { moveRepo.overview(null, null) }.onSuccess { history ->
            val returns = MoveRoutes.returnSuggestions(history, hiveList.map { h -> h.id }, apiaryId, targets.map { a -> a.id to a.name })
            _state.update { it.copy(returns = returns) }
        }
    }

    /** Picks the hives and the place they came from; the day and forage stay for the beekeeper to confirm. */
    fun sendBack(suggestion: ReturnSuggestion) = _state.update {
        it.copy(selected = suggestion.hiveIds.toSet(), target = suggestion.apiaryId)
    }

    fun toggle(id: String) = _state.update {
        it.copy(selected = if (id in it.selected) it.selected - id else it.selected + id)
    }

    fun toggleAll() = _state.update {
        it.copy(selected = if (it.allSelected) emptySet() else it.hives.map { h -> h.id }.toSet())
    }

    fun setTarget(value: String) = _state.update { it.copy(target = value) }
    fun setNewName(value: String) = _state.update { it.copy(newName = value) }
    fun setNewAddress(value: String) = _state.update { it.copy(newAddress = value) }
    fun setMovedOn(value: String) = _state.update { it.copy(movedOn = value) }
    fun setForage(value: String) = _state.update { it.copy(forage = value) }
    fun setOtherForage(value: String) = _state.update { it.copy(otherForage = value) }
    fun setNote(value: String) = _state.update { it.copy(note = value) }
    fun clearError() = _state.update { it.copy(error = null) }

    /** [onMoved] runs once the server took the move; a refusal shows its reason and keeps the form. */
    fun submit(onMoved: (MoveResultOut) -> Unit) {
        val current = _state.value
        if (!current.canSubmit) return
        _state.update { it.copy(isSubmitting = true, error = null) }
        viewModelScope.launch {
            runCatching { moveRepo.move(current.request()) }
                .onSuccess { result ->
                    _state.update { it.copy(isSubmitting = false) }
                    onMoved(result)
                }
                // The server words the reason (only the owner may move, nothing to move, ...) in the user's language.
                .onFailure { e -> _state.update { it.copy(isSubmitting = false, error = e.message) } }
        }
    }
}

// ── Where a hive has stood ────────────────────────────────────────────────────────────────────

data class HiveMovesState(
    val moves: List<HiveMoveOut> = emptyList(),
    val routes: List<MoveRoute> = emptyList(),
    val loaded: Boolean = false,
)

@HiltViewModel
class HiveMovesViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val repo: MoveRepository,
) : ViewModel() {

    private val hiveId = savedState.get<String>("hiveId")!!
    private val _state = MutableStateFlow(HiveMovesState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        // The history is a nicety on the hive page: failing to load it reads as "no moves", not as an error.
        val moves = runCatching { repo.movesFor(hiveId) }.getOrDefault(emptyList())
        _state.update { HiveMovesState(moves, MoveRoutes.build(moves), loaded = true) }
    }
}

// ── The map of all journeys ───────────────────────────────────────────────────────────────────

data class MovesOverviewState(
    val moves: List<HiveMoveOut> = emptyList(),
    val routes: List<MoveRoute> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    /** YYYY-MM-DD, or null for no limit. */
    val from: String? = null,
    val to: String? = null,
)

@HiltViewModel
class MovesOverviewViewModel @Inject constructor(private val repo: MoveRepository) : ViewModel() {

    private val _state = MutableStateFlow(MovesOverviewState())
    val state = _state.asStateFlow()

    init { load() }

    fun setRange(from: String?, to: String?) {
        _state.update { it.copy(from = from, to = to) }
        load()
    }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        val range = _state.value
        runCatching { repo.overview(range.from, range.to) }
            .onSuccess { moves ->
                _state.update { it.copy(isLoading = false, moves = moves, routes = MoveRoutes.build(moves)) }
            }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}
