package com.hivepulse.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.data.api.UserOut
import com.hivepulse.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false,
    val user: UserOut? = null,
    /** The client id a Google sign-in must be requested with; null while the server has not
     *  been asked, or when it accepts none. The button waits for it. */
    val googleClientId: String? = null,
)

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
        _state.update { it.copy(googleClientId = repo.googleClientId()) }
    }

    /** For failures that happen outside the repository — Google's sheet refusing, say. */
    fun showError(message: String?) =
        _state.update { it.copy(isLoading = false, error = message) }

    fun clearError() = _state.update { it.copy(error = null) }
}
