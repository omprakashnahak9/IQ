package com.campus.gateverification.domain

import android.content.Context
import android.util.Log
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.core.content.ContextCompat
import com.campus.gateverification.data.VerificationResult
import com.campus.gateverification.network.ApiService
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.File
import javax.inject.Inject
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class VerificationUseCase @Inject constructor(
    private val apiService: ApiService,
    @ApplicationContext private val context: Context
) {
    companion object {
        private const val TAG = "VerificationUseCase"
    }

    suspend fun verify(imageCapture: ImageCapture?): VerificationResult {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Starting verification process...")
                
                if (imageCapture == null) {
                    Log.e(TAG, "ImageCapture is null")
                    return@withContext VerificationResult(
                        verified = false,
                        message = "Camera not initialized"
                    )
                }

                Log.d(TAG, "Creating temp file for image...")
                val photoFile = File.createTempFile("face", ".jpg", context.cacheDir)
                val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

                Log.d(TAG, "Capturing image...")
                // Capture image using suspendCancellableCoroutine
                suspendCancellableCoroutine<File> { continuation ->
                    imageCapture.takePicture(
                        outputOptions,
                        ContextCompat.getMainExecutor(context),
                        object : ImageCapture.OnImageSavedCallback {
                            override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                                Log.d(TAG, "Image captured successfully: ${photoFile.absolutePath}")
                                continuation.resume(photoFile)
                            }

                            override fun onError(exc: ImageCaptureException) {
                                Log.e(TAG, "Image capture failed", exc)
                                continuation.resumeWithException(exc)
                            }
                        }
                    )
                }

                Log.d(TAG, "Sending image to API for verification...")
                Log.d(TAG, "Image file size: ${photoFile.length()} bytes")
                
                // Send to API for verification
                val result = apiService.verifyFace(photoFile)
                
                Log.d(TAG, "API Response - Verified: ${result.verified}, Name: ${result.name}")
                
                // Clean up temp file
                photoFile.delete()
                Log.d(TAG, "Temp file deleted")
                
                result
            } catch (e: Exception) {
                Log.e(TAG, "Verification failed with exception", e)
                Log.e(TAG, "Exception type: ${e.javaClass.simpleName}")
                Log.e(TAG, "Exception message: ${e.message}")
                e.printStackTrace()
                
                VerificationResult(
                    verified = false,
                    message = "Error: ${e.javaClass.simpleName} - ${e.message}"
                )
            }
        }
    }
}
