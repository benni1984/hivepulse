package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.*
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Custom field definitions in either scope: `apiaryId == null` means the user's own fields
 * (all apiaries), otherwise fields that only apply inside that apiary.
 */
@Singleton
class FieldDefinitionRepository @Inject constructor(private val api: ApiService) {

    suspend fun list(apiaryId: String?): List<FieldDefinitionOut> =
        if (apiaryId == null) api.listFieldDefinitions() else api.listApiaryFieldDefinitions(apiaryId)

    suspend fun create(apiaryId: String?, body: FieldDefinitionCreate): FieldDefinitionOut =
        if (apiaryId == null) api.createFieldDefinition(body) else api.createApiaryFieldDefinition(apiaryId, body)

    suspend fun update(apiaryId: String?, id: String, body: FieldDefinitionUpdate): FieldDefinitionOut =
        if (apiaryId == null) api.updateFieldDefinition(id, body) else api.updateApiaryFieldDefinition(apiaryId, id, body)

    suspend fun delete(apiaryId: String?, id: String) {
        val response = if (apiaryId == null) api.deleteFieldDefinition(id) else api.deleteApiaryFieldDefinition(apiaryId, id)
        if (!response.isSuccessful) throw RuntimeException("delete_failed_${response.code()}")
    }
}
