package com.campus.connect.data.repository

import com.campus.connect.data.network.ApiService
import kotlinx.serialization.Serializable
import javax.inject.Inject

@Serializable
data class AiResponse(
    val success: Boolean,
    val message: String? = null,
    val error: String? = null
)

class StudyAssistantRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun sendMessage(message: String): AiResponse {
        return apiService.sendAiMessage(message)
    }
}
