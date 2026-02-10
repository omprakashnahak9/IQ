package com.campus.connect.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val userId: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val success: Boolean,
    val token: String? = null,
    val user: User? = null,
    val message: String? = null
)

@Serializable
data class User(
    @SerialName("user_id") val userId: String,
    @SerialName("user_type") val userType: String, // "student" or "teacher"
    @SerialName("full_name") val fullName: String,
    val email: String,
    val department: String? = null,
    val year: Int? = null,
    val designation: String? = null,
    val phone: String? = null,
    @SerialName("is_active") val isActive: Boolean = true
)

@Serializable
data class AttendanceRecord(
    val id: Int? = null,
    @SerialName("student_id") val studentId: String,
    val timestamp: String,
    val confidence: Double,
    val verified: Boolean,
    @SerialName("gate_location") val gateLocation: String? = null
)

@Serializable
data class AttendanceHistory(
    val records: List<AttendanceRecord>,
    val summary: AttendanceSummary
)

@Serializable
data class AttendanceSummary(
    val total: Int,
    val present: Int,
    val percentage: Double
)

@Serializable
data class Student(
    @SerialName("student_id") val studentId: String,
    val name: String,
    val email: String,
    val department: String? = null,
    val year: Int? = null,
    val phone: String? = null
)

@Serializable
data class DepartmentStats(
    val department: String,
    @SerialName("total_students") val totalStudents: Int,
    @SerialName("present_today") val presentToday: Int,
    val percentage: Double
)

@Serializable
data class ChangePasswordRequest(
    @SerialName("user_id") val userId: String,
    @SerialName("old_password") val oldPassword: String,
    @SerialName("new_password") val newPassword: String
)

@Serializable
data class ChangePasswordResponse(
    val success: Boolean,
    val message: String? = null
)
