package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.*
import com.hivepulse.app.data.local.OfflineCache
import com.hivepulse.app.data.local.isOffline
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ApiaryRepository @Inject constructor(
    private val api: ApiService,
    private val cache: OfflineCache,
) {

    /** Network first; the cached list is what keeps the app usable at the apiary. */
    suspend fun list(): List<ApiaryOut> = try {
        api.listApiaries().items.also { cache.putApiaries(it) }
    } catch (e: Throwable) {
        if (e.isOffline()) cache.apiaries().ifEmpty { throw e } else throw e
    }

    suspend fun get(id: String): ApiaryOut = try {
        api.getApiary(id).also { cache.putApiaries(listOf(it)) }
    } catch (e: Throwable) {
        if (e.isOffline()) cache.apiary(id) ?: throw e else throw e
    }

    suspend fun create(name: String, description: String?, latitude: Double?, longitude: Double?, address: String?, isPublic: Boolean = false): ApiaryOut =
        api.createApiary(ApiaryCreate(name, description, latitude, longitude, address, isPublic))

    suspend fun update(id: String, name: String, description: String?, latitude: Double?, longitude: Double?, address: String?, isPublic: Boolean = false): ApiaryOut =
        api.updateApiary(id, ApiaryCreate(name, description, latitude, longitude, address, isPublic))

    suspend fun delete(id: String) {
        val response = api.deleteApiary(id)
        if (!response.isSuccessful) {
            throw RuntimeException(if (response.code() == 409) "has_hives" else "delete_failed_${response.code()}")
        }
    }

    suspend fun fieldDefinitions(apiaryId: String): List<FieldDefinitionOut> = try {
        api.listApiaryFieldDefinitions(apiaryId).also { cache.putFieldDefinitions(apiaryId, it) }
    } catch (e: Throwable) {
        if (e.isOffline()) cache.fieldDefinitions(apiaryId) else throw e
    }

    suspend fun createFieldDefinition(apiaryId: String, body: FieldDefinitionCreate): FieldDefinitionOut =
        api.createApiaryFieldDefinition(apiaryId, body)
}
