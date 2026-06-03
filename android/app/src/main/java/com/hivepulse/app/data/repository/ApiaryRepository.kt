package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ApiaryRepository @Inject constructor(private val api: ApiService) {

    suspend fun list(): List<ApiaryOut> = api.listApiaries().items

    suspend fun get(id: String): ApiaryOut = api.getApiary(id)

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

    suspend fun fieldDefinitions(apiaryId: String): List<FieldDefinitionOut> =
        api.listApiaryFieldDefinitions(apiaryId)

    suspend fun createFieldDefinition(apiaryId: String, body: FieldDefinitionCreate): FieldDefinitionOut =
        api.createApiaryFieldDefinition(apiaryId, body)
}
