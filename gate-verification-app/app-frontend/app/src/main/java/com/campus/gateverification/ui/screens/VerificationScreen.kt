package com.campus.gateverification.ui.screens

import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import com.campus.gateverification.viewmodel.VerificationViewModel

@Composable
fun VerificationScreen(
    viewModel: VerificationViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    
    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                PreviewView(ctx).apply {
                    viewModel.startCamera(this, context)
                }
            },
            modifier = Modifier.fillMaxSize()
        )
        
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(32.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            when {
                uiState.attendanceMarked -> {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "✓ Attendance Marked",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = uiState.attendanceMessage ?: "Success",
                                style = MaterialTheme.typography.bodyLarge
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "Ready for next student...",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                
                uiState.isProcessing && uiState.verificationResult != null -> {
                    // Marking attendance in progress
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                "Marking attendance...",
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.Medium
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "Please wait",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                
                uiState.error != null -> {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "Error",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.error,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = uiState.error ?: "Unknown error",
                                style = MaterialTheme.typography.bodySmall
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = { viewModel.cancelVerification() }) {
                                Text("Try Again")
                            }
                        }
                    }
                }
                
                uiState.isProcessing -> {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                "Verifying...",
                                style = MaterialTheme.typography.bodyLarge
                            )
                        }
                    }
                }
                
                uiState.verificationResult != null -> {
                    val result = uiState.verificationResult!!
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = if (result.verified) 
                                MaterialTheme.colorScheme.primaryContainer 
                            else 
                                MaterialTheme.colorScheme.errorContainer
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = if (result.verified) "✓ Student Verified" else "✗ Not Verified",
                                style = MaterialTheme.typography.headlineMedium,
                                fontWeight = FontWeight.Bold,
                                color = if (result.verified) 
                                    MaterialTheme.colorScheme.primary 
                                else 
                                    MaterialTheme.colorScheme.error
                            )
                            
                            if (result.verified) {
                                Spacer(modifier = Modifier.height(16.dp))
                                Divider()
                                Spacer(modifier = Modifier.height(16.dp))
                                
                                // Student Details
                                Column(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalAlignment = Alignment.Start
                                ) {
                                    DetailRow("Name:", result.name)
                                    DetailRow("Student ID:", result.studentId)
                                    result.department?.let { DetailRow("Department:", it) }
                                    result.year?.let { DetailRow("Year:", "$it") }
                                    DetailRow("Confidence:", "${(result.confidence * 100).toInt()}%")
                                }
                                
                                Spacer(modifier = Modifier.height(24.dp))
                                
                                // Check if attendance already marked
                                if (result.attendanceAlreadyMarked) {
                                    // Show already marked message
                                    Card(
                                        colors = CardDefaults.cardColors(
                                            containerColor = MaterialTheme.colorScheme.secondaryContainer
                                        ),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(16.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally
                                        ) {
                                            Text(
                                                "✓ Attendance Already Marked",
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = MaterialTheme.colorScheme.secondary
                                            )
                                            Spacer(modifier = Modifier.height(8.dp))
                                            Text(
                                                "Today's attendance recorded",
                                                style = MaterialTheme.typography.bodyMedium
                                            )
                                            result.attendanceTime?.let {
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    "Time: ${it.substring(11, 16)}",
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }
                                    
                                    Spacer(modifier = Modifier.height(16.dp))
                                    
                                    Button(
                                        onClick = { viewModel.cancelVerification() },
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text("Next Student")
                                    }
                                } else {
                                    // Show attendance button
                                    Button(
                                        onClick = { viewModel.markAttendance() },
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = MaterialTheme.colorScheme.primary
                                        )
                                    ) {
                                        Text(
                                            "Mark Attendance",
                                            style = MaterialTheme.typography.titleMedium,
                                            modifier = Modifier.padding(vertical = 8.dp)
                                        )
                                    }
                                    
                                    Spacer(modifier = Modifier.height(8.dp))
                                    
                                    OutlinedButton(
                                        onClick = { viewModel.cancelVerification() },
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text("Cancel")
                                    }
                                }
                            } else {
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    text = result.message ?: "Face not recognized",
                                    style = MaterialTheme.typography.bodyMedium
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Button(onClick = { viewModel.cancelVerification() }) {
                                    Text("Try Again")
                                }
                            }
                        }
                    }
                }
                
                else -> {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.8f)
                        )
                    ) {
                        Text(
                            "Position face in frame",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium
        )
    }
}
