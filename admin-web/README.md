# Gate Verification Admin Dashboard

Modern web-based admin dashboard for managing the Gate Verification System.

## Features

### 🔐 Authentication
- Admin registration and login
- Secure authentication with Supabase
- Session management

### 📊 Dashboard
- Real-time statistics
- Total students count
- Today's attendance
- Verification success rate
- Compliance issues count
- Weekly attendance chart
- Recent activity feed

### 👥 Students Management
- View all registered students
- Add new students with details
- Upload face images for verification
- Edit student information
- Delete students
- Search and filter students
- Face data registration status

### 📋 Attendance Records
- View all verification logs
- Filter by date
- Filter by status (verified/failed)
- Export to CSV
- Real-time attendance tracking
- Confidence scores

### ⚠️ Compliance & Anomalies
- View all compliance issues detected by AI
- Filter by issue type:
  - Multiple faces detected
  - No face detected
  - Suspicious activity
  - Low confidence verifications
- Severity levels (High, Medium, Low)
- Detailed issue information
- Resolution status tracking

## Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router DOM
- **State Management**: React Query (TanStack Query)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Icons**: Lucide React
- **Styling**: Custom CSS

## Installation

1. Install dependencies:
```bash
cd admin-web
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## Preview Production Build

```bash
npm run preview
```

## Database Schema

The dashboard expects the following Supabase tables:

### students
- id (uuid, primary key)
- student_id (text, unique)
- name (text)
- email (text)
- phone (text)
- department (text)
- year (text)
- face_embedding (vector)
- created_at (timestamp)

### verification_logs
- id (uuid, primary key)
- student_id (uuid, foreign key)
- timestamp (timestamp)
- verified (boolean)
- confidence (float)
- created_at (timestamp)

### compliance_logs
- id (uuid, primary key)
- student_id (uuid, foreign key, nullable)
- timestamp (timestamp)
- issue_type (text)
- severity (text)
- description (text)
- details (jsonb)
- resolved (boolean)
- created_at (timestamp)

## Usage

### First Time Setup

1. Register an admin account at `/register`
2. Login at `/login`
3. Start adding students from the Students page
4. Upload face images for facial recognition
5. Monitor attendance and compliance

### Adding Students

1. Go to Students page
2. Click "Add Student"
3. Fill in student details
4. Upload face image (optional)
5. Submit

### Viewing Attendance

1. Go to Attendance page
2. Select date to filter
3. Filter by status if needed
4. Export to CSV for reports

### Monitoring Compliance

1. Go to Compliance page
2. View all anomalies detected by AI
3. Filter by issue type
4. Review details and take action

## API Integration

The dashboard connects to:
- Supabase for database operations
- Backend API for verification logs
- AI Model service for face recognition

## Security

- All routes are protected with authentication
- Row Level Security (RLS) enabled on Supabase
- Secure session management
- Environment variables for sensitive data

## Development

### Project Structure
```
admin-web/
├── src/
│   ├── components/
│   │   └── Layout.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── lib/
│   │   └── supabase.js
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Students.jsx
│   │   ├── Attendance.jsx
│   │   └── Compliance.jsx
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── .env
├── .env.example
├── package.json
└── vite.config.js
```

## Troubleshooting

### Supabase Connection Issues
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
- Check if Supabase project is running
- Ensure RLS policies are configured

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

## License

MIT
