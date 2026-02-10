# Campus Connect - Student & Teacher App

A native Android application built with Kotlin and Jetpack Compose for students and teachers to access their attendance records and manage academic activities.

## Project Structure

```
campus-connect-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/campus/connect/
│   │   │   ├── data/              # Data layer
│   │   │   │   ├── model/         # Data models
│   │   │   │   ├── network/       # API service
│   │   │   │   ├── repository/    # Repository pattern
│   │   │   │   └── local/         # Local storage (DataStore)
│   │   │   ├── di/                # Dependency Injection (Hilt)
│   │   │   ├── ui/
│   │   │   │   ├── auth/          # Login screen
│   │   │   │   ├── student/       # Student-specific UI
│   │   │   │   │   ├── StudentDashboard.kt
│   │   │   │   │   ├── AttendanceHistory.kt
│   │   │   │   │   └── StudentProfile.kt
│   │   │   │   ├── teacher/       # Teacher-specific UI
│   │   │   │   │   ├── TeacherDashboard.kt
│   │   │   │   │   ├── StudentList.kt
│   │   │   │   │   └── AttendanceReports.kt
│   │   │   │   ├── common/        # Shared UI components
│   │   │   │   └── theme/         # Material Design theme
│   │   │   ├── viewmodel/         # ViewModels
│   │   │   ├── navigation/        # Navigation setup
│   │   │   ├── CampusConnectApp.kt
│   │   │   └── MainActivity.kt
│   │   └── res/                   # Resources
│   │       ├── values/
│   │       │   ├── strings.xml
│   │       │   ├── colors.xml
│   │       │   └── themes.xml
│   │       └── xml/
│   │           └── network_security_config.xml
│   └── build.gradle.kts
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

## Features

### Student Features
- ✅ Login with admin-provided credentials
- ✅ View attendance history
- ✅ Check attendance percentage
- ✅ View profile information
- ✅ Change password
- ✅ Material Design 3 UI

### Teacher Features
- ✅ Login with admin-provided credentials
- ✅ View all students
- ✅ Check student attendance records
- ✅ View department statistics
- ✅ Generate attendance reports
- ✅ Material Design 3 UI

## Technology Stack

- **Language:** Kotlin
- **UI Framework:** Jetpack Compose
- **Architecture:** MVVM (Model-View-ViewModel)
- **Dependency Injection:** Hilt
- **Networking:** Ktor Client
- **Serialization:** Kotlinx Serialization
- **Local Storage:** DataStore
- **Navigation:** Navigation Compose

## Backend Integration

The app connects to your existing Node.js backend (port 3000).

### Required API Endpoints

#### Authentication
```
POST /api/auth/login
POST /api/auth/change-password
```

#### Student APIs
```
GET /api/student/profile/:studentId
GET /api/student/attendance/:studentId
```

#### Teacher APIs
```
GET /api/teacher/profile/:teacherId
GET /api/teacher/students
GET /api/teacher/stats/department
```

## Setup Instructions

### 1. Update Backend URL

Edit `app/src/main/java/com/campus/connect/data/network/ApiService.kt`:

```kotlin
private val baseUrl = "http://YOUR_IP_ADDRESS:3000/api"
```

Replace `YOUR_IP_ADDRESS` with your machine's IP address.

### 2. Build the App

```bash
cd campus-connect-app
gradlew assembleDebug
```

### 3. Install on Device

```bash
gradlew installDebug
```

Or open the project in Android Studio and click Run.

## App Flow

### Login Flow
```
1. User opens app
2. Enters User ID (provided by admin)
3. Enters Password (provided by admin)
4. App validates credentials with backend
5. Backend returns user type (student/teacher)
6. App navigates to appropriate dashboard
```

### Student Flow
```
Login → Student Dashboard → [Attendance History, Profile]
```

### Teacher Flow
```
Login → Teacher Dashboard → [Students List, Reports, Profile]
```

## UI Screenshots

### Login Screen
- Clean, modern design
- User ID and Password fields
- Remember Me checkbox
- Show/Hide password toggle

### Student Dashboard
- Welcome message with name
- Today's attendance status
- Attendance percentage card
- Quick stats
- Navigation to Attendance History and Profile

### Teacher Dashboard
- Welcome message
- Department statistics
- Total students count
- Quick actions
- Navigation to Students List and Reports

## Security Features

- ✅ Password hashing (SHA-256)
- ✅ Secure token storage (DataStore)
- ✅ HTTPS support
- ✅ Session management
- ✅ Auto-logout on token expiry

## Development

### Prerequisites
- Android Studio Hedgehog or later
- JDK 17 or later
- Android SDK 34
- Gradle 8.2+

### Running the App
1. Open project in Android Studio
2. Sync Gradle
3. Update backend URL in ApiService.kt
4. Run on emulator or physical device

## Testing

### Test Credentials
Use credentials created by admin in the admin dashboard:
- Student: STU001 / password
- Teacher: TCH001 / password

## Troubleshooting

### Network Issues
- Ensure backend is running
- Check IP address in ApiService.kt
- Verify network_security_config.xml allows cleartext traffic

### Build Issues
- Clean project: `gradlew clean`
- Invalidate caches in Android Studio
- Sync Gradle files

## Future Enhancements

- [ ] Push notifications
- [ ] Offline mode
- [ ] Biometric authentication
- [ ] Dark mode
- [ ] Leave applications
- [ ] Exam schedules
- [ ] Fee payment status

## License

Proprietary - College Internal Use Only

## Support

For issues or questions, contact the development team.
