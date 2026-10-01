package com.hivepulse.app.data.local

import com.google.gson.Gson
import com.hivepulse.app.data.api.ApiaryOut
import com.hivepulse.app.data.api.FieldDefinitionOut
import com.hivepulse.app.data.api.HiveOut
import com.hivepulse.app.data.api.InspectionOut
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Reads and writes the local copies the repositories fall back to.
 *
 * Objects are stored as the JSON the API returned: the cache then needs no schema change
 * when a DTO gains a field, which matters because a schema change would have to migrate
 * the queued inspections living in the same database.
 */
@Singleton
class OfflineCache @Inject constructor(
    private val dao: CacheDao,
    private val gson: Gson,
) {
    private fun now() = System.currentTimeMillis()

    suspend fun putApiaries(items: List<ApiaryOut>) =
        dao.putApiaries(items.map { CachedApiary(it.id, gson.toJson(it), now()) })

    suspend fun apiaries(): List<ApiaryOut> =
        dao.apiaries().map { gson.fromJson(it.json, ApiaryOut::class.java) }

    suspend fun apiary(id: String): ApiaryOut? =
        dao.apiary(id)?.let { gson.fromJson(it.json, ApiaryOut::class.java) }

    suspend fun putHives(apiaryId: String, items: List<HiveOut>) =
        dao.putHives(items.map { CachedHive(it.id, apiaryId, it.qrToken, gson.toJson(it), now()) })

    suspend fun putHive(hive: HiveOut) =
        dao.putHives(listOf(CachedHive(hive.id, hive.apiaryId, hive.qrToken, gson.toJson(hive), now())))

    suspend fun hiveByQrToken(token: String): HiveOut? =
        dao.hiveByQrToken(token)?.let { gson.fromJson(it.json, HiveOut::class.java) }

    suspend fun hivesForApiary(apiaryId: String): List<HiveOut> =
        dao.hivesForApiary(apiaryId).map { gson.fromJson(it.json, HiveOut::class.java) }

    suspend fun hive(id: String): HiveOut? =
        dao.hive(id)?.let { gson.fromJson(it.json, HiveOut::class.java) }

    suspend fun putInspections(hiveId: String, items: List<InspectionOut>) =
        dao.putInspections(items.map { CachedInspection(it.id, hiveId, it.date, gson.toJson(it), now()) })

    suspend fun inspectionsForHive(hiveId: String): List<InspectionOut> =
        dao.inspectionsForHive(hiveId).map { gson.fromJson(it.json, InspectionOut::class.java) }

    suspend fun putFieldDefinitions(apiaryId: String?, items: List<FieldDefinitionOut>) =
        dao.putFieldDefinitions(items.map { CachedFieldDefinition(it.id, apiaryId, gson.toJson(it), now()) })

    suspend fun fieldDefinitions(apiaryId: String?): List<FieldDefinitionOut> =
        dao.fieldDefinitions(apiaryId).map { gson.fromJson(it.json, FieldDefinitionOut::class.java) }

    /** Called on sign-out: another account must not see these rows. */
    suspend fun clear() {
        dao.clearApiaries()
        dao.clearHives()
        dao.clearInspections()
        dao.clearFieldDefinitions()
    }
}

/**
 * True for the failures that mean "no usable connection right now" — those are the ones
 * worth answering from the cache or queueing. An HTTP 404 or 401 is a real answer from
 * the server and must keep surfacing as an error.
 */
fun Throwable.isOffline(): Boolean =
    this is IOException || cause is IOException
