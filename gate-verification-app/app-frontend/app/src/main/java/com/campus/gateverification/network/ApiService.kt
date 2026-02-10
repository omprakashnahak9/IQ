package com.campus.gateverification.network

import android.util.Log
import com.campus.gateverification.data.AttendanceResponse
import com.campus.gateverification.data.VerificationResult
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.client.request.forms.*
import io.ktor.http.*
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.io.File
import javax.inject.Inject

class ApiService @Inject constructor(
    private val client: HttpClient
) {
    companion object {
        private const val TAG = "ApiService"
    }
    
    // Local backend for gate verification (can access AI service)
    private val baseUrl = "http://10.122.185.39:3000"

    suspend fun verifyFace(imageFile: File): VerificationResult {
        return try {
            Log.d(TAG, "=== Starting Face Verification ===")
            Log.d(TAG, "Base URL: $baseUrl")
            Log.d(TAG, "Endpoint: $baseUrl/gate/verify")
            Log.d(TAG, "Image file: ${imageFile.absolutePath}")
            Log.d(TAG, "Image size: ${imageFile.length()} bytes")
            Log.d(TAG, "Image exists: ${imageFile.exists()}")
            
            val response = client.post("$baseUrl/gate/verify") {
                setBody(
                    MultiPartFormDataContent(
                        formData {
                            append("image", imageFile.readBytes(), Headers.build {
                                append(HttpHeaders.ContentType, "image/jpeg")
                                append(HttpHeaders.ContentDisposition, "filename=face.jpg")
                            })
                        }
                    )
                )
            }
            
            Log.d(TAG, "Response status: ${response.status}")
            Log.d(TAG, "Response headers: ${response.headers}")
            
            val result: VerificationResult = response.body()
            Log.d(TAG, "Parsed result - Verified: ${result.verified}, Name: ${result.name}")
            Log.d(TAG, "=== Verification Complete ===")
            
            result
        } catch (e: Exception) {
            Log.e(TAG, "=== Verification Failed ===")
            Log.e(TAG, "Exception type: ${e.javaClass.simpleName}")
            Log.e(TAG, "Exception message: ${e.message}")
            Log.e(TAG, "Stack trace:", e)
            
            // Return error result
            VerificationResult(
                verified = false,
                message = "Network error: ${e.message}"
            )
        }
    }

    suspend fun markAttendance(studentId: String, confidence: Double): AttendanceResponse {
        return try {
            Log.d(TAG, "=== Marking Attendance ===")
            Log.d(TAG, "Student ID: $studentId")
            Log.d(TAG, "Confidence: $confidence")
            
            val response = client.post("$baseUrl/gate/mark-attendance") {
                contentType(ContentType.Application.Json)
                setBody(buildJsonObject {
                    put("student_id", studentId)
                    put("confidence", confidence)
                    put("gate_location", "Main Gate")
                })
            }
            
            Log.d(TAG, "Response status: ${response.status}")
            val result: AttendanceResponse = response.body()
            Log.d(TAG, "Attendance result: ${result.success}, Message: ${result.message}")
            Log.d(TAG, "=== Attendance Complete ===")
            
            result
        } catch (e: Exception) {
            Log.e(TAG, "=== Attendance Failed ===")
            Log.e(TAG, "Exception: ${e.message}", e)
            
            AttendanceResponse(
                success = false,
                message = "Failed to mark attendance: ${e.message}"
            )
        }
    }
}
