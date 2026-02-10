import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Edit, Trash2, Camera, Check, Eye, Key } from 'lucide-react'
import CameraCapture from '../components/CameraCapture'

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImages, setCapturedImages] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [selectedCredentials, setSelectedCredentials] = useState(null)
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    year: ''
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  const handleCameraComplete = (images) => {
    setCapturedImages(images)
    setShowCamera(false)
  }

  const handleCameraCancel = () => {
    setShowCamera(false)
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const hashPassword = async (password) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setStudents(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching students:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // If editing, only update student details (no face data)
    if (editMode) {
      try {
        setLoading(true)
        
        const { error } = await supabase
          .from('students')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            department: formData.department,
            year: parseInt(formData.year)
          })
          .eq('student_id', formData.student_id)

        if (error) {
          console.error('Error updating student:', error)
          alert('Failed to update student: ' + error.message)
        } else {
          setShowModal(false)
          resetForm()
          fetchStudents()
          alert('Student details updated successfully!')
        }
      } catch (error) {
        console.error('Error updating student:', error)
        alert('Failed to update student: ' + error.message)
      } finally {
        setLoading(false)
      }
      return
    }
    
    // Adding new student - require face images
    if (capturedImages.length === 0) {
      alert('Please capture at least one face image')
      return
    }

    try {
      setLoading(true)
      setIsProcessing(true)
      setProcessingStatus('Preparing images...')

      // Generate credentials
      const generatedPassword = generatePassword()
      const passwordHash = await hashPassword(generatedPassword)

      // Convert captured images to base64
      const base64Images = capturedImages.map(img => img.split(',')[1])
      
      // Send images to AI service to generate face embedding
      let faceEmbedding = null
      
      try {
        setProcessingStatus('Connecting to AI service...')
        const aiServiceUrl = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'
        
        setProcessingStatus('Generating face embeddings...')
        const response = await fetch(`${aiServiceUrl}/enroll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: formData.student_id,
            images: base64Images
          })
        })

        if (response.ok) {
          const result = await response.json()
          faceEmbedding = result.embedding || result.face_embedding
          setProcessingStatus(`Processing complete! ${result.images_processed}/${result.total_images} images processed`)
        } else {
          console.error('AI service error:', await response.text())
          setProcessingStatus('Warning: Face embedding generation failed')
          alert('Warning: Face embedding generation failed. Student will be saved without face data.')
        }
      } catch (aiError) {
        console.error('Failed to connect to AI service:', aiError)
        setProcessingStatus('Warning: Could not connect to AI service')
        alert('Warning: Could not connect to AI service. Student will be saved without face data.')
      }

      // Create user credentials first
      setProcessingStatus('Creating login credentials...')
      const { data: credential, error: credError } = await supabase
        .from('user_credentials')
        .insert([{
          user_id: formData.student_id,
          email: formData.email,
          password_hash: passwordHash,
          user_type: 'student',
          full_name: formData.name,
          department: formData.department,
          year: parseInt(formData.year),
          phone: formData.phone,
          is_active: true
        }])
        .select()
        .single()

      if (credError) {
        console.error('Error creating credentials:', credError)
        throw new Error('Failed to create login credentials')
      }

      // Save student to database
      setProcessingStatus('Saving student to database...')
      const { error } = await supabase
        .from('students')
        .insert([{
          student_id: formData.student_id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          year: parseInt(formData.year),
          face_embedding: faceEmbedding,
          user_credential_id: credential.id,
          enrolled_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Error saving student:', error)
        // Rollback credentials if student creation fails
        await supabase.from('user_credentials').delete().eq('id', credential.id)
        alert('Failed to save student: ' + error.message)
      } else {
        setShowModal(false)
        
        // Show credentials to admin
        setSelectedCredentials({
          student_id: formData.student_id,
          name: formData.name,
          email: formData.email,
          password: generatedPassword
        })
        setShowCredentialsModal(true)
        
        resetForm()
        fetchStudents()
      }
    } catch (error) {
      console.error('Error adding student:', error)
      alert('Failed to add student: ' + error.message)
    } finally {
      setLoading(false)
      setIsProcessing(false)
      setProcessingStatus('')
    }
  }

  const handleEdit = (student) => {
    setEditMode(true)
    setEditingStudent(student)
    setFormData({
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      department: student.department,
      year: student.year.toString()
    })
    setShowModal(true)
  }

  const handleViewCredentials = async (student) => {
    try {
      const { data, error } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('user_id', student.student_id)
        .single()

      if (error) throw error

      if (data) {
        setSelectedCredentials({
          student_id: data.user_id,
          name: data.full_name,
          email: data.email,
          password: '••••••••••••',
          note: 'Password is hashed and cannot be retrieved. Contact admin to reset.',
          hasCredentials: true
        })
        setShowCredentialsModal(true)
      } else {
        alert('No credentials found for this student')
      }
    } catch (error) {
      console.error('Error fetching credentials:', error)
      alert('Failed to fetch credentials')
    }
  }

  const handleRegeneratePassword = async () => {
    if (!selectedCredentials || !selectedCredentials.student_id) return

    const confirmMessage = `Are you sure you want to regenerate password for ${selectedCredentials.name}?\n\nThe old password will no longer work.`
    if (!confirm(confirmMessage)) return

    try {
      setLoading(true)
      
      // Generate new password
      const newPassword = generatePassword()
      const hashedPassword = await hashPassword(newPassword)

      // Update password in database
      const { error } = await supabase
        .from('user_credentials')
        .update({ password_hash: hashedPassword })
        .eq('user_id', selectedCredentials.student_id)

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

  const handleDelete = async (student) => {
    const confirmMessage = `Are you sure you want to delete student "${student.name}" (${student.student_id})?\n\nThis will also delete:\n- All attendance records\n- Face verification data\n\nThis action cannot be undone.`
    
    if (!confirm(confirmMessage)) return

    try {
      setLoading(true)
      
      // Delete student (cascade will handle related records)
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('student_id', student.student_id)

      if (error) throw error
      
      alert('Student deleted successfully')
      fetchStudents()
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Failed to delete student: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      student_id: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      year: ''
    })
    setCapturedImages([])
    setEditMode(false)
    setEditingStudent(null)
  }

  const handleModalClose = () => {
    setShowModal(false)
    resetForm()
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="loading">Loading students...</div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Students Management</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={20} />
          Add Student
        </button>
      </div>

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Department</th>
              <th>Year</th>
              <th>Face Data</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">No students found</td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.student_id}</td>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.phone}</td>
                  <td>{student.department}</td>
                  <td>{student.year}</td>
                  <td>
                    <span className={`badge ${student.face_embedding ? 'success' : 'warning'}`}>
                      {student.face_embedding ? 'Registered' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleEdit(student)}
                        title="Edit Student Details"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon info" 
                        onClick={() => handleViewCredentials(student)}
                        title="View Login Credentials"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => handleDelete(student)}
                        title="Delete Student"
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

      {showModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editMode ? 'Edit Student Details' : 'Add New Student'}</h2>
            {editMode && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#fef3c7', 
                borderRadius: '8px', 
                marginBottom: '20px',
                fontSize: '14px',
                color: '#92400e'
              }}>
                <strong>Note:</strong> You can only update student details. Face verification data cannot be modified.
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Student ID *</label>
                <input
                  type="text"
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                  required
                  disabled={isProcessing || editMode}
                  style={editMode ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                />
                {editMode && (
                  <small style={{ color: '#6b7280', fontSize: '12px' }}>Student ID cannot be changed</small>
                )}
              </div>

              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  disabled={isProcessing}
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  disabled={isProcessing}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={isProcessing}
                />
              </div>

              <div className="form-group">
                <label>Department *</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  required
                  disabled={isProcessing}
                />
              </div>

              <div className="form-group">
                <label>Year *</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  required
                  disabled={isProcessing}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              {!editMode && (
                <div className="form-group">
                  <label>Face Images *</label>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                    Capture 3-5 images from different angles for accurate verification
                  </p>
                  
                  {capturedImages.length === 0 ? (
                    <button 
                      type="button" 
                      onClick={() => setShowCamera(true)}
                      className="camera-button"
                      disabled={isProcessing}
                    >
                      <Camera size={20} />
                      Start Camera Capture
                    </button>
                  ) : (
                    <div className="captured-images-summary">
                      <div className="images-preview-grid">
                        {capturedImages.map((img, index) => (
                          <div key={index} className="preview-thumbnail">
                            <img src={img} alt={`Capture ${index + 1}`} />
                          </div>
                        ))}
                      </div>
                      <div className="capture-summary-text">
                        <Check size={20} style={{ color: '#10b981' }} />
                        <span>{capturedImages.length} images captured successfully</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowCamera(true)}
                        className="camera-button-small"
                        disabled={isProcessing}
                      >
                        <Camera size={16} />
                        Recapture Images
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={handleModalClose} 
                  className="btn-secondary"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading || (!editMode && capturedImages.length === 0) || isProcessing}
                >
                  {loading ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Student' : 'Add Student')}
                </button>
              </div>
            </form>

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="processing-overlay">
                <div className="processing-content">
                  <div className="spinner"></div>
                  <h3>Processing Face Data</h3>
                  <p>{processingStatus}</p>
                  <div className="processing-steps">
                    <div className="step">
                      <div className="step-icon">📸</div>
                      <div className="step-text">Analyzing {capturedImages.length} images</div>
                    </div>
                    <div className="step">
                      <div className="step-icon">🤖</div>
                      <div className="step-text">Generating face embeddings</div>
                    </div>
                    <div className="step">
                      <div className="step-icon">💾</div>
                      <div className="step-text">Saving to database</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Camera Capture Overlay - Render outside modal */}
      {showCamera && (
        <CameraCapture
          onComplete={handleCameraComplete}
          onCancel={handleCameraCancel}
        />
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
              <h2 style={{ margin: '0 0 8px 0' }}>Student Login Credentials</h2>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                {selectedCredentials.note ? 'Existing credentials' : 'Save these credentials securely'}
              </p>
            </div>

            <div className="credential-box">
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>Student ID</strong>
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
                  {selectedCredentials.student_id}
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
                <strong>✅ Password Regenerated!</strong> This new password will only be shown once. Please save it securely and share with the student.
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
                <strong>⚠️ Important:</strong> This password will only be shown once. Please save it securely and share with the student.
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
                  const text = `Student Login Credentials\n\nStudent ID: ${selectedCredentials.student_id}\nEmail: ${selectedCredentials.email}\nPassword: ${selectedCredentials.password}\n\nPlease keep these credentials safe.`
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
