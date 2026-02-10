# AI Face Recognition Service

Python FastAPI service using InsightFace (ArcFace) for face verification.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run the service:
```bash
python api.py
```

## API Endpoints

### POST /verify
Verify a face against enrolled students.

**Request:**
- Content-Type: multipart/form-data
- Field: `image` (file)

**Response:**
```json
{
  "verified": true,
  "student_id": "CSE1023",
  "confidence": 0.94
}
```

### POST /enroll
Enroll a new student face.

**Request:**
- Content-Type: multipart/form-data
- Fields: `student_id` (string), `image` (file)

## Database Setup

Enable pgvector extension in Supabase:
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE students (
  student_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  face_embedding vector(512)
);

CREATE INDEX ON students USING ivfflat (face_embedding vector_cosine_ops);
```
