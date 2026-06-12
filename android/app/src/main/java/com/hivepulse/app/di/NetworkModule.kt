package com.hivepulse.app.di

import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.RefreshRequest
import com.hivepulse.app.data.local.TokenStore
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import dagger.Lazy
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import okhttp3.logging.HttpLoggingInterceptor
import com.hivepulse.app.BuildConfig
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides @Singleton
    fun provideGson(): Gson = GsonBuilder().create()

    @Provides @Singleton
    fun provideOkHttpClient(tokenStore: TokenStore, apiService: Lazy<ApiService>): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor { chain ->
                val req = tokenStore.accessToken
                    ?.let { chain.request().newBuilder().header("Authorization", "Bearer $it").build() }
                    ?: chain.request()
                chain.proceed(req)
            }
            .authenticator(object : Authenticator {
                override fun authenticate(route: Route?, response: Response): Request? {
                    if (response.code != 401) return null
                    val refresh = tokenStore.refreshToken ?: return null
                    val newToken = runBlocking {
                        try { apiService.get().refresh(RefreshRequest(refresh)).accessToken }
                        catch (e: Exception) { null }
                    } ?: return null
                    tokenStore.accessToken = newToken
                    return response.request.newBuilder().header("Authorization", "Bearer $newToken").build()
                }
            })
            .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY })
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
