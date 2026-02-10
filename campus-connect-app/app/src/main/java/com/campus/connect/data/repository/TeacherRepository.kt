package com.campus.connect.data.repository

import com.campus.connect.data.local.UserPreferences
import com.campus.connect.data.model.DepartmentStats
import com.campus.connect.data.model.Student
import com.campus.connect.data.model.User
import com.campus.connect.data.network.ApiService
import javax.inject.Inject

class TeacherRepository @Inject constructor(
    private val apiService: ApiService,
    private val userPreferences: UserPreferences
) {
    suspend fun getProfile(teacherId: String): User {
        val token = userPreferences.getToken() ?: throw Exception("No token found")
        return apiService.getTeacherProfile(teacherId, token)
    }

    suspend fun getStudents(department: String? = null): List<Student> {
        val token = userPreferences.getToken() ?: throw Exception("No token found")
        return apiService.getTeacherStudents(token, department)
    }

    suspend fun getDepartmentStats(): List<DepartmentStats> {
        val token = userPreferences.getToken() ?: throw Exception("No token found")
        return apiService.getDepartmentStats(token)
    }

    suspend fun changePassword(userId: String, oldPassword: String, newPassword: String): Boolean {
        val token = userPreferences.getToken() ?: throw Exception("No token found")
        val response = apiService.changePassword(userId, oldPassword, newPassword, token)
        return response.success
    }
}
