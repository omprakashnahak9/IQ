const supabase = require('../config/supabase');

exports.getProfile = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const { data: teacher, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('teacher_id', teacherId)
      .single();

    if (error || !teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    return res.json(teacher);

  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const { department } = req.query;

    let query = supabase
      .from('students')
      .select('*')
      .order('name', { ascending: true });

    if (department) {
      query = query.eq('department', department);
    }

    const { data: students, error } = await query;

    if (error) {
      throw error;
    }

    return res.json(students);

  } catch (error) {
    console.error('Get students error:', error.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

exports.getDepartmentStats = async (req, res) => {
  try {
    // Get all students grouped by department
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('department, student_id');

    if (studentsError) {
      throw studentsError;
    }

    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const { data: attendance, error: attendanceError } = await supabase
      .from('gate_logs')
      .select('student_id')
      .eq('verified', true)
      .gte('timestamp', `${today}T00:00:00`)
      .lte('timestamp', `${today}T23:59:59`);

    if (attendanceError) {
      throw attendanceError;
    }

    // Group by department
    const departmentMap = {};
    students.forEach(student => {
      const dept = student.department || 'Unknown';
      if (!departmentMap[dept]) {
        departmentMap[dept] = {
          department: dept,
          totalStudents: 0,
          presentToday: 0
        };
      }
      departmentMap[dept].totalStudents++;
    });

    // Count present students
    const presentStudentIds = new Set(attendance.map(a => a.student_id));
    students.forEach(student => {
      const dept = student.department || 'Unknown';
      if (presentStudentIds.has(student.student_id)) {
        departmentMap[dept].presentToday++;
      }
    });

    // Calculate percentages
    const stats = Object.values(departmentMap).map(dept => ({
      ...dept,
      attendancePercentage: dept.totalStudents > 0 
        ? Math.round((dept.presentToday / dept.totalStudents) * 100) 
        : 0
    }));

    return res.json(stats);

  } catch (error) {
    console.error('Get department stats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch department statistics' });
  }
};
