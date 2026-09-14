package com.hivepulse.app.ui.auth

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.R
import com.hivepulse.app.data.repository.AuthRepository
import com.hivepulse.app.ui.common.ErrorBanner
import com.hivepulse.app.ui.theme.Amber500
import com.hivepulse.app.ui.theme.Stone50
import com.hivepulse.app.ui.theme.Stone500
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.io.IOException
import javax.inject.Inject

data class ForgotPasswordState(
    val isLoading: Boolean = false,
    val sent: Boolean = false,
    val offline: Boolean = false
)

@HiltViewModel
class ForgotPasswordViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val repo: AuthRepository
) : ViewModel() {

    /** Pre-filled from whatever was typed on the login screen. */
    val initialEmail: String = savedState.get<String>("email").orEmpty()

    private val _state = MutableStateFlow(ForgotPasswordState())
    val state = _state.asStateFlow()

    fun submit(email: String) = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, offline = false) }
        runCatching { repo.forgotPassword(email.trim()) }
            .onSuccess { _state.update { it.copy(isLoading = false, sent = true) } }
            .onFailure { e ->
                // Only a missing connection is surfaced. Any server answer shows the same "sent" message,
                // so the screen never reveals whether an address is registered — same as the web.
                if (e is IOException) _state.update { it.copy(isLoading = false, offline = true) }
                else _state.update { it.copy(isLoading = false, sent = true) }
            }
    }

    fun clearError() = _state.update { it.copy(offline = false) }
}

@Composable
fun ForgotPasswordScreen(
    onBack: () -> Unit,
    vm: ForgotPasswordViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    var email by rememberSaveable { mutableStateOf(vm.initialEmail) }

    Box(
        modifier = Modifier.fillMaxSize().background(Stone50),
        contentAlignment = Alignment.Center,
    ) {
        Card(
            modifier  = Modifier.fillMaxWidth().padding(24.dp),
            shape     = MaterialTheme.shapes.extraLarge,
            colors    = CardDefaults.cardColors(containerColor = Color.White),
            border    = BorderStroke(1.dp, Color(0xFFE7E5E4)),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        ) {
            Column(
                modifier = Modifier.padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                HivePulseHexIcon(size = 48)
                Spacer(Modifier.height(16.dp))
                Text(
                    stringResource(R.string.forgot_title),
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.SemiBold),
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(8.dp))

                if (state.sent) {
                    Text(
                        stringResource(R.string.forgot_sent),
                        style = MaterialTheme.typography.bodyMedium,
                        color = Stone500,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(Modifier.height(24.dp))
                    Button(
                        onClick  = onBack,
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape    = MaterialTheme.shapes.medium,
                    ) { Text(stringResource(R.string.forgot_back_to_login), style = MaterialTheme.typography.titleMedium) }
                } else {
                    Text(
                        stringResource(R.string.forgot_desc),
                        style = MaterialTheme.typography.bodyMedium,
                        color = Stone500,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(Modifier.height(24.dp))
                    OutlinedTextField(
                        value = email, onValueChange = { email = it },
                        label = { Text(stringResource(R.string.field_email)) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Done),
                        singleLine = true, modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.medium,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Amber500,
                            focusedLabelColor  = Amber500,
                        ),
                    )
                    if (state.offline) {
                        Spacer(Modifier.height(8.dp))
                        ErrorBanner(stringResource(R.string.forgot_offline)) { vm.clearError() }
                    }
                    Spacer(Modifier.height(20.dp))
                    Button(
                        onClick  = { vm.submit(email) },
                        enabled  = email.trim().contains('@') && !state.isLoading,
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape    = MaterialTheme.shapes.medium,
                    ) {
                        if (state.isLoading)
                            CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary)
                        else Text(stringResource(R.string.forgot_submit), style = MaterialTheme.typography.titleMedium)
                    }
                    Spacer(Modifier.height(8.dp))
                    TextButton(onClick = onBack) {
                        Text(stringResource(R.string.forgot_back_to_login), style = MaterialTheme.typography.bodySmall, color = Stone500)
                    }
                }
            }
        }
    }
}
