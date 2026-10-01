package com.hivepulse.app.di

import android.content.Context
import androidx.work.WorkManager
import com.hivepulse.app.data.local.CacheDao
import com.hivepulse.app.data.local.OfflineDatabase
import com.hivepulse.app.data.local.PendingInspectionDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/** Local cache and upload queue. Instrumented tests replace this with an in-memory database. */
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides @Singleton
    fun provideDatabase(@ApplicationContext context: Context): OfflineDatabase =
        OfflineDatabase.build(context)

    @Provides @Singleton
    fun provideCacheDao(database: OfflineDatabase): CacheDao = database.cacheDao()

    @Provides @Singleton
    fun providePendingInspectionDao(database: OfflineDatabase): PendingInspectionDao =
        database.pendingInspectionDao()

    @Provides @Singleton
    fun provideWorkManager(@ApplicationContext context: Context): WorkManager =
        WorkManager.getInstance(context)
}
