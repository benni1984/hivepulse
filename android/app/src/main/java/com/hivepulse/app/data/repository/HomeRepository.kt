package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.HomeSummaryOut
import com.hivepulse.app.data.api.PlannedTreatmentOut
import com.hivepulse.app.data.api.TreatmentCreateRequest
import com.hivepulse.app.data.api.withServerMessage
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

/** What is to be done and what is coming up: the home summary, and the treatments planned for it. */
@Singleton
class HomeRepository @Inject constructor(private val api: ApiService) {
    suspend fun home(): HomeSummaryOut = withServerMessage { api.home() }
}

/** The treatments planned for a hive or an apiary. A refusal carries the server's own message. */
@Singleton
class TreatmentRepository @Inject constructor(private val api: ApiService) {

    suspend fun open(hiveId: String? = null, apiaryId: String? = null): List<PlannedTreatmentOut> =
        withServerMessage { api.treatments("open", hiveId, apiaryId) }

    suspend fun done(hiveId: String? = null, apiaryId: String? = null): List<PlannedTreatmentOut> =
        withServerMessage { api.treatments("done", hiveId, apiaryId) }

    suspend fun create(request: TreatmentCreateRequest): PlannedTreatmentOut =
        withServerMessage { api.createTreatment(request) }

    suspend fun markDone(id: String): PlannedTreatmentOut = withServerMessage { api.markTreatmentDone(id, emptyMap()) }

    suspend fun reopen(id: String): PlannedTreatmentOut = withServerMessage { api.reopenTreatment(id) }

    suspend fun delete(id: String) {
        val response: Response<Unit> = withServerMessage { api.deleteTreatment(id) }
        if (!response.isSuccessful) throw RuntimeException("HTTP ${response.code()}")
    }
}
