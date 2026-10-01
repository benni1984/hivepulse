package com.hivepulse.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Local copies of what a beekeeper needs at the apiary, where there is often no signal:
 * the apiaries, their hives, the inspections already recorded and the custom field
 * definitions the inspection form renders.
 *
 * The server stays the source of truth — every successful request refreshes these rows,
 * and they are only read when the request fails.
 */
@Entity(tableName = "cached_apiaries")
data class CachedApiary(
    @PrimaryKey val id: String,
    val json: String,
    val cachedAt: Long,
)

@Entity(tableName = "cached_hives")
data class CachedHive(
    @PrimaryKey val id: String,
    val apiaryId: String,
    /** Lets a scanned QR code find its hive while offline. */
    val qrToken: String,
    val json: String,
    val cachedAt: Long,
)

@Entity(tableName = "cached_inspections")
data class CachedInspection(
    @PrimaryKey val id: String,
    val hiveId: String,
    val date: String,
    val json: String,
    val cachedAt: Long,
)

@Entity(tableName = "cached_field_definitions")
data class CachedFieldDefinition(
    @PrimaryKey val id: String,
    /** null for the user-wide definitions, otherwise the apiary they belong to. */
    val apiaryId: String?,
    val json: String,
    val cachedAt: Long,
)

/**
 * An inspection recorded without a connection. [clientId] goes to the server with every
 * attempt, so a retry after a timeout returns the stored inspection instead of creating
 * a second one.
 */
@Entity(tableName = "pending_inspections")
data class PendingInspection(
    @PrimaryKey val clientId: String,
    val hiveId: String,
    val requestJson: String,
    val createdAt: Long,
    val attempts: Int = 0,
    val lastError: String? = null,
)
