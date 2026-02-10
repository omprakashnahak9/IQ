package com.campus.gateverification.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class VerificationResult(
    val verified: Boolean = false,
    @SerialName("student_id") val studentId: String = "",
    val name: String = "",
    val email: String? = null,
    val department: String? = null,
    val year: Int? = null,
    val confidence: Double = 0.0,
    val message: String? = null,
    val timestamp: String? = null,
    @SerialName("attendance_already_marked") val attendanceAlreadyMarked: Boolean = false,
    @SerialName("attendance_time") val attendanceTime: String? = null
)

@Serializable
data class AttendanceResponse(
    val success: Boolean,
    val message: String,
    val student: StudentInfo? = null,
    @SerialName("log_entry") val logEntry: LogEntry? = null,
    @SerialName("existing_entry") val existingEntry: LogEntry? = null
)

@Serializable
data class StudentInfo(
    @SerialName("student_id") val studentId: String,
    val name: String,
    val department: String? = null
)

@Serializable
data class LogEntry(
    val id: Int? = null,
    @SerialName("student_id") val studentId: String? = null,
    val timestamp: String? = null,
    val confidence: Double? = null,
    val verified: Boolean? = null,
    @SerialName("gate_location") val gateLocation: String? = null
)
