const supabase = require('../config/supabase');
const crypto = require('crypto');

// Hash password using SHA-256
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID and password are required' 
      });
    }

    // Hash the provided password
    const hashedPassword = hashPassword(password);

    // Check credentials in database
    const { data: credential, error } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('password_hash', hashedPassword)
      .eq('is_active', true)
      .single();

    if (error || !credential) {
      console.log('Login error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get user details based on type
    let userData = null;
    if (credential.user_type === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', userId)
        .single();
      userData = student;
    } else if (credential.user_type === 'teacher') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('teacher_id', userId)
        .single();
      userData = teacher;
    }

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Generate simple token (in production, use JWT)
    const token = Buffer.from(`${userId}:${Date.now()}`).toString('base64');

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        user_id: credential.user_id,
        user_type: credential.user_type,
        full_name: userData.name,
        email: userData.email,
        department: userData.department,
        phone: userData.phone || null,
        is_active: credential.is_active,
        ...(credential.user_type === 'student' && { 
          year: userData.year 
        }),
        ...(credential.user_type === 'teacher' && { 
          designation: userData.designation 
        })
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Login failed',
      error: error.message 
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Verify old password
    const oldHash = hashPassword(oldPassword);
    const { data: credential, error } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('password_hash', oldHash)
      .single();

    if (error || !credential) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update to new password
    const newHash = hashPassword(newPassword);
    const { error: updateError } = await supabase
      .from('user_credentials')
      .update({ password_hash: newHash })
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};
