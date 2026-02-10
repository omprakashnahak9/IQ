const axios = require('axios');
const supabase = require('../config/supabase');
const FormData = require('form-data');

const AI_SERVICE_URL = process.env.AI_MODEL_SERVICE_URL || 'http://localhost:8000';

exports.verifyFace = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Step 1: Send image to AI service to extract embedding
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: 'face.jpg',
      contentType: req.file.mimetype
    });

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/extract-embedding`, formData, {
      headers: formData.getHeaders()
    });

    if (!aiResponse.data.success || !aiResponse.data.embedding) {
      return res.json({
        verified: false,
        message: 'No face detected in image',
        timestamp: new Date().toISOString()
      });
    }

    const embedding = aiResponse.data.embedding;

    // Step 2: Find matching student in database using vector similarity
    const { data: matches, error } = await supabase.rpc('match_face', {
      query_embedding: embedding,
      match_threshold: 0.6,
      match_count: 1
    });

    if (error) {
      console.error('Database error:', error);
      throw new Error('Database query failed');
    }

    // Step 3: If match found, return student details (don't mark attendance yet)
    if (matches && matches.length > 0) {
      const match = matches[0];
      const student_id = match.student_id;
      let confidence = match.similarity;
      
      // Handle NaN or invalid confidence values
      if (typeof confidence !== 'number' || isNaN(confidence) || !isFinite(confidence)) {
        console.warn('Invalid confidence value:', confidence);
        confidence = 0.0;
      }
      
      // Ensure confidence is between 0 and 1
      confidence = Math.max(0, Math.min(1, confidence));
      
      // Reject matches with very low confidence (below 50%)
      if (confidence < 0.5) {
        console.log(`Low confidence match rejected: ${confidence} for student ${student_id}`);
        return res.json({
          verified: false,
          message: 'Face not recognized - low confidence',
          confidence: confidence,
          timestamp: new Date().toISOString()
        });
      }

      // Get full student details
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', student_id)
        .single();

      // Check if attendance already marked today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingLog } = await supabase
        .from('gate_logs')
        .select('*')
        .eq('student_id', student_id)
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`)
        .eq('verified', true)
        .single();

      if (existingLog) {
        // Attendance already marked today
        return res.json({
          verified: true,
          student_id,
          name: student?.name || 'Unknown',
          email: student?.email || null,
          department: student?.department || null,
          year: student?.year || null,
          confidence: confidence,
          timestamp: new Date().toISOString(),
          attendance_already_marked: true,
          attendance_time: existingLog.timestamp,
          message: 'Attendance already marked today'
        });
      }

      return res.json({
        verified: true,
        student_id,
        name: student?.name || 'Unknown',
        email: student?.email || null,
        department: student?.department || null,
        year: student?.year || null,
        confidence: confidence,
        timestamp: new Date().toISOString(),
        attendance_already_marked: false
      });
    }

    // No match found - log failed attempt
    await supabase.from('gate_logs').insert({
      confidence: 0,
      timestamp: new Date().toISOString(),
      verified: false,
      gate_location: req.body.gate_location || 'Main Gate'
    });

    return res.json({
      verified: false,
      message: 'Face not recognized',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Verification error:', error.message);
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { student_id, confidence, gate_location } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // Check if student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', student_id)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if attendance already marked today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingLog } = await supabase
      .from('gate_logs')
      .select('*')
      .eq('student_id', student_id)
      .gte('timestamp', `${today}T00:00:00`)
      .lte('timestamp', `${today}T23:59:59`)
      .eq('verified', true)
      .single();

    if (existingLog) {
      return res.json({
        success: false,
        message: 'Attendance already marked today',
        existing_entry: existingLog
      });
    }

    // Mark attendance
    let validConfidence = confidence || 0.9;
    
    // Handle NaN or invalid confidence values
    if (typeof validConfidence !== 'number' || isNaN(validConfidence) || !isFinite(validConfidence)) {
      console.warn('Invalid confidence value:', validConfidence);
      validConfidence = 0.9;
    }
    
    // Ensure confidence is between 0 and 1
    validConfidence = Math.max(0, Math.min(1, validConfidence));
    
    const { data: logEntry, error: logError } = await supabase
      .from('gate_logs')
      .insert({
        student_id,
        confidence: validConfidence,
        timestamp: new Date().toISOString(),
        verified: true,
        gate_location: gate_location || 'Main Gate'
      })
      .select()
      .single();

    if (logError) {
      throw logError;
    }

    return res.json({
      success: true,
      message: 'Attendance marked successfully',
      student: {
        student_id: student.student_id,
        name: student.name,
        department: student.department
      },
      log_entry: logEntry
    });

  } catch (error) {
    console.error('Attendance marking error:', error.message);
    res.status(500).json({ error: 'Failed to mark attendance', details: error.message });
  }
};

