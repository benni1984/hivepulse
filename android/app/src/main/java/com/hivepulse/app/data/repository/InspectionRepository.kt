package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.*
import com.hivepulse.app.data.local.OfflineCache
import com.hivepulse.app.data.local.isOffline
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InspectionRepository @Inject constructor(
    private val api: ApiService,
    private val cache: OfflineCache,
    private val queue: OfflineInspectionQueue,
) {

    /**
     * The list a beekeeper sees at the hive: what the server knows, plus what is still
     * waiting to be uploaded — an inspection recorded minutes ago must not disappear.
     */
    suspend fun list(hiveId: String, page: Int = 1): PaginatedResponse<InspectionOut> {
        val pending = if (page == 1) queue.pendingForHive(hiveId) else emptyList()
        return try {
            val response = api.listInspections(hiveId, page)
            cache.putInspections(hiveId, response.items)
            response.copy(items = pending + response.items, total = response.total + pending.size)
        } catch (e: Throwable) {
            if (!e.isOffline()) throw e
            val cached = cache.inspectionsForHive(hiveId)
            if (cached.isEmpty() && pending.isEmpty()) throw e
            val items = pending + cached
            PaginatedResponse(items = items, total = items.size, page = 1, pages = 1)
        }
    }

    /** Never fails for a missing connection: the visit is queued and uploaded later. */
    suspend fun create(hiveId: String, request: InspectionCreateRequest): InspectionOut =
        queue.submit(hiveId, request)

    suspend fun update(id: String, request: InspectionCreateRequest): InspectionOut =
        api.updateInspection(id, request)

    suspend fun delete(id: String) { api.deleteInspection(id) }

    suspend fun listFieldDefinitions(): List<FieldDefinitionOut> = try {
        api.listFieldDefinitions().also { cache.putFieldDefinitions(null, it) }
    } catch (e: Throwable) {
        if (e.isOffline()) cache.fieldDefinitions(null) else throw e
    }
}
