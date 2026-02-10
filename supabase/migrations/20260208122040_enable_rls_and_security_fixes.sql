-- Enable Row Level Security on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for students table
CREATE POLICY "Allow public read access to students" ON students
    FOR SELECT USING (true);

CREATE POLICY "Allow service role full access to students" ON students
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for gate_logs table
CREATE POLICY "Allow public read access to gate_logs" ON gate_logs
    FOR SELECT USING (true);

CREATE POLICY "Allow service role full access to gate_logs" ON gate_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for attendance table
CREATE POLICY "Allow public read access to attendance" ON attendance
    FOR SELECT USING (true);

CREATE POLICY "Allow service role full access to attendance" ON attendance
    FOR ALL USING (auth.role() = 'service_role');

-- Fix function search path
ALTER FUNCTION update_updated_at_column() SET search_path = pg_catalog, public;;
