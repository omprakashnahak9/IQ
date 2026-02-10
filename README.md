# 🎓 IQ Campus Connect - Smart Campus Management System

Complete campus management solution with AI-powered study assistant, face recognition attendance, student/teacher portals, and admin dashboard.

## 🎯 System Components

### 📱 IQ Campus Connect App (Android)
**Student & Teacher Portal**
- 🔐 Secure login for students and teachers
- � Student Dashboard: View attendance, profile, statistics
- �‍🏫 Teacher Dashboard: Manage students, view department stats
- 🤖 **AI Study Assistant "Topper Bhaiya"**: Desi-style AI tutor
  - Multi-language support (English/Hindi/Hinglish)
  - Voice input/output
  - Real-time chat with Gemini 2.5 Flash
  - Relatable examples from Indian student life
- � Real-time attendance tracking
- � Profile management

**Backend:** Vercel (https://iq-backend.vercel.app)

### 🚪 Gate Verification App (Android)
**Security & Attendance System**
- 📸 Live camera preview with CameraX
- 🤖 ML Kit face detection
- 👁️ Liveness detection (blink/movement)
- ✅ Real-time face verification
- 📝 Automatic attendance marking
- 🔒 Anti-spoofing measures

**Backend:** Local (http://localhost:3000) - Accesses AI service

### 🌐 Admin Web Dashboard
**Complete System Management**
- 👥 Student registration with face enrollment
- 📊 Real-time attendance tracking and analytics
- ⚠️ AI-powered compliance monitoring
- 📈 Interactive charts and statistics
- 📥 Export attendance reports to CSV
- 🔐 Secure admin authentication
- 👨‍💼 Staff management

**Backend:** Vercel (https://iq-backend.vercel.app)

### 🔧 Backend API (Node.js + Express)
**Centralized API Server**
- 🔄 REST API endpoints
- 🗄️ Supabase integration
- 🖼️ Image processing pipeline
- 📝 Verification logging
- � AI Chat integration (Gemini 2.5 Flash)
- 🔐 JWT authentication
- 📊 Student/Teacher management

**Deployed:** https://iq-backend.vercel.app

### 🧠 AI Face Recognition Service (Python + FastAPI)
**Face Verification Engine**
- 🎭 DeepFace embeddings
- 🔍 pgvector similarity search
- 📚 Student face enrollment
- ✅ Real-time face verification
- 🚨 Anomaly detection

**Local:** http://localhost:8000

### 💾 Supabase Database (PostgreSQL + pgvector)
**Data Storage & Management**
- 👤 Student & teacher records
- 🔢 Face embeddings (128D vectors)
- 📋 Attendance verification logs
- ⚠️ Compliance logs
- 🔐 Row Level Security (RLS)
- 🔄 Real-time subscriptions

## 🏗️ System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  IQ Campus App  │     │  Gate Verify    │     │  Admin Web      │
│  (Students/     │     │  App (Security) │     │  Dashboard      │
│   Teachers)     │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │ HTTPS                 │ HTTP (Local)          │ HTTPS
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                     ┌─────────────────────┐
                     │  Backend API        │
                     │  (Vercel)           │
                     │  - Auth             │
                     │  - Student/Teacher  │
                     │  - AI Chat (Gemini) │
                     │  - Gate Verify      │
                     └──────────┬──────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
    ┌─────────────────────┐         ┌─────────────────────┐
    │  AI Face Service    │         │  Supabase Database  │
    │  (Local Python)     │         │  (PostgreSQL)       │
    │  - DeepFace         │◄────────┤  - Students         │
    │  - Face Verify      │         │  - Attendance       │
    │  - Enrollment       │         │  - Face Embeddings  │
    └─────────────────────┘         └─────────────────────┘
```

## ✨ Key Features

### 🤖 AI Study Assistant "Topper Bhaiya"
- **Personality:** Friendly college senior with desi vibes
- **Languages:** English, Hindi, Hinglish (auto-detects)
- **Features:** 
  - Voice input/output
  - Real-time chat
  - Detailed explanations with relatable examples
  - Study tips and guidance
- **Powered by:** Google Gemini 2.5 Flash

### 🔒 Face Recognition Attendance
- **Live Detection:** Real-time face detection with ML Kit
- **Anti-Spoofing:** Liveness checks (blink/movement)
- **Accuracy:** DeepFace embeddings with pgvector search
- **Speed:** < 2 seconds verification time
- **Security:** Encrypted embeddings, audit logs

### 📊 Comprehensive Dashboards
- **Students:** View attendance, profile, chat with AI
- **Teachers:** Manage students, view department stats
- **Admins:** Complete system control, analytics, reports

## 🚀 Quick Start

### Option 1: Start Everything (Recommended)
```bash
# Starts Supabase + AI Service + Backend + Admin Web
start_all_with_admin.bat
```

### Option 2: Start Gate System Only
```bash
# Starts Supabase + AI Service + Local Backend
start_gate_system.bat
```

### Manual Setup

#### 1. Setup Supabase
1. Create project at https://supabase.com
2. Run migrations in `supabase/migrations/`
3. Copy credentials to `.env` files

#### 2. Start AI Face Recognition Service
```bash
cd ai-model
pip install -r requirements.txt
cp .env.example .env
# Edit .env with Supabase credentials
python api.py
# Service runs on http://localhost:8000
```

#### 3. Backend API
**Production (Already Deployed):**
- URL: https://iq-backend.vercel.app
- No setup needed!

**Local Development:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with credentials
npm start
# Runs on http://localhost:3000
```

#### 4. Admin Web Dashboard
```bash
cd admin-web
npm install
cp .env.example .env
# Edit .env with backend URL
npm run dev
# Access at http://localhost:5173
```

#### 5. Build Android Apps

**IQ Campus Connect App:**
```bash
cd campus-connect-app
build_and_install.bat
# Or manually:
# gradlew.bat assembleDebug
# gradlew.bat installDebug
```

**Gate Verification App:**
```bash
cd gate-verification-app/app-frontend
rebuild_and_install.bat
# Or manually:
# gradlew.bat assembleDebug
# gradlew.bat installDebug
```

## 📦 Project Structure

```
iq-campus-connect/
├── campus-connect-app/          # IQ Campus Connect Android App
│   ├── app/src/main/java/       # Kotlin source code
│   │   ├── ui/                  # UI screens (Login, Dashboard, AI Assistant)
│   │   ├── viewmodel/           # ViewModels
│   │   ├── data/                # Repositories, API, Models
│   │   └── di/                  # Dependency Injection
│   └── build_and_install.bat    # Build & install script
│
├── gate-verification-app/       # Gate Verification Android App
│   └── app-frontend/
│       ├── app/src/main/java/   # Kotlin source code
│       └── rebuild_and_install.bat
│
├── admin-web/                   # Admin Web Dashboard
│   ├── src/
│   │   ├── pages/               # React pages
│   │   ├── components/          # React components
│   │   └── lib/                 # Supabase client
│   └── start_admin_web.bat
│
├── backend/                     # Backend API (Node.js)
│   ├── src/
│   │   ├── controllers/         # API controllers
│   │   ├── routes/              # API routes
│   │   └── config/              # Supabase config
│   └── start_backend.bat
│
├── ai-model/                    # AI Face Recognition Service
│   ├── services/                # Face recognition logic
│   ├── utils/                   # Image preprocessing
│   ├── api.py                   # FastAPI server
│   └── start_ai_service.bat
│
├── supabase/                    # Database
│   ├── migrations/              # SQL migrations
│   └── config.toml              # Supabase config
│
├── start_all_with_admin.bat     # Start all services
├── start_gate_system.bat        # Start gate system
└── README.md                    # This file
```

## 📊 API Endpoints

### Backend API (https://iq-backend.vercel.app)

#### Authentication
- `POST /api/auth/login` - Student/Teacher login
- `POST /api/auth/change-password` - Change password

#### Student
- `GET /api/student/profile/:id` - Get student profile
- `GET /api/student/attendance/:id` - Get attendance history

#### Teacher
- `GET /api/teacher/profile/:id` - Get teacher profile
- `GET /api/teacher/students` - Get students list
- `GET /api/teacher/stats/department` - Department statistics

#### AI Assistant
- `POST /api/ai/chat` - Chat with Topper Bhaiya
  ```json
  Request: { "message": "explain photosynthesis" }
  Response: { "success": true, "message": "Arre bhai, photosynthesis..." }
  ```

#### Gate Verification
- `POST /gate/verify` - Verify face and mark attendance
- `POST /gate/enroll` - Enroll new student face
- `GET /health` - Health check

### AI Service (http://localhost:8000)
- `POST /verify` - Face verification
- `POST /enroll` - Enroll new student
- `GET /health` - Health check

## � Configuration

### Environment Variables

**Backend (.env):**
```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_api_key
AI_MODEL_SERVICE_URL=http://localhost:8000
```

**AI Service (.env):**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_service_role_key
```

**Admin Web (.env):**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_BACKEND_URL=https://iq-backend.vercel.app
```

### Android App Configuration

**IQ Campus Connect:**
- Backend URL: `https://iq-backend.vercel.app/api`
- File: `campus-connect-app/app/src/main/java/com/campus/connect/data/network/ApiService.kt`

**Gate Verification:**
- Backend URL: `http://YOUR_LOCAL_IP:3000`
- File: `gate-verification-app/app-frontend/app/src/main/java/com/campus/gateverification/network/ApiService.kt`
- Network Security: `app/src/main/res/xml/network_security_config.xml`

## 🛠️ Troubleshooting

### App Not Getting AI Responses
1. Force stop the app
2. Clear app cache in phone settings
3. Reopen the app

### Gate App Can't Connect
1. Ensure PC and phone are on same network
2. Update IP address in `ApiService.kt`
3. Add IP to `network_security_config.xml`
4. Rebuild and install app

### Backend Issues
```bash
# Check Vercel logs
vercel logs

# Test endpoint
curl https://iq-backend.vercel.app/health
```

### AI Service Issues
```bash
# Check if service is running
curl http://localhost:8000/health

# Restart service
cd ai-model
python api.py
```

## 🎯 Hybrid Backend Architecture

**Why Hybrid?**
- Vercel can't access localhost services
- Gate app needs local AI service for face recognition
- IQ Campus app works from anywhere (uses Vercel)

**Setup:**
- **IQ Campus Connect App** → Vercel Backend (https://iq-backend.vercel.app)
- **Gate Verification App** → Local Backend (http://localhost:3000)
- **Admin Web** → Vercel Backend (https://iq-backend.vercel.app)

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Row Level Security (RLS) in Supabase
- ✅ Live face detection with ML Kit
- ✅ Anti-spoofing (liveness checks)
- ✅ Encrypted face embeddings
- ✅ Audit logging for all verifications
- ✅ HTTPS for all external communications

## 🚀 Deployment

### Backend (Vercel)
```bash
cd backend
vercel --prod
```

### Admin Web (Vercel/Netlify)
```bash
cd admin-web
npm run build
# Deploy dist/ folder
```

### AI Service (Local/VPS)
```bash
cd ai-model
python api.py
# Keep running on server
```

## 📱 Tech Stack

**Mobile Apps:**
- Kotlin
- Jetpack Compose
- CameraX
- ML Kit
- Ktor Client
- Hilt (DI)

**Backend:**
- Node.js
- Express.js
- Supabase JS Client
- Google Generative AI (Gemini)

**AI Service:**
- Python
- FastAPI
- DeepFace
- NumPy

**Admin Web:**
- React
- Vite
- Tailwind CSS
- Recharts
- Supabase JS Client

**Database:**
- PostgreSQL (Supabase)
- pgvector extension

## 👥 Team

Built with ❤️ for smart campus management

## 📝 License

Apache License 2.0 - See [LICENSE](LICENSE) file for details.

Copyright 2026 IQ Campus Connect

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
