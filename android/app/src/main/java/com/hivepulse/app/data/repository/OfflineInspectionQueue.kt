package com.hivepulse.app.data.repository

import com.google.gson.Gson
import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.InspectionCreateRequest
import com.hivepulse.app.data.api.InspectionOut
import com.hivepulse.app.data.local.PendingInspection
import com.hivepulse.app.data.local.PendingInspectionDao
import com.hivepulse.app.data.local.isOffline
import kotlinx.coroutines.flow.Flow
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/** Prefix of the id a queued inspection carries until the server assigns a real one. */
const val PENDING_ID_PREFIX = "pending:"

fun InspectionOut.isPending(): Boolean = id.startsWith(PENDING_ID_PREFIX)

/**
 * Inspections recorded at the apiary without a connection.
 *
 * The queue is the reason an inspection is never lost: the entry is written before any
 * network attempt, carries a client_id so a retry cannot duplicate the visit on the
 * server, and is only removed once the server confirmed it.
 */
@Singleton
class OfflineInspectionQueue @Inject constructor(
    private val api: ApiService,
    private val dao: PendingInspectionDao,
    private val gson: Gson,
) {
    fun pendingCount(): Flow<Int> = dao.countFlow()

    suspend fun count(): Int = dao.count()

    suspend fun pendingForHive(hiveId: String): List<InspectionOut> =
        dao.forHive(hiveId).map { it.asInspection() }

    /** Stores the entry, then tries once. Returns the server's inspection or the queued one. */
    suspend fun submit(hiveId: String, request: InspectionCreateRequest): InspectionOut {
        val withId = request.copy(clientId = request.clientId ?: UUID.randomUUID().toString())
        val entry = PendingInspection(
            clientId = withId.clientId!!,
            hiveId = hiveId,
            requestJson = gson.toJson(withId),
            createdAt = System.currentTimeMillis(),
        )
        dao.put(entry)
        return try {
            val saved = api.createInspection(hiveId, withId)
            dao.delete(entry.clientId)
            saved
        } catch (e: Throwable) {
            if (!e.isOffline()) {
                // A rejection from the server (validation, deleted hive, expired session)
                // will not pass on a retry — surface it instead of queueing silently.
                dao.delete(entry.clientId)
                throw e
            }
            entry.asInspection()
        }
    }

    /**
     * Sends everything that is waiting. Returns the number still queued afterwards, so the
     * worker can ask to be retried.
     */
    suspend fun flush(): Int {
        for (entry in dao.all()) {
            val request = gson.fromJson(entry.requestJson, InspectionCreateRequest::class.java)
            try {
                api.createInspection(entry.hiveId, request)
                dao.delete(entry.clientId)
            } catch (e: Throwable) {
                if (e.isOffline()) {
                    dao.recordFailure(entry.clientId, e.message)
                    break // still no connection — the rest will not fare better
                }
                // The server refused this entry; keeping it would block the queue forever.
                dao.recordFailure(entry.clientId, e.message)
                dao.delete(entry.clientId)
            }
        }
        return dao.count()
    }

    suspend fun clear() = dao.clear()

    private fun PendingInspection.asInspection(): InspectionOut {
        val request = gson.fromJson(requestJson, InspectionCreateRequest::class.java)
        return InspectionOut(
            id = PENDING_ID_PREFIX + clientId,
            hiveId = hiveId,
            date = request.date,
            queenSeen = request.queenSeen,
            queenColor = request.queenColor,
            broodFrames = request.broodFrames,
            honeyFrames = request.honeyFrames,
            mood = request.mood,
            populationStrength = request.populationStrength,
            varroaLevel = request.varroaLevel,
            varroaCount = null,
            swarmCellsSeen = request.swarmCellsSeen,
            treatmentApplied = request.treatmentApplied,
            feedingDone = request.feedingDone,
            feedingType = request.feedingType,
            weightKg = request.weightKg,
            notes = request.notes,
            customFields = request.customFields,
            clientId = clientId,
            createdAt = java.time.Instant.ofEpochMilli(createdAt).toString(),
        )
    }
}
