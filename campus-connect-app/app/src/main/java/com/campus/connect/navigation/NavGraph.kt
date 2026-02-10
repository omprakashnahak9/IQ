package com.campus.connect.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.campus.connect.ui.auth.LoginScreen
import com.campus.connect.ui.student.StudentDashboard
import com.campus.connect.ui.student.StudyAssistantScreen
import com.campus.connect.ui.teacher.TeacherDashboard

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object StudentDashboard : Screen("student_dashboard")
    object TeacherDashboard : Screen("teacher_dashboard")
    object StudyAssistant : Screen("study_assistant")
}

@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = { userType ->
                    val destination = if (userType == "student") {
                        Screen.StudentDashboard.route
                    } else {
                        Screen.TeacherDashboard.route
                    }
                    navController.navigate(destination) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.StudentDashboard.route) {
            StudentDashboard(
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onNavigateToAssistant = {
                    navController.navigate(Screen.StudyAssistant.route)
                }
            )
        }

        composable(Screen.StudyAssistant.route) {
            StudyAssistantScreen(
                studentName = "Student" // Will be passed from dashboard
            )
        }

        composable(Screen.TeacherDashboard.route) {
            TeacherDashboard(
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}
