package com.campus.gateverification.domain

import android.util.Log
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import javax.inject.Inject

class FaceDetectionUseCase @Inject constructor() {

    private val options = FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
        .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
        .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
        .setMinFaceSize(0.15f)
        .build()

    private val detector = FaceDetection.getClient(options)

    @OptIn(ExperimentalGetImage::class)
    fun createAnalyzer(onLivenessDetected: (Boolean) -> Unit): ImageAnalysis.Analyzer {
        return ImageAnalysis.Analyzer { imageProxy ->
            processImage(imageProxy, onLivenessDetected)
        }
    }

    @ExperimentalGetImage
    private fun processImage(imageProxy: ImageProxy, onLivenessDetected: (Boolean) -> Unit) {
        val mediaImage = imageProxy.image
        if (mediaImage != null) {
            val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

            detector.process(image)
                .addOnSuccessListener { faces ->
                    val isLive = faces.isNotEmpty() && faces[0].let { face ->
                        val leftEyeOpen = face.leftEyeOpenProbability ?: 0f
                        val rightEyeOpen = face.rightEyeOpenProbability ?: 0f
                        leftEyeOpen > 0.5f && rightEyeOpen > 0.5f
                    }
                    onLivenessDetected(isLive)
                }
                .addOnFailureListener { e ->
                    Log.e("FaceDetection", "Face detection failed", e)
                    onLivenessDetected(false)
                }
                .addOnCompleteListener {
                    imageProxy.close()
                }
        } else {
            imageProxy.close()
        }
    }
}
