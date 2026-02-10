# Gate Verification Backend

Node.js backend API for the AI-powered gate verification system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. Run the server:
```bash
npm run dev
```

## API Endpoints

### POST /gate/verify
Verify a face from gate camera.

**Request:**
- Content-Type: multipart/form-data
- Field: `image` (file)

**Response:**
```json
{
  "verified": true,
  "student_id": "CSE1023",
  "name": "Rahul Sharma",
  "confidence": 0.94,
  "timestamp": "2026-02-08T09:12:00"
}
```

## Supabase Schema

Required tables:
- `students` (student_id, name, email, face_embedding)
- `gate_logs` (id, student_id, timestamp, confidence, verified)
