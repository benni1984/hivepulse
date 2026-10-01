package com.hivepulse.app.di

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Gson lives in its own module on purpose: instrumented tests replace [NetworkModule] to
 * mock the API, and the offline cache and queue still need to serialize — a Gson provider
 * inside NetworkModule disappears with it and breaks every instrumented test's graph.
 */
@Module
@InstallIn(SingletonComponent::class)
object SerializationModule {

    @Provides @Singleton
    fun provideGson(): Gson = GsonBuilder().create()
}
