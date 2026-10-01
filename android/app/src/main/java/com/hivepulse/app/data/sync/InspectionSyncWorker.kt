package com.hivepulse.app.data.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.hivepulse.app.data.repository.OfflineInspectionQueue
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Uploads the inspections recorded without a connection.
 *
 * Runs when the device has a network again, survives app restarts, and backs off when the
 * connection is there but the server is not.
 */
@HiltWorker
class InspectionSyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val queue: OfflineInspectionQueue,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result = try {
        if (queue.flush() == 0) Result.success() else Result.retry()
    } catch (e: Throwable) {
        Result.retry()
    }

    companion object {
        const val WORK_NAME = "inspection-sync"
    }
}

/** Single place that knows how the upload is scheduled. */
@Singleton
class SyncScheduler @Inject constructor(private val workManager: WorkManager) {

    fun requestSync() {
        val request = OneTimeWorkRequestBuilder<InspectionSyncWorker>()
            .setConstraints(
                Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
            )
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()
        // KEEP: a queued upload already covers everything waiting, so a second request
        // while one is pending would only duplicate work.
        workManager.enqueueUniqueWork(
            InspectionSyncWorker.WORK_NAME, ExistingWorkPolicy.KEEP, request
        )
    }

    fun cancel() {
        workManager.cancelUniqueWork(InspectionSyncWorker.WORK_NAME)
    }
}
