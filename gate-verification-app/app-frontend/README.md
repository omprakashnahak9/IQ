# Gate Verification Android App

Native Android app for gate verification using face recognition with liveness detection.

## Features

- Live camera preview
- ML Kit face detection
- Liveness detection (eye blink)
- Real-time verification
- Clean Architecture + MVVM

## Tech Stack

- Kotlin
- Jetpack Compose
- CameraX
- ML Kit Face Detection
- Ktor Client
- Hilt (DI)

## Setup

1. Open project in Android Studio
2. Update backend URL in `ApiService.kt`
3. Sync Gradle
4. Run on device (camera required)

## Permissions

- Camera
- Internet

## Architecture

```
app/
├── data/          # Data models
├── domain/        # Use cases
├── network/       # API service
├── ui/            # Compose screens
└── viewmodel/     # ViewModels
```

## Configuration

Update `ApiService.kt` with your backend IP:
```kotlin
private val baseUrl = "http://YOUR_BACKEND_IP:3000"
```
