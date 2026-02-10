package com.campus.connect.data.network

import com.campus.connect.data.model.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import javax.inject.Inject

class ApiService @Inject constructor(
    private val client: HttpClient
) {
    // Deployed on Vercel - works from anywhere!
    private val baseUrl = "https://iq-backend.vercel.app/api"

    suspend fun login(userId: String, password: String): LoginResponse {
        return try {
            client.post("$baseUrl/auth/login") {
                contentType(ContentType.Application.Json)
                setBody(LoginRequest(userId, password))
            }.body()
        } catch (e: Exception) {
            LoginResponse(
                success = false,
                message = "Network error: ${e.message}"
            )
        }
    }

    suspend fun getStudentProfile(studentId: String, token: String): User {
        return client.get("$baseUrl/student/profile/$studentId") {
            header("Authorization", "Bearer $token")
        }.body()
    }

    suspend fun getStudentAttendance(studentId: String, token: String): AttendanceHistory {
        return client.get("$baseUrl/student/attendance/$studentId") {
            header("Authorization", "Bearer $token")
        }.body()
    }

    suspend fun getTeacherProfile(teacherId: String, token: String): User {
        return client.get("$baseUrl/teacher/profile/$teacherId") {
            header("Authorization", "Bearer $token")
        }.body()
    }

    suspend fun getTeacherStudents(token: String, department: String? = null): List<Student> {
        return client.get("$baseUrl/teacher/students") {
            header("Authorization", "Bearer $token")
            department?.let { parameter("department", it) }
        }.body()
    }

    suspend fun getDepartmentStats(token: String): List<DepartmentStats> {
        return client.get("$baseUrl/teacher/stats/department") {
            header("Authorization", "Bearer $token")
        }.body()
    }

    suspend fun changePassword(
        userId: String,
        oldPassword: String,
        newPassword: String,
        token: String
    ): ChangePasswordResponse {
        return try {
            client.post("$baseUrl/auth/change-password") {
                header("Authorization", "Bearer $token")
                contentType(ContentType.Application.Json)
                setBody(ChangePasswordRequest(userId, oldPassword, newPassword))
            }.body()
        } catch (e: Exception) {
            ChangePasswordResponse(
                success = false,
                message = "Failed to change password: ${e.message}"
            )
        }
    }

    suspend fun sendAiMessage(message: String): com.campus.connect.data.repository.AiResponse {
        return try {
            println("🔵 ApiService: Sending to $baseUrl/ai/chat")
            println("🔵 ApiService: Message = $message")
            
            val response: com.campus.connect.data.repository.AiResponse = client.post("$baseUrl/ai/chat") {
                contentType(ContentType.Application.Json)
                setBody(mapOf("message" to message))
            }.body()
            
            println("🔵 ApiService: Response = $response")
            response
        } catch (e: Exception) {
            println("🔴 ApiService Error: ${e.message}")
            e.printStackTrace()
            com.campus.connect.data.repository.AiResponse(
                success = false,
                error = "Network error: ${e.message}"
            )
        }
    }
}
