import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Calendar, Download, Filter, CheckCircle, XCircle } from 'lucide-react'

export default function Attendance() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchAttendance()
  }, [dateFilter, statusFilter])

  const fetchAttendance = async () => {
    try {
      let query = supabase
        .from('gate_logs')
        .select('*, students(student_id, name, department)')
        .order('timestamp', { ascending: false })

      if (dateFilter) {
        const startOfDay = `${dateFilter}T00:00:00`
        const endOfDay = `${dateFilter}T23:59:59`
        query = query.gte('timestamp', startOfDay).lte('timestamp', endOfDay)
      }

      if (statusFilter !== 'all') {
        query = query.eq('verified', statusFilter === 'verified')
      }

      const { data, error } = await query

      if (error) throw error
      setLogs(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching attendance:', error)
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Student ID', 'Name', 'Department', 'Status', 'Confidence']
    const rows = logs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.students?.student_id || 'N/A',
      log.students?.name || 'Unknown',
      log.students?.department || 'N/A',
      log.verified ? 'Verified' : 'Failed',
      log.confidence ? `${(log.confidence * 100).toFixed(2)}%` : 'N/A'
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_${dateFilter}.csv`
    a.click()
  }

  const stats = {
    total: logs.length,
    verified: logs.filter(l => l.verified).length,
    failed: logs.filter(l => !l.verified).length
  }

  if (loading) {
    return <div className="loading">Loading attendance...</div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Attendance Records</h1>
        <button onClick={exportToCSV} className="btn-primary">
          <Download size={20} />
          Export CSV
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-mini">
          <span className="stat-label">Total</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-mini success">
          <span className="stat-label">Verified</span>
          <span className="stat-value">{stats.verified}</span>
        </div>
        <div className="stat-mini danger">
          <span className="stat-label">Failed</span>
          <span className="stat-value">{stats.failed}</span>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <Calendar size={20} />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={20} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Student ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Status</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">No attendance records found</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.students?.student_id || 'N/A'}</td>
                  <td>{log.students?.name || 'Unknown'}</td>
                  <td>{log.students?.department || 'N/A'}</td>
                  <td>
                    <span className={`badge ${log.verified ? 'success' : 'danger'}`}>
                      {log.verified ? (
                        <>
                          <CheckCircle size={14} />
                          Verified
                        </>
                      ) : (
                        <>
                          <XCircle size={14} />
                          Failed
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    {log.confidence ? `${(log.confidence * 100).toFixed(2)}%` : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
