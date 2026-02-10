package com.campus.gateverification.di

import com.campus.gateverification.network.ApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import io.ktor.client.*
import io.ktor.client.engine.android.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideHttpClient(): HttpClient {
        return HttpClient(Android) {
            install(ContentNegotiation) {
                json(Json {
                    ignoreUnknownKeys = true
                    isLenient = true
                    prettyPrint = true
                    coerceInputValues = true
                    encodeDefaults = true
                    explicitNulls = false
                    allowSpecialFloatingPointValues = true
                })
            }
            install(HttpTimeout) {
                requestTimeoutMillis = 30000  // 30 seconds
                connectTimeoutMillis = 30000  // 30 seconds
                socketTimeoutMillis = 30000   // 30 seconds
            }
        }
    }

    @Provides
    @Singleton
    fun provideApiService(client: HttpClient): ApiService {
        return ApiService(client)
    }
}
