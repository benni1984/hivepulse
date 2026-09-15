package com.hivepulse.app.ui.qr

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hivepulse.app.R
import com.hivepulse.app.data.api.QrTokenOut
import com.hivepulse.app.ui.common.ErrorBanner
import com.hivepulse.app.ui.common.LoadingScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QRBatchDetailScreen(
    batchId: String,
    onBack: () -> Unit,
    vm: QRBatchDetailViewModel = hiltViewModel()
) {
    val state   = vm.state.collectAsState().value
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    // Open the saved PDF right away; the snackbar says where it went and lets the user reopen it later
    LaunchedEffect(state.downloaded) {
        val file = state.downloaded ?: return@LaunchedEffect
        val opened = file.uri != null && context.openPdf(file.uri)
        val saved  = context.getString(R.string.qr_pdf_saved, file.name)
        val result = snackbarHostState.showSnackbar(
            message     = if (file.uri != null && !opened) "$saved\n${context.getString(R.string.qr_pdf_no_viewer)}" else saved,
            actionLabel = if (opened) context.getString(R.string.qr_pdf_open) else null,
            duration    = SnackbarDuration.Long
        )
        if (result == SnackbarResult.ActionPerformed && file.uri != null) context.openPdf(file.uri)
        vm.clearDownloaded()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.screen_batch_detail)) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } },
                actions = {
                    state.batch?.let {
                        IconButton(onClick = { vm.downloadPdf() }, enabled = !state.isDownloading) {
                            Icon(Icons.Default.Download, contentDescription = stringResource(R.string.action_download_pdf))
                        }
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        when {
            state.batch == null && state.error != null -> Column(Modifier.padding(padding).padding(top = 8.dp)) {
                ErrorBanner(state.error)
            }
            state.isLoading || state.batch == null -> LoadingScreen()
            else -> {
                val batch = state.batch
                LazyColumn(Modifier.padding(padding)) {
                    state.error?.let { item { ErrorBanner(it) { vm.clearError() } } }

                    item {
                        Card(Modifier.fillMaxWidth().padding(16.dp)) {
                            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(stringResource(R.string.label_batch_id, batch.id.take(8)), style = MaterialTheme.typography.titleMedium)
                                Text(stringResource(R.string.label_created, batch.createdAt.take(10)), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                val linkedCount = batch.tokens.count { it.isLinked }
                                Text(stringResource(R.string.label_linked_of, linkedCount, batch.count), style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }

                    item {
                        Row(
                            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(stringResource(R.string.label_qr_tokens), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
                            Spacer(Modifier.weight(1f))
                            OutlinedButton(onClick = { vm.downloadPdf() }, enabled = !state.isDownloading) {
                                if (state.isDownloading) {
                                    CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                                } else {
                                    Icon(Icons.Default.Download, null, Modifier.size(16.dp))
                                }
                                Spacer(Modifier.width(4.dp))
                                Text(stringResource(R.string.action_download_pdf))
                            }
                        }
                    }

                    items(batch.tokens) { token ->
                        QrTokenRow(token)
                        HorizontalDivider()
                    }

                    item { Spacer(Modifier.height(24.dp)) }
                }
            }
        }
    }
}

@Composable
private fun QrTokenRow(token: QrTokenOut) {
    ListItem(
        headlineContent  = { Text(token.token.take(12) + "…", style = MaterialTheme.typography.bodyMedium) },
        supportingContent = {
            if (token.isLinked) {
                Text(stringResource(R.string.label_token_linked), color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.bodySmall)
            } else {
                Text(stringResource(R.string.label_token_unlinked), color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
            }
        }
    )
}

/** Opens a downloaded PDF in the user's viewer app; false if none is installed. */
private fun Context.openPdf(uri: String): Boolean = try {
    startActivity(
        Intent(Intent.ACTION_VIEW)
            .setDataAndType(Uri.parse(uri), "application/pdf")
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
    )
    true
} catch (e: ActivityNotFoundException) {
    false
}
