import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AlertTriangle, Shield, Eye, Filter } from 'lucide-react'

export default function Compliance() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchComplianceIssues()
  }, [typeFilter])

  const fetchComplianceIssues = async () => {
    try {
      let query = supabase
        .from('compliance_logs')
        .select('*, students(student_id, name, department)')
        .order('timestamp', { ascending: false })

      if (typeFilter !== 'all') {
        query = query.eq('issue_type', typeFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setIssues(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching compliance issues:', error)
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'secondary'
    }
  }

  const getIssueIcon = (type) => {
    switch (type) {
      case 'multiple_faces': return <Eye size={20} />
      case 'no_face': return <AlertTriangle size={20} />
      case 'suspicious': return <Shield size={20} />
      default: return <AlertTriangle size={20} />
    }
  }

  const stats = {
    total: issues.length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length
  }

  if (loading) {
    return <div className="loading">Loading compliance data...</div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Compliance & Anomalies</h1>
      </div>

      <div className="stats-row">
        <div className="stat-mini">
          <span className="stat-label">Total Issues</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-mini danger">
          <span className="stat-label">High Severity</span>
          <span className="stat-value">{stats.high}</span>
        </div>
        <div className="stat-mini warning">
          <span className="stat-label">Medium</span>
          <span className="stat-value">{stats.medium}</span>
        </div>
        <div className="stat-mini info">
          <span className="stat-label">Low</span>
          <span className="stat-value">{stats.low}</span>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <Filter size={20} />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="multiple_faces">Multiple Faces</option>
            <option value="no_face">No Face Detected</option>
            <option value="suspicious">Suspicious Activity</option>
            <option value="low_confidence">Low Confidence</option>
          </select>
        </div>
      </div>

      <div className="compliance-grid">
        {issues.length === 0 ? (
          <div className="no-data-card">
            <Shield size={48} />
            <h3>No compliance issues found</h3>
            <p>All verifications are within normal parameters</p>
          </div>
        ) : (
          issues.map((issue) => (
            <div key={issue.id} className="compliance-card">
              <div className="compliance-header">
                <div className={`compliance-icon ${getSeverityColor(issue.severity)}`}>
                  {getIssueIcon(issue.issue_type)}
                </div>
                <div className="compliance-info">
                  <h3>{issue.issue_type.replace('_', ' ').toUpperCase()}</h3>
                  <p className="compliance-time">
                    {new Date(issue.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className={`badge ${getSeverityColor(issue.severity)}`}>
                  {issue.severity}
                </span>
              </div>

              <div className="compliance-body">
                <p className="compliance-description">{issue.description}</p>
                
                {issue.students && (
                  <div className="compliance-student">
                    <strong>Student:</strong> {issue.students.name} ({issue.students.student_id})
                    <br />
                    <strong>Department:</strong> {issue.students.department}
                  </div>
                )}

                {issue.details && (
                  <div className="compliance-details">
                    <strong>Details:</strong>
                    <pre>{JSON.stringify(issue.details, null, 2)}</pre>
                  </div>
                )}
              </div>

              <div className="compliance-footer">
                <span className={`status-badge ${issue.resolved ? 'success' : 'pending'}`}>
                  {issue.resolved ? 'Resolved' : 'Pending'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
