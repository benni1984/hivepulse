package com.hivepulse.app.ui.hives

import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.R
import com.hivepulse.app.data.repository.HiveRepository
import com.hivepulse.app.ui.common.ErrorBanner
import com.hivepulse.app.ui.common.LoadingScreen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HiveQRViewState(
    val hiveName: String = "",
    val qrPngBytes: ByteArray? = null,
    val isLoading: Boolean = true,
    val error: String? = null,
)

@HiltViewModel
class HiveQRViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val hiveRepo: HiveRepository,
) : ViewModel() {
    private val hiveId = savedState.get<String>("hiveId")!!
    private val _state = MutableStateFlow(HiveQRViewState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching {
            val hive = hiveRepo.get(hiveId)
            val png = hiveRepo.getQrPng(hiveId)
            _state.update { it.copy(isLoading = false, hiveName = hive.name, qrPngBytes = png) }
        }.onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HiveQRViewScreen(
    hiveId: String,
    onBack: () -> Unit,
    vm: HiveQRViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.screen_hive_qr)) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } }
            )
        }
    ) { padding ->
        when {
            state.isLoading -> LoadingScreen()
            else -> Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                state.error?.let { ErrorBanner(it) { vm.clearError() } }

                if (state.hiveName.isNotEmpty()) {
                    Text(state.hiveName, style = MaterialTheme.typography.titleLarge)
                    Spacer(Modifier.height(24.dp))
                }

                val bytes = state.qrPngBytes
                if (bytes != null) {
                    val bitmap = remember(bytes) {
                        BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                    }
                    if (bitmap != null) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                        ) {
                            Image(
                                bitmap = bitmap.asImageBitmap(),
                                contentDescription = stringResource(R.string.screen_hive_qr),
                                modifier = Modifier.size(250.dp).padding(16.dp),
                            )
                        }
                    }
                } else if (!state.isLoading && state.error == null) {
                    Icon(
                        Icons.Filled.QrCode,
                        contentDescription = null,
                        modifier = Modifier.size(100.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}
