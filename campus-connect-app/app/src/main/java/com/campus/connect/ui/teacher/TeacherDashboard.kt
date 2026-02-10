package com.campus.connect.ui.teacher

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.campus.connect.ui.common.LoadingScreen
import com.campus.connect.ui.common.StatCard
import com.campus.connect.viewmodel.AuthViewModel
import com.campus.connect.viewmodel.TeacherViewModel
import com.campus.connect.viewmodel.TeacherUiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeacherDashboard(
    onLogout: () -> Unit,
    teacherViewModel: TeacherViewModel = hiltViewModel(),
    authViewModel: AuthViewModel = hiltViewModel()
) {
    val uiState by teacherViewModel.uiState.collectAsState()
    var selectedTab by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        teacherViewModel.loadDepartmentStats()
        teacherViewModel.loadStudents()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Teacher Dashboard") },
                actions = {
                    IconButton(onClick = {
                        authViewModel.logout()
                        onLogout()
                    }) {
                        Icon(Icons.Default.ExitToApp, "Logout")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            TabRow(selectedTabIndex = selectedTab) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Overview") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Students") }
                )
            }

            when (selectedTab) {
                0 -> OverviewTab(uiState, teacherViewModel)
                1 -> StudentsTab(uiState, teacherViewModel)
            }
        }
    }
}

@Composable
fun OverviewTab(
    uiState: TeacherUiState,
    viewModel: TeacherViewModel
) {
    if (uiState.isLoading) {
        LoadingScreen()
    } else {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(
                    text = "Department Statistics",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StatCard(
                        title = "Total Students",
                        value = uiState.departmentStats.sumOf { it.totalStudents }.toString(),
                        modifier = Modifier.weight(1f)
                    )
                    StatCard(
                        title = "Present Today",
                        value = uiState.departmentStats.sumOf { it.presentToday }.toString(),
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            item {
                val avgAttendance = if (uiState.departmentStats.isNotEmpty()) {
                    uiState.departmentStats.map { it.percentage }.average().toInt()
                } else 0
                
                StatCard(
                    title = "Average Attendance",
                    value = "$avgAttendance%",
                    subtitle = "Across all departments"
                )
            }

            item {
                Text(
                    text = "Department Breakdown",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }

            items(uiState.departmentStats) { stat ->
                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = stat.department,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${stat.presentToday} / ${stat.totalStudents} present",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Text(
                                text = "${stat.percentage.toInt()}%",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                color = when {
                                    stat.percentage >= 75 -> MaterialTheme.colorScheme.primary
                                    stat.percentage >= 50 -> MaterialTheme.colorScheme.tertiary
                                    else -> MaterialTheme.colorScheme.error
                                }
                            )
                        }
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        LinearProgressIndicator(
                            progress = (stat.percentage / 100.0).toFloat(),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentsTab(
    uiState: TeacherUiState,
    viewModel: TeacherViewModel
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedDepartment by remember { mutableStateOf<String?>(null) }

    if (uiState.isLoading) {
        LoadingScreen()
    } else {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Search and Filter
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Search students...") },
                    leadingIcon = { Icon(Icons.Default.Search, null) },
                    singleLine = true
                )

                // Department filter chips
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = selectedDepartment == null,
                        onClick = { selectedDepartment = null },
                        label = { Text("All") }
                    )
                    uiState.departmentStats.forEach { stat ->
                        FilterChip(
                            selected = selectedDepartment == stat.department,
                            onClick = { selectedDepartment = stat.department },
                            label = { Text(stat.department) }
                        )
                    }
                }
            }

            // Students list
            val filteredStudents = uiState.students.filter { student ->
                val matchesSearch = student.name.contains(searchQuery, ignoreCase = true) ||
                        student.studentId.contains(searchQuery, ignoreCase = true)
                val matchesDepartment = selectedDepartment == null || 
                        student.department == selectedDepartment
                matchesSearch && matchesDepartment
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    Text(
                        text = "${filteredStudents.size} students",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                items(filteredStudents) { student ->
                    Card(
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Default.Person,
                                    contentDescription = null,
                                    modifier = Modifier.size(40.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                                Column {
                                    Text(
                                        text = student.name,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Text(
                                        text = student.studentId,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = "${student.department} - Year ${student.year}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
