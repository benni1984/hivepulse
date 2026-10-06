package com.hivepulse.app.ui.sharing

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.data.api.IncomingShareOut
import com.hivepulse.app.data.api.ShareOut
import com.hivepulse.app.data.repository.ShareTarget
import com.hivepulse.app.data.repository.SharingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

// ── The owner's view: who works on one apiary or hive ─────────────────────────────────────────

data class SharingState(
    val shares: List<ShareOut> = emptyList(),
    val isLoading: Boolean = false,
    val isInviting: Boolean = false,
    /** Set after an invitation went out, so the screen can say so. */
    val inviteSent: Boolean = false,
    val error: String? = null,
)

@HiltViewModel
class SharingViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val repo: SharingRepository,
) : ViewModel() {

    private val id = savedState.get<String>("id")!!
    val isHive = savedState.get<String>("type") == "hive"
    private val target: ShareTarget = if (isHive) ShareTarget.Hive(id) else ShareTarget.Apiary(id)

    private val _state = MutableStateFlow(SharingState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true) }
        runCatching { repo.shares(target) }
            .onSuccess { list -> _state.update { it.copy(isLoading = false, shares = list) } }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    /** Sends the invitation; [onSent] runs when the server took it, so the screen can clear the field. */
    fun invite(email: String, onSent: () -> Unit = {}) {
        val address = email.trim()
        if (!looksLikeAnEmail(address) || _state.value.isInviting) return
        _state.update { it.copy(isInviting = true, error = null, inviteSent = false) }
        viewModelScope.launch {
            runCatching { repo.invite(address, target) }
                .onSuccess { share ->
                    _state.update { it.copy(isInviting = false, inviteSent = true, shares = listOf(share) + it.shares) }
                    onSent()
                }
                // The server words the reason (already invited, your own address, ...) in the user's language.
                .onFailure { e -> _state.update { it.copy(isInviting = false, error = e.message) } }
        }
    }

    fun remove(share: ShareOut) = viewModelScope.launch {
        _state.update { it.copy(error = null) }
        runCatching { repo.remove(share.id) }
            .onSuccess { _state.update { s -> s.copy(shares = s.shares.filterNot { it.id == share.id }) } }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }

    companion object {
        /** Spares an obvious typo a round trip; the server checks the address properly. */
        fun looksLikeAnEmail(text: String): Boolean {
            val trimmed = text.trim()
            val at = trimmed.indexOf('@')
            if (at <= 0 || trimmed.contains(' ')) return false
            val domain = trimmed.substring(at + 1)
            return domain.contains('.') && !domain.endsWith('.') && !domain.startsWith('.')
        }
    }
}

// ── Invitations waiting for the signed-in person ──────────────────────────────────────────────

data class InvitationsState(
    val invitations: List<IncomingShareOut> = emptyList(),
    val error: String? = null,
    /** What was pasted is not an invitation link; the screen words it. */
    val linkInvalid: Boolean = false,
)

@HiltViewModel
class InvitationsViewModel @Inject constructor(private val repo: SharingRepository) : ViewModel() {

    private val _state = MutableStateFlow(InvitationsState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        // The list of apiaries is usable without this; a failure here must not look like an error on it.
        val list = runCatching { repo.incoming() }.getOrDefault(emptyList())
        _state.update { it.copy(invitations = list) }
    }

    /** [onAccepted] runs once the server took it, so the caller can reload what became visible. */
    fun accept(invitation: IncomingShareOut, onAccepted: () -> Unit = {}) = viewModelScope.launch {
        _state.update { it.copy(error = null) }
        runCatching { repo.accept(invitation.id) }
            .onSuccess {
                _state.update { s -> s.copy(invitations = s.invitations.filterNot { it.id == invitation.id }) }
                onAccepted()
            }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    /**
     * Takes an invitation from the link in its email (or the bare token); [onRedeemed] runs once the
     * server accepted it, so the caller can reload what became visible.
     */
    fun redeem(pasted: String, onRedeemed: () -> Unit = {}) {
        _state.update { it.copy(error = null, linkInvalid = false) }
        val token = InvitationLink.token(pasted)
        if (token == null) {
            _state.update { it.copy(linkInvalid = true) }
            return
        }
        viewModelScope.launch {
            runCatching { repo.acceptByToken(token) }
                .onSuccess { onRedeemed() }
                .onFailure { e -> _state.update { it.copy(error = e.message) } }
        }
    }

    fun decline(invitation: IncomingShareOut) = viewModelScope.launch {
        _state.update { it.copy(error = null) }
        runCatching { repo.decline(invitation.id) }
            .onSuccess { _state.update { s -> s.copy(invitations = s.invitations.filterNot { it.id == invitation.id }) } }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null, linkInvalid = false) }
}
