package com.hivepulse.app.di

import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.local.TokenStore
import com.hivepulse.app.data.session.SessionAuthenticator
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import com.hivepulse.app.BuildConfig
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides @Singleton
    fun provideOkHttpClient(
        tokenStore: TokenStore,
        // Its own class now: an anonymous object here was unreachable for any test, and the
        // instrumented tests uninstall this module outright (#467).
        sessionAuthenticator: SessionAuthenticator,
    ): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor { chain ->
                // The server words its error messages in the language it is asked for, and a
                // message such as "this address was already invited" is shown to the user as it is.
                val builder = chain.request().newBuilder()
                    .header("Accept-Language", java.util.Locale.getDefault().language)
                tokenStore.accessToken?.let { builder.header("Authorization", "Bearer $it") }
                chain.proceed(builder.build())
            }
            .authenticator(sessionAuthenticator)
            .addInterceptor(HttpLoggingInterceptor().apply {
                // BODY logging includes the Authorization: Bearer header — never ship
                // that to Logcat in a release build.
                level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY else HttpLoggingInterceptor.Level.NONE
            })
            .build()

    @Provides @Singleton
    fun provideRetrofit(client: OkHttpClient, gson: Gson): Retrofit =
        Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()

    @Provides @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService =
        retrofit.create(ApiService::class.java)
}
