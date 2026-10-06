package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class QrBatchRepository @Inject constructor(private val api: ApiService) {

    suspend fun list(): List<QrBatchSummary> = api.listQrBatches().items

    suspend fun get(id: String): QrBatchOut = api.getQrBatch(id)

    suspend fun create(count: Int): QrBatchOut = api.createQrBatch(QrBatchCreate(count))

    /** "in_use" when the server refuses because one of the batch's codes is attached to a hive. */
    suspend fun delete(id: String) {
        val response = api.deleteQrBatch(id)
        if (!response.isSuccessful) {
            throw RuntimeException(if (response.code() == 409) "in_use" else "delete_failed_${response.code()}")
        }
    }
}
