package com.hivepulse.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        CachedApiary::class,
        CachedHive::class,
        CachedInspection::class,
        CachedFieldDefinition::class,
        PendingInspection::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class OfflineDatabase : RoomDatabase() {
    abstract fun cacheDao(): CacheDao
    abstract fun pendingInspectionDao(): PendingInspectionDao

    companion object {
        fun build(context: Context): OfflineDatabase =
            Room.databaseBuilder(context, OfflineDatabase::class.java, "hivepulse-offline.db")
                // The cache can always be refetched; a queued inspection cannot, so a
                // schema change must migrate rather than wipe. Until there is a second
                // version there is nothing to migrate.
                .build()
    }
}
