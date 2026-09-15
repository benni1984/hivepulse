package com.hivepulse.app.data.repository

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.hivepulse.app.data.api.ApiService
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject
import javax.inject.Singleton

/** A file written to the public Downloads folder. [uri] is an openable content URI on Android 10+, null before. */
data class SavedDownload(val name: String, val uri: String?)

@Singleton
class ExportRepository @Inject constructor(
    private val api: ApiService,
    @ApplicationContext private val context: Context,
) {
    suspend fun exportApiary(apiaryId: String, apiaryName: String, format: String): String = withContext(Dispatchers.IO) {
        val body = api.exportApiaryInspections(apiaryId, format)
        val safeName = apiaryName.replace(Regex("[^a-zA-Z0-9_-]"), "_")
        saveToDownloads(body.bytes(), "HivePulse_${safeName}_inspections.$format", mimeType(format)).name
    }

    suspend fun exportHive(hiveId: String, hiveName: String, format: String): String = withContext(Dispatchers.IO) {
        val body = api.exportHiveInspections(hiveId, format)
        val safeName = hiveName.replace(Regex("[^a-zA-Z0-9_-]"), "_")
        saveToDownloads(body.bytes(), "HivePulse_${safeName}_inspections.$format", mimeType(format)).name
    }

    /**
     * Fetches the printable QR batch PDF through the authenticated API client (so an expired access
     * token is refreshed) and saves it to Downloads. Replaces the old DownloadManager hand-off, which
     * bypassed the token refresh and gave no feedback when it failed.
     */
    suspend fun downloadQrBatchPdf(batchId: String): SavedDownload = withContext(Dispatchers.IO) {
        val body = api.downloadQrBatchPdf(batchId)
        saveToDownloads(body.bytes(), "HivePulse_QR_batch_${batchId.take(8)}.pdf", "application/pdf")
    }

    private fun mimeType(format: String) = if (format == "csv") "text/csv" else "application/json"

    private fun saveToDownloads(data: ByteArray, filename: String, mime: String): SavedDownload {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val values = ContentValues().apply {
                put(MediaStore.Downloads.DISPLAY_NAME, filename)
                put(MediaStore.Downloads.MIME_TYPE, mime)
                put(MediaStore.Downloads.IS_PENDING, 1)
            }
            val resolver = context.contentResolver
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                ?: error("MediaStore insert failed")
            resolver.openOutputStream(uri)!!.use { it.write(data) }
            values.clear()
            values.put(MediaStore.Downloads.IS_PENDING, 0)
            resolver.update(uri, values, null, null)
            SavedDownload(filename, uri.toString())
        } else {
            val dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            dir.mkdirs()
            val file = File(dir, filename)
            FileOutputStream(file).use { it.write(data) }
            SavedDownload(file.absolutePath, null)
        }
    }
}
