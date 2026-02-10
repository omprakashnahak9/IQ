package com.campus.connect.data.repository

import com.campus.connect.data.local.UserPreferences
import com.campus.connect.data.model.LoginResponse
import com.campus.connect.data.network.ApiService
import javax.inject.Inject

class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val userPreferences: UserPreferences
) {
    suspend fun login(userId: String, password: String): LoginResponse {
        val response = apiService.login(userId, password)
        
        if (response.success && response.user != null && response.token != null) {
            userPreferences.saveUserSession(
                userId = response.user.userId,
                userType = response.user.userType,
                fullName = response.user.fullName,
                email = response.user.email,
                token = response.token
            )
        }
        
        return response
    }

    suspend fun logout() {
        userPreferences.clearUserSession()
    }

    fun isLoggedIn() = userPreferences.isLoggedInFlow
    
    fun getUserType() = userPreferences.userTypeFlow
}
