package com.hivepulse.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.data.api.UserOut
import com.hivepulse.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull
import javax.inject.Inject

data class AuthUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false,
    val user: UserOut? = null,
    /** The client id a Google sign-in must be requested with; null while the server has not
     *  been asked, or when it accepts none. The button waits for it. */
    val googleClientId: String? = null,
    /** False until the server has answered (or the wait ran out). "Not yet known" must not look
     *  like "none": the email form used to appear at once and then fold away behind its link
     *  the moment a provider turned up, which people saw as a flicker at every start. */
    val providersLoaded: Boolean = false,
)

internal const val PROVIDER_WAIT_MS = 4_000L

@HiltViewModel
class AuthViewModel @Inject constructor(private val repo: AuthRepository) : ViewModel() {

    private val _state = MutableStateFlow(AuthUiState())
    val state = _state.asStateFlow()

    fun login(email: String, password: String) = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.login(email, password) }
            .onSuccess { user -> _state.update { it.copy(isLoading = false, success = true, user = user) } }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message ?: e.cause?.message) } }
    }

    fun register(email: String, password: String, name: String, locale: String) = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.register(email, password, name, locale) }
            .onSuccess { user -> _state.update { it.copy(isLoading = false, success = true, user = user) } }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message ?: e.cause?.message) } }
    }

    fun signInWithGoogle(idToken: String) = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.signInWithGoogle(idToken) }
            .onSuccess { user -> _state.update { it.copy(isLoading = false, success = true, user = user) } }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message ?: e.cause?.message) } }
    }

    /** Asks the server what it accepts. Silence on failure: the password form is still
     *  there, and a button that cannot work is worse than no button. */
    fun loadSignInProviders() = viewModelScope.launch {
        // Bounded: the login form waits for this, and a server that never answers must not
        // leave the only way in hidden. The repository already turns a failure into null.
        val clientId = withTimeoutOrNull(PROVIDER_WAIT_MS) { repo.googleClientId() }
        _state.update { it.copy(googleClientId = clientId, providersLoaded = true) }
    }

    /** For failures that happen outside the repository — Google's sheet refusing, say. */
    fun showError(message: String?) =
        _state.update { it.copy(isLoading = false, error = message) }

    fun clearError() = _state.update { it.copy(error = null) }
}
