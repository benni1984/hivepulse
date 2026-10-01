package com.hivepulse.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface CacheDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun putApiaries(items: List<CachedApiary>)

    @Query("SELECT * FROM cached_apiaries ORDER BY id")
    suspend fun apiaries(): List<CachedApiary>

    @Query("SELECT * FROM cached_apiaries WHERE id = :id")
    suspend fun apiary(id: String): CachedApiary?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun putHives(items: List<CachedHive>)

    @Query("SELECT * FROM cached_hives WHERE apiaryId = :apiaryId ORDER BY id")
    suspend fun hivesForApiary(apiaryId: String): List<CachedHive>

    @Query("SELECT * FROM cached_hives WHERE id = :id")
    suspend fun hive(id: String): CachedHive?

    @Query("SELECT * FROM cached_hives WHERE qrToken = :token")
    suspend fun hiveByQrToken(token: String): CachedHive?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun putInspections(items: List<CachedInspection>)

    @Query("SELECT * FROM cached_inspections WHERE hiveId = :hiveId ORDER BY date DESC")
    suspend fun inspectionsForHive(hiveId: String): List<CachedInspection>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun putFieldDefinitions(items: List<CachedFieldDefinition>)

    @Query("SELECT * FROM cached_field_definitions WHERE apiaryId IS :apiaryId ORDER BY id")
    suspend fun fieldDefinitions(apiaryId: String?): List<CachedFieldDefinition>

    /** Signing out must not leave another account's data on the device. */
    @Query("DELETE FROM cached_apiaries")
    suspend fun clearApiaries()

    @Query("DELETE FROM cached_hives")
    suspend fun clearHives()

    @Query("DELETE FROM cached_inspections")
    suspend fun clearInspections()

    @Query("DELETE FROM cached_field_definitions")
    suspend fun clearFieldDefinitions()
}

@Dao
interface PendingInspectionDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun put(item: PendingInspection)

    @Query("SELECT * FROM pending_inspections ORDER BY createdAt")
    suspend fun all(): List<PendingInspection>

    @Query("SELECT * FROM pending_inspections WHERE hiveId = :hiveId ORDER BY createdAt")
    suspend fun forHive(hiveId: String): List<PendingInspection>

    /** Drives the "waiting to upload" hint in the UI. */
    @Query("SELECT COUNT(*) FROM pending_inspections")
    fun countFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM pending_inspections")
    suspend fun count(): Int

    @Query("DELETE FROM pending_inspections WHERE clientId = :clientId")
    suspend fun delete(clientId: String)

    @Query("UPDATE pending_inspections SET attempts = attempts + 1, lastError = :error WHERE clientId = :clientId")
    suspend fun recordFailure(clientId: String, error: String?)

    @Query("DELETE FROM pending_inspections")
    suspend fun clear()
}
