-- Update face_embedding column to use 128 dimensions (for face-recognition library)
-- Drop the old column and recreate with correct dimension
ALTER TABLE students DROP COLUMN IF EXISTS face_embedding;
ALTER TABLE students ADD COLUMN face_embedding vector(128);

-- Recreate the index with correct dimension
DROP INDEX IF EXISTS idx_students_embedding;
CREATE INDEX idx_students_embedding ON students USING ivfflat (face_embedding vector_cosine_ops);;
