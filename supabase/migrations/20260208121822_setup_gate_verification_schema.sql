-- Gate Verification System - Supabase Database Setup

-- Enable pgvector extension for face embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Students table with face embeddings
CREATE TABLE IF NOT EXISTS students (
  student_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  department VARCHAR(100),
  year INTEGER,
  face_embedding vector(512),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Gate verification logs
CREATE TABLE IF NOT EXISTS gate_logs (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) REFERENCES students(student_id),
  timestamp TIMESTAMP DEFAULT NOW(),
  confidence FLOAT,
  verified BOOLEAN,
  gate_location VARCHAR(100),
  image_url TEXT
);

-- Attendance tracking (optional)
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) REFERENCES students(student_id),
  date DATE DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'present'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_embedding ON students USING ivfflat (face_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_gate_logs_student ON gate_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_gate_logs_timestamp ON gate_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for students table
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample student (for testing)
INSERT INTO students (student_id, name, email, department, year)
VALUES ('CSE1023', 'Rahul Sharma', 'rahul@college.edu', 'Computer Science', 3)
ON CONFLICT (student_id) DO NOTHING;

-- View for daily attendance summary (fixed to use timestamp::date)
CREATE OR REPLACE VIEW daily_attendance_summary AS
SELECT 
  timestamp::date as date,
  COUNT(*) as total_entries,
  COUNT(DISTINCT student_id) as unique_students,
  AVG(confidence) as avg_confidence
FROM gate_logs
WHERE verified = true
GROUP BY timestamp::date
ORDER BY timestamp::date DESC;;
