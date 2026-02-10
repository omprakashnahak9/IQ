package com.campus.connect.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.campus.connect.data.repository.StudyAssistantRepository
import com.campus.connect.ui.student.ChatMessage
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class StudyAssistantUiState(
    val messages: List<ChatMessage> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val lastAiMessage: String? = null
)

@HiltViewModel
class StudyAssistantViewModel @Inject constructor(
    private val repository: StudyAssistantRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(StudyAssistantUiState())
    val uiState: StateFlow<StudyAssistantUiState> = _uiState

    fun sendMessage(text: String) {
        if (text.isBlank()) return
        
        viewModelScope.launch {
            // Add user message
            val userMessage = ChatMessage(text = text, isUser = true)
            _uiState.value = _uiState.value.copy(
                messages = _uiState.value.messages + userMessage,
                isLoading = true,
                error = null
            )
            
            try {
                // Get AI response
                println("🔵 Sending message to AI: $text")
                val response = repository.sendMessage(text)
                println("🔵 AI Response: success=${response.success}, message=${response.message}, error=${response.error}")
                
                if (response.success && response.message != null) {
                    val aiMessage = ChatMessage(text = response.message, isUser = false)
                    _uiState.value = _uiState.value.copy(
                        messages = _uiState.value.messages + aiMessage,
                        isLoading = false,
                        lastAiMessage = response.message
                    )
                } else {
                    val errorMsg = response.error ?: "Failed to get response"
                    println("🔴 AI Error: $errorMsg")
                    val errorMessage = ChatMessage(
                        text = "Sorry, I couldn't process that. Error: $errorMsg",
                        isUser = false
                    )
                    _uiState.value = _uiState.value.copy(
                        messages = _uiState.value.messages + errorMessage,
                        isLoading = false,
                        error = errorMsg
                    )
                }
            } catch (e: Exception) {
                println("🔴 Exception in sendMessage: ${e.message}")
                e.printStackTrace()
                val errorMessage = ChatMessage(
                    text = "Sorry, something went wrong: ${e.message}",
                    isUser = false
                )
                _uiState.value = _uiState.value.copy(
                    messages = _uiState.value.messages + errorMessage,
                    isLoading = false,
                    error = e.message ?: "An error occurred"
                )
            }
        }
    }

    fun clearChat() {
        _uiState.value = StudyAssistantUiState()
    }
}
