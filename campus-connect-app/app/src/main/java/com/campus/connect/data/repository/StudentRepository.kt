package com.campus.connect.data.repository

import com.campus.connect.data.local.UserPreferences
import com.campus.connect.data.model.AttendanceHistory
import com.campus.connect.data.model.User
import com.campus.connect.data.network.ApiService
import javax.inject.Inject

class StudentRepository @Inject constructor(
    private val apiService: ApiService,
    private val userPreferences: UserPreferences
) {
    suspend fun getProfile(studentId: String): User {
        val token = userPreferences.getToken() ?: throw Exception("No token found")
        return apiService.getStudentProfile(studentId, token)
    }

    suspend fun getAttendanceHistory(studentId: String): AttendanceHistory {
        val token = userPreferences.getToken() ?: throw Exception("No token found")
        return apiService.getStudentAttendance(studentId, token)
    }

    suspend fun changePassword(userId: String, oldPassword: String, newPassword: String): Boolean {
        val token = userPreferences.getToken() ?: throw Exception("No token found")
        val response = apiService.changePassword(userId, oldPassword, newPassword, token)
        return response.success
    }
}
