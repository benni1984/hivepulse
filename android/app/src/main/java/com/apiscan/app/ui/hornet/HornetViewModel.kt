package com.apiscan.app.ui.hornet

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.apiscan.app.data.api.*
import com.apiscan.app.data.repository.HornetRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HornetState(
    val stats: HornetStats? = null,
    val nests: HornetNestGeoJSON? = null,
    val sightings: List<HornetSightingOut> = emptyList(),
    val sightingsPage: Int = 1,
    val sightingsPages: Int = 1,
    val isLoading: Boolean = false,
    val error: String? = null,
    // Traps
    val currentTrap: HornetTrapOut? = null,
    val nearbyTraps: List<HornetTrapNearbyOut> = emptyList(),
    val trapLoading: Boolean = false,
    val trapError: String? = null,
    val trapSuccess: String? = null
)

@HiltViewModel
class HornetViewModel @Inject constructor(private val repo: HornetRepository) : ViewModel() {

    private val _state = MutableStateFlow(HornetState())
    val state = _state.asStateFlow()

    // MARK: - Load

    fun loadStats() = viewModelScope.launch {
        runCatching { repo.getStats() }
            .onSuccess { s -> _state.update { it.copy(stats = s) } }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun loadNests() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.getNests() }
            .onSuccess { n -> _state.update { it.copy(isLoading = false, nests = n) } }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun loadSightings(page: Int = 1) = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.getSightings(page) }
            .onSuccess { result ->
                val updated = if (page == 1) result.items else _state.value.sightings + result.items
                _state.update {
                    it.copy(
                        isLoading = false,
                        sightings = updated,
                        sightingsPage = result.page,
                        sightingsPages = result.pages
                    )
                }
            }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    // MARK: - Submit

    fun submitCatch(
        count: Int,
        latitude: Double? = null,
        longitude: Double? = null,
        reporterName: String? = null,
        onSuccess: () -> Unit = {}
    ) = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.submitCatch(count, latitude, longitude, reporterName) }
            .onSuccess { _state.update { it.copy(isLoading = false) }; onSuccess() }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun submitNest(
        latitude: Double,
        longitude: Double,
        notes: String? = null,
        photoUrl: String? = null,
        reporterName: String? = null,
        onSuccess: () -> Unit = {}
    ) = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.submitNest(latitude, longitude, notes, photoUrl, reporterName) }
            .onSuccess { _state.update { it.copy(isLoading = false) }; onSuccess() }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun submitSighting(
        photoUrl: String,
        description: String? = null,
        latitude: Double? = null,
        longitude: Double? = null,
        reporterName: String? = null,
        onSuccess: () -> Unit = {}
    ) = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.submitSighting(photoUrl, description, latitude, longitude, reporterName) }
            .onSuccess { sighting ->
                _state.update { it.copy(isLoading = false, sightings = listOf(sighting) + it.sightings) }
                onSuccess()
            }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun vote(sightingId: String, vote: String) = viewModelScope.launch {
        runCatching { repo.vote(sightingId, vote) }
            .onSuccess { loadSightings(1) }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }

    // MARK: - Traps

    fun loadNearbyTraps(lat: Double, lon: Double, radiusM: Int = 50) = viewModelScope.launch {
        _state.update { it.copy(trapLoading = true, trapError = null) }
        runCatching { repo.getNearbyTraps(lat, lon, radiusM) }
            .onSuccess { traps -> _state.update { it.copy(trapLoading = false, nearbyTraps = traps) } }
            .onFailure { e -> _state.update { it.copy(trapLoading = false, trapError = e.message) } }
    }

    fun loadTrap(accessCode: String) = viewModelScope.launch {
        _state.update { it.copy(trapLoading = true, trapError = null) }
        runCatching { repo.getTrap(accessCode) }
            .onSuccess { trap -> _state.update { it.copy(trapLoading = false, currentTrap = trap) } }
            .onFailure { e -> _state.update { it.copy(trapLoading = false, trapError = e.message) } }
    }

    fun createTrap(
        name: String,
        latitude: Double,
        longitude: Double,
        notes: String? = null,
        ownerName: String? = null,
        onSuccess: (HornetTrapOut) -> Unit = {}
    ) = viewModelScope.launch {
        _state.update { it.copy(trapLoading = true, trapError = null, trapSuccess = null) }
        runCatching { repo.createTrap(name, latitude, longitude, notes, ownerName) }
            .onSuccess { trap ->
                _state.update { it.copy(trapLoading = false, trapSuccess = "Trap registered!") }
                onSuccess(trap)
            }
            .onFailure { e -> _state.update { it.copy(trapLoading = false, trapError = e.message) } }
    }

    fun addTrapCatch(
        accessCode: String,
        count: Int,
        caughtOn: String,
        onSuccess: () -> Unit = {}
    ) = viewModelScope.launch {
        _state.update { it.copy(trapLoading = true, trapError = null, trapSuccess = null) }
        runCatching { repo.addTrapCatch(accessCode, count, caughtOn) }
            .onSuccess {
                _state.update { it.copy(trapLoading = false, trapSuccess = "Catch saved!") }
                // Refresh trap detail
                runCatching { repo.getTrap(accessCode) }
                    .onSuccess { updated -> _state.update { it.copy(currentTrap = updated) } }
                onSuccess()
            }
            .onFailure { e -> _state.update { it.copy(trapLoading = false, trapError = e.message) } }
    }

    fun setCurrentTrap(trap: com.apiscan.app.data.api.HornetTrapOut) =
        _state.update { it.copy(currentTrap = trap) }

    fun clearTrapState() = _state.update { it.copy(currentTrap = null, nearbyTraps = emptyList(),
        trapError = null, trapSuccess = null) }
}
