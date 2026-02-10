package com.campus.gateverification.viewmodel

import android.content.Context
import android.util.Log
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.campus.gateverification.data.VerificationResult
import com.campus.gateverification.domain.FaceDetectionUseCase
import com.campus.gateverification.domain.VerificationUseCase
import com.campus.gateverification.network.ApiService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import javax.inject.Inject

data class VerificationUiState(
    val isProcessing: Boolean = false,
    val verificationResult: VerificationResult? = null,
    val error: String? = null,
    val attendanceMarked: Boolean = false,
    val attendanceMessage: String? = null
)

@HiltViewModel
class VerificationViewModel @Inject constructor(
    private val faceDetectionUseCase: FaceDetectionUseCase,
    private val verificationUseCase: VerificationUseCase,
    private val apiService: ApiService
) : ViewModel() {

    companion object {
        private const val TAG = "VerificationViewModel"
    }

    private val _uiState = MutableStateFlow(VerificationUiState())
    val uiState: StateFlow<VerificationUiState> = _uiState

    private var imageCapture: ImageCapture? = null

    fun startCamera(previewView: PreviewView, context: Context) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)

        cameraProviderFuture.addListener({
            try {
                val cameraProvider = cameraProviderFuture.get()

                val preview = Preview.Builder()
                    .build()
                    .also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                imageCapture = ImageCapture.Builder()
                    .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                    .setTargetRotation(previewView.display.rotation)
                    .build()

                val imageAnalyzer = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .setTargetRotation(previewView.display.rotation)
                    .build()
                    .also {
                        it.setAnalyzer(
                            java.util.concurrent.Executors.newSingleThreadExecutor(),
                            faceDetectionUseCase.createAnalyzer { isLive ->
                                // Only verify if:
                                // 1. Face is detected (isLive)
                                // 2. Not currently processing
                                // 3. No verification result is showing (student details not displayed)
                                // 4. No attendance has been marked
                                // 5. No error is showing
                                val currentState = _uiState.value
                                val shouldVerify = isLive && 
                                    !currentState.isProcessing && 
                                    currentState.verificationResult == null &&
                                    !currentState.attendanceMarked &&
                                    currentState.error == null
                                
                                if (shouldVerify) {
                                    captureAndVerify()
                                }
                            }
                        )
                    }

                val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA

                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    context as LifecycleOwner,
                    cameraSelector,
                    preview,
                    imageCapture,
                    imageAnalyzer
                )
            } catch (e: Exception) {
                android.util.Log.e("VerificationViewModel", "Camera initialization failed", e)
                _uiState.value = _uiState.value.copy(error = e.message)
            }

        }, ContextCompat.getMainExecutor(context))
    }

    private fun captureAndVerify() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isProcessing = true, error = null)

            try {
                // Add timeout for verification (10 seconds)
                val result = withTimeout(10000) {
                    verificationUseCase.verify(imageCapture)
                }

                // Check if verification was successful
                if (result.verified && result.confidence > 0.0) {
                    // Show student details
                    _uiState.value = _uiState.value.copy(
                        isProcessing = false,
                        verificationResult = result,
                        error = null
                    )
                } else {
                    // Show not found message
                    _uiState.value = _uiState.value.copy(
                        isProcessing = false,
                        verificationResult = null,
                        error = result.message ?: "Student not found"
                    )
                    
                    // Auto-reset after 3 seconds
                    kotlinx.coroutines.delay(3000)
                    resetState()
                }
            } catch (e: kotlinx.coroutines.TimeoutCancellationException) {
                // Timeout - show not found
                _uiState.value = _uiState.value.copy(
                    isProcessing = false,
                    verificationResult = null,
                    error = "Student not found - verification timeout"
                )
                
                // Auto-reset after 3 seconds
                kotlinx.coroutines.delay(3000)
                resetState()
            } catch (e: Exception) {
                // Other errors
                _uiState.value = _uiState.value.copy(
                    isProcessing = false,
                    verificationResult = null,
                    error = "Verification failed: ${e.message}"
                )
                
                // Auto-reset after 3 seconds
                kotlinx.coroutines.delay(3000)
                resetState()
            }
        }
    }

    fun markAttendance() {
        val result = _uiState.value.verificationResult
        if (result == null || !result.verified) return

        viewModelScope.launch {
            try {
                Log.d(TAG, "=== Marking Attendance ===")
                Log.d(TAG, "Student ID: ${result.studentId}")
                Log.d(TAG, "Student Name: ${result.name}")
                Log.d(TAG, "Confidence: ${result.confidence}")
                
                _uiState.value = _uiState.value.copy(isProcessing = true)

                val response = apiService.markAttendance(result.studentId, result.confidence)

                Log.d(TAG, "Attendance API Response:")
                Log.d(TAG, "  Success: ${response.success}")
                Log.d(TAG, "  Message: ${response.message}")
                
                if (response.success) {
                    Log.d(TAG, "✓ Attendance marked successfully in database")
                } else {
                    Log.w(TAG, "⚠ Attendance marking failed: ${response.message}")
                }

                _uiState.value = _uiState.value.copy(
                    isProcessing = false,
                    attendanceMarked = response.success,
                    attendanceMessage = response.message
                )

                // Reset after 3 seconds to allow next student
                Log.d(TAG, "Waiting 3 seconds before resetting for next student...")
                kotlinx.coroutines.delay(3000)
                Log.d(TAG, "Resetting state - ready for next verification")
                resetState()

            } catch (e: Exception) {
                Log.e(TAG, "Failed to mark attendance", e)
                _uiState.value = _uiState.value.copy(
                    isProcessing = false,
                    error = "Failed to mark attendance: ${e.message}"
                )
                
                // Reset after 3 seconds
                kotlinx.coroutines.delay(3000)
                resetState()
            }
        }
    }

    fun resetState() {
        _uiState.value = VerificationUiState()
    }
    
    fun cancelVerification() {
        // Immediately reset to allow next verification
        resetState()
    }
}
