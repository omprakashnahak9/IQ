import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Edit, Trash2, Key, Eye, EyeOff, UserCheck, UserX } from 'lucide-react'

export default function StaffManagement() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [selectedCredentials, setSelectedCredentials] = useState(null)
  const [formData, setFormData] = useState({
    teacher_id: '',
    email: '',
    password: '',
    full_name: '',
    department: '',
    phone: '',
    designation: '',
    subjects: ''
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('user_type', 'teacher')
        .order('created_at', { ascending: false })

      if (error) throw error
      setStaff(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching staff:', error)
      setLoading(false)
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({...formData, password})
  }

  const hashPassword = async (password) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)

      if (editMode) {
        // Update existing staff member
        const { error } = await supabase
          .from('user_credentials')
          .update({
            full_name: formData.full_name,
            email: formData.email,
            department: formData.department,
            phone: formData.phone,
            designation: formData.designation
          })
          .eq('user_id', formData.teacher_id)

        if (error) throw error
        alert('Staff member updated successfully!')
      } else {
        // Create new staff member
        const passwordHash = await hashPassword(formData.password)
        const generatedPassword = formData.password
        
        const { data: newUser, error: userError } = await supabase
          .from('user_credentials')
          .insert([{
            user_id: formData.teacher_id,
            email: formData.email,
            password_hash: passwordHash,
            user_type: 'teacher',
            full_name: formData.full_name,
            department: formData.department,
            phone: formData.phone,
            designation: formData.designation,
            is_active: true
          }])
          .select()
          .single()

        if (userError) throw userError

        // Create teacher record
        const { error: teacherError } = await supabase
          .from('teachers')
          .insert([{
            teacher_id: formData.teacher_id,
            name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            department: formData.department,
            designation: formData.designation,
            subjects: formData.subjects ? formData.subjects.split(',').map(s => s.trim()) : [],
            user_credential_id: newUser.id
          }])

        if (teacherError) {
          // Rollback if teacher creation fails
          await supabase.from('user_credentials').delete().eq('id', newUser.id)
          throw teacherError
        }

        // Show credentials
        setSelectedCredentials({
          teacher_id: formData.teacher_id,
          name: formData.full_name,
          email: formData.email,
          password: generatedPassword
        })
        setShowCredentialsModal(true)
      }

      setShowModal(false)
      resetForm()
      fetchStaff()
    } catch (error) {
      console.error('Error saving staff:', error)
      alert('Failed to save staff member: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (member) => {
    setEditMode(true)
    setFormData({
      teacher_id: member.user_id,
      email: member.email,
      password: '',
      full_name: member.full_name,
      department: member.department || '',
      phone: member.phone || '',
      designation: member.designation || '',
      subjects: ''
    })
    setShowModal(true)
  }

  const handleViewCredentials = async (member) => {
    setSelectedCredentials({
      teacher_id: member.user_id,
      name: member.full_name,
      email: member.email,
      password: '••••••••••••',
      note: 'Password is hashed and cannot be retrieved. Contact admin to reset.',
      hasCredentials: true
    })
    setShowCredentialsModal(true)
  }

  const handleRegeneratePassword = async () => {
    if (!selectedCredentials || !selectedCredentials.teacher_id) return

    const confirmMessage = `Are you sure you want to regenerate password for ${selectedCredentials.name}?\n\nThe old password will no longer work.`
    if (!confirm(confirmMessage)) return

    try {
      setLoading(true)
      
      // Generate new password
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%'
      let newPassword = ''
      for (let i = 0; i < 12; i++) {
        newPassword += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      
      const hashedPassword = await hashPassword(newPassword)

      // Update password in database
      const { error } = await supabase
        .from('user_credentials')
        .update({ password_hash: hashedPassword })
        .eq('user_id', selectedCredentials.teacher_id)

      if (error) throw error

      // Show new password to admin
      setSelectedCredentials({
        ...selectedCredentials,
        password: newPassword,
        note: 'New password generated! Make sure to copy it now.',
        isNewPassword: true
      })

      alert('Password regenerated successfully!')
    } catch (error) {
      console.error('Error regenerating password:', error)
      alert('Failed to regenerate password: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (member) => {
    const confirmMessage = `Are you sure you want to delete "${member.full_name}" (${member.user_id})?\n\nThis will permanently remove their login credentials.\n\nThis action cannot be undone.`
    
    if (!confirm(confirmMessage)) return

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('user_credentials')
        .delete()
        .eq('user_id', member.user_id)

      if (error) throw error
      
      alert('Staff member deleted successfully')
      fetchStaff()
    } catch (error) {
      console.error('Error deleting staff:', error)
      alert('Failed to delete staff member: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (member) => {
    try {
      const { error } = await supabase
        .from('user_credentials')
        .update({ is_active: !member.is_active })
        .eq('user_id', member.user_id)

      if (error) throw error
      
      alert(`Staff member ${member.is_active ? 'deactivated' : 'activated'} successfully`)
      fetchStaff()
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('Failed to update status')
    }
  }

  const resetForm = () => {
    setFormData({
      teacher_id: '',
      email: '',
      password: '',
      full_name: '',
      department: '',
      phone: '',
      designation: '',
      subjects: ''
    })
    setEditMode(false)
    setShowPassword(false)
  }

  const handleModalClose = () => {
    setShowModal(false)
    resetForm()
  }

  const filteredStaff = staff.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && staff.length === 0) {
    return <div className="loading">Loading staff...</div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Staff Management</h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            Create and manage login credentials for teachers and staff members
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={20} />
          Add Staff Member
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-content">
            <p className="stat-label">Total Staff</p>
            <h3 className="stat-value">{staff.length}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <p className="stat-label">Active</p>
            <h3 className="stat-value">{staff.filter(s => s.is_active).length}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <p className="stat-label">Inactive</p>
            <h3 className="stat-value">{staff.filter(s => !s.is_active).length}</h3>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: '24px' }}>
        <Search size={20} />
        <input
          type="text"
          placeholder="Search staff members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Staff ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">No staff members found</td>
              </tr>
            ) : (
              filteredStaff.map((member) => (
                <tr key={member.id}>
                  <td><strong>{member.user_id}</strong></td>
                  <td>{member.full_name}</td>
                  <td>{member.email}</td>
                  <td>{member.department || 'N/A'}</td>
                  <td>{member.designation || 'N/A'}</td>
                  <td>
                    <span className={`badge ${member.is_active ? 'success' : 'danger'}`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(member.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleEdit(member)}
                        title="Edit Staff Member"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon info" 
                        onClick={() => handleViewCredentials(member)}
                        title="View Login Credentials"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className={`btn-icon ${member.is_active ? 'warning' : 'success'}`}
                        onClick={() => toggleStatus(member)}
                        title={member.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {member.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => handleDelete(member)}
                        title="Delete Staff Member"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>{editMode ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
            {editMode && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#fef3c7', 
                borderRadius: '8px', 
                marginBottom: '20px',
                fontSize: '14px',
                color: '#92400e'
              }}>
                <strong>Note:</strong> Password cannot be changed here. Staff details only.
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Staff ID *</label>
                <input
                  type="text"
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                  placeholder="e.g., TCH001"
                  required
                  disabled={editMode}
                  style={editMode ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                />
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              {!editMode && (
                <div className="form-group">
                  <label>Password *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="btn-secondary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <Key size={16} />
                      Generate
                    </button>
                  </div>
                  <small style={{ color: '#6b7280', fontSize: '12px' }}>
                    Minimum 8 characters. Click Generate for a strong password.
                  </small>
                </div>
              )}

              <div className="form-group">
                <label>Department *</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>

              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                  placeholder="e.g., Assistant Professor"
                />
              </div>

              {!editMode && (
                <div className="form-group">
                  <label>Subjects (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.subjects}
                    onChange={(e) => setFormData({...formData, subjects: e.target.value})}
                    placeholder="e.g., Mathematics, Physics"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="e.g., 9876543210"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={handleModalClose} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading}
                >
                  {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Staff' : 'Add Staff')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && selectedCredentials && (
        <div className="modal-overlay" onClick={() => setShowCredentialsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Key size={32} color="white" />
              </div>
              <h2 style={{ margin: '0 0 8px 0' }}>Staff Login Credentials</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                {selectedCredentials.note ? 'Existing credentials' : 'Save these credentials securely'}
              </p>
            </div>

            <div className="credential-box">
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>Staff ID</strong>
                <div style={{ 
                  background: 'white', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  marginTop: '4px',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#111827'
                }}>
                  {selectedCredentials.teacher_id}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>Email</strong>
                <div style={{ 
                  background: 'white', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  marginTop: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  color: '#111827'
                }}>
                  {selectedCredentials.email}
                </div>
              </div>

              <div>
                <strong style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>Password</strong>
                <div style={{ 
                  background: 'white', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  marginTop: '4px',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: selectedCredentials.note ? '#dc2626' : '#16a34a'
                }}>
                  {selectedCredentials.password}
                </div>
              </div>
            </div>

            {selectedCredentials.note && !selectedCredentials.isNewPassword && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#92400e'
              }}>
                <strong>Note:</strong> {selectedCredentials.note}
              </div>
            )}

            {selectedCredentials.isNewPassword && (
              <div style={{
                padding: '12px',
                backgroundColor: '#dcfce7',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#166534'
              }}>
                <strong>✅ Password Regenerated!</strong> This new password will only be shown once. Please save it securely and share with the staff member.
              </div>
            )}

            {!selectedCredentials.note && !selectedCredentials.isNewPassword && (
              <div style={{
                padding: '12px',
                backgroundColor: '#dcfce7',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#166534'
              }}>
                <strong>⚠️ Important:</strong> This password will only be shown once. Please save it securely and share with the staff member.
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {selectedCredentials.hasCredentials && !selectedCredentials.isNewPassword && (
                <button 
                  onClick={handleRegeneratePassword}
                  className="btn-secondary"
                  style={{ 
                    flex: '1 1 100%',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  disabled={loading}
                >
                  <Key size={18} />
                  Regenerate Password
                </button>
              )}
              
              <button 
                onClick={() => {
                  const text = `Staff Login Credentials\n\nStaff ID: ${selectedCredentials.teacher_id}\nEmail: ${selectedCredentials.email}\nPassword: ${selectedCredentials.password}\n\nPlease keep these credentials safe.`
                  navigator.clipboard.writeText(text)
                  alert('Credentials copied to clipboard!')
                }}
                className="btn-secondary"
                style={{ flex: 1 }}
                disabled={selectedCredentials.note && !selectedCredentials.isNewPassword}
              >
                Copy to Clipboard
              </button>
              <button 
                onClick={() => setShowCredentialsModal(false)}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
