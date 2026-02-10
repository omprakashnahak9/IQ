const supabase = require('../config/supabase');

exports.getProfile = async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error || !student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    return res.json(student);

  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get all attendance records for this student
    const { data: records, error } = await supabase
      .from('gate_logs')
      .select('*')
      .eq('student_id', studentId)
      .eq('verified', true)
      .order('timestamp', { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate summary statistics
    const total = records.length;
    const present = records.filter(r => r.verified).length;
    const percentage = total > 0 ? (present / total) * 100 : 0;

    // Format records for response
    const formattedRecords = records.map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      gateLocation: record.gate_location,
      verified: record.verified,
      confidence: record.confidence
    }));

    return res.json({
      summary: {
        total,
        present,
        percentage: Math.round(percentage * 100) / 100
      },
      records: formattedRecords
    });

  } catch (error) {
    console.error('Get attendance error:', error.message);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};
