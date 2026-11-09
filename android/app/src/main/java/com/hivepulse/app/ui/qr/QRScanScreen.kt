package com.hivepulse.app.ui.qr

import android.Manifest
import android.util.Size
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.hivepulse.app.R
import com.hivepulse.app.ui.common.ErrorBanner
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.accompanist.permissions.shouldShowRationale
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import androidx.camera.core.ExperimentalGetImage
import java.util.concurrent.Executors

/**
 * The aiming frame and the line that says what to aim at, drawn over the camera image.
 *
 * This used to be a `Surface` with `alpha = 0f` and an empty body (#424): it sat in the right
 * place in the composition and drew nothing, so the scan screen showed a bare camera picture
 * from the first release until now. With gloves, in the sun, at the side of a hive, the frame
 * is the whole affordance -- and the five help pages had been captioning a picture of it for
 * just as long.
 *
 * It takes no camera and no permission, which is what makes it testable on its own.
 */
@Composable
fun ScanViewfinder(modifier: Modifier = Modifier) {
    Column(
        modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        val description = stringResource(R.string.scan_viewfinder)
        Box(
            Modifier
                .size(240.dp)
                .border(
                    width = 3.dp,
                    color = MaterialTheme.colorScheme.primary,
                    shape = RoundedCornerShape(20.dp),
                )
                .semantics { contentDescription = description }
        )
        Spacer(Modifier.height(24.dp))
        Text(
            text = stringResource(R.string.scan_instruction),
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
            color = Color.White,
            modifier = Modifier
                // A scrim, not a brand surface: the text sits on whatever the camera happens
                // to be looking at, so it has to carry its own contrast.
                .background(Color.Black.copy(alpha = 0.55f), RoundedCornerShape(12.dp))
                .padding(horizontal = 16.dp, vertical = 12.dp),
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun QRScanScreen(
    onHiveFound: (String) -> Unit,
    onUnlinked: (String) -> Unit,
    onBack: () -> Unit,
    vm: QRScanViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    val cameraPermission = rememberPermissionState(Manifest.permission.CAMERA)

    Scaffold(topBar = {
        TopAppBar(
            title = { Text(stringResource(R.string.screen_scan_qr)) },
            navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } }
        )
    }) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when {
                cameraPermission.status.isGranted -> {
                    CameraPreview(
                        onQRDetected = { raw ->
                            if (!state.isLoading) {
                                vm.resolve(raw, onLinked = onHiveFound, onUnlinked = onUnlinked)
                            }
                        }
                    )
                    if (state.isLoading) {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    }
                    state.error?.let {
                        Box(Modifier.align(Alignment.BottomCenter).padding(16.dp)) {
                            ErrorBanner(it) { vm.clearError() }
                        }
                    }
                    ScanViewfinder()
                }
                cameraPermission.status.shouldShowRationale -> {
                    Column(
                        Modifier.fillMaxSize().padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(stringResource(R.string.permission_camera_rationale))
                        Spacer(Modifier.height(16.dp))
                        Button(onClick = { cameraPermission.launchPermissionRequest() }) {
                            Text(stringResource(R.string.action_grant_permission))
                        }
                    }
                }
                else -> {
                    LaunchedEffect(Unit) { cameraPermission.launchPermissionRequest() }
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            }
        }
    }
}

@androidx.annotation.OptIn(ExperimentalGetImage::class)
@Composable
private fun CameraPreview(onQRDetected: (String) -> Unit) {
    val context       = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val executor      = remember { Executors.newSingleThreadExecutor() }
    val scanner       = remember { BarcodeScanning.getClient() }
    var lastScanned   by remember { mutableStateOf("") }

    AndroidView(
        factory = { ctx ->
            val previewView = PreviewView(ctx)
            val providerFuture = ProcessCameraProvider.getInstance(ctx)
            providerFuture.addListener({
                val provider = providerFuture.get()
                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }
                val analysis = ImageAnalysis.Builder()
                    .setTargetResolution(Size(1280, 720))
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()

                analysis.setAnalyzer(executor) { imageProxy ->
                    val mediaImage = imageProxy.image
                    if (mediaImage != null) {
                        val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                        scanner.process(image)
                            .addOnSuccessListener { barcodes ->
                                barcodes.firstOrNull { it.format == Barcode.FORMAT_QR_CODE }
                                    ?.rawValue
                                    ?.let { raw ->
                                        if (raw != lastScanned) {
                                            lastScanned = raw
                                            onQRDetected(raw)
                                        }
                                    }
                            }
                            .addOnCompleteListener { imageProxy.close() }
                    } else {
                        imageProxy.close()
                    }
                }

                try {
                    provider.unbindAll()
                    provider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview, analysis)
                } catch (_: Exception) { }
            }, ContextCompat.getMainExecutor(ctx))
            previewView
        },
        modifier = Modifier.fillMaxSize()
    )
}
