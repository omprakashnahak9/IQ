package com.campus.connect.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "user_preferences")

class UserPreferences(private val context: Context) {
    
    companion object {
        private val USER_ID = stringPreferencesKey("user_id")
        private val USER_TYPE = stringPreferencesKey("user_type")
        private val FULL_NAME = stringPreferencesKey("full_name")
        private val EMAIL = stringPreferencesKey("email")
        private val TOKEN = stringPreferencesKey("token")
        private val IS_LOGGED_IN = booleanPreferencesKey("is_logged_in")
    }

    val userIdFlow: Flow<String?> = context.dataStore.data.map { it[USER_ID] }
    val userTypeFlow: Flow<String?> = context.dataStore.data.map { it[USER_TYPE] }
    val fullNameFlow: Flow<String?> = context.dataStore.data.map { it[FULL_NAME] }
    val emailFlow: Flow<String?> = context.dataStore.data.map { it[EMAIL] }
    val tokenFlow: Flow<String?> = context.dataStore.data.map { it[TOKEN] }
    val isLoggedInFlow: Flow<Boolean> = context.dataStore.data.map { it[IS_LOGGED_IN] ?: false }

    suspend fun saveUserSession(
        userId: String,
        userType: String,
        fullName: String,
        email: String,
        token: String
    ) {
        context.dataStore.edit { preferences ->
            preferences[USER_ID] = userId
            preferences[USER_TYPE] = userType
            preferences[FULL_NAME] = fullName
            preferences[EMAIL] = email
            preferences[TOKEN] = token
            preferences[IS_LOGGED_IN] = true
        }
    }

    suspend fun clearUserSession() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }

    suspend fun getToken(): String? {
        var token: String? = null
        context.dataStore.data.map { it[TOKEN] }.collect { token = it }
        return token
    }
}
