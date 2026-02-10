import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    verificationSuccess: 0,
    complianceIssues: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Get total students
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0]
      const { count: attendanceCount } = await supabase
        .from('gate_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', today)
        .eq('verified', true)

      // Get verification success rate
      const { count: successCount } = await supabase
        .from('gate_logs')
        .select('*', { count: 'exact', head: true })
        .eq('verified', true)

      // Get compliance issues
      const { count: complianceCount } = await supabase
        .from('compliance_logs')
        .select('*', { count: 'exact', head: true })

      // Get recent activity
      const { data: recentLogs } = await supabase
        .from('gate_logs')
        .select('*, students(name, student_id)')
        .order('timestamp', { ascending: false })
        .limit(5)

      setStats({
        totalStudents: studentCount || 0,
        todayAttendance: attendanceCount || 0,
        verificationSuccess: successCount || 0,
        complianceIssues: complianceCount || 0
      })

      setRecentActivity(recentLogs || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  const chartData = [
    { day: 'Mon', attendance: 45 },
    { day: 'Tue', attendance: 52 },
    { day: 'Wed', attendance: 48 },
    { day: 'Thu', attendance: 61 },
    { day: 'Fri', attendance: 55 },
    { day: 'Sat', attendance: 30 },
    { day: 'Sun', attendance: 25 }
  ]

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Students</h3>
            <p className="stat-value">{stats.totalStudents}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Today's Attendance</h3>
            <p className="stat-value">{stats.todayAttendance}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf6' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Verification Success</h3>
            <p className="stat-value">{stats.verificationSuccess}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ef4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <h3>Compliance Issues</h3>
            <p className="stat-value">{stats.complianceIssues}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-card">
          <h2>Weekly Attendance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="attendance" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="activity-card">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <p className="no-data">No recent activity</p>
            ) : (
              recentActivity.map((log) => (
                <div key={log.id} className="activity-item">
                  <div className={`activity-status ${log.verified ? 'success' : 'failed'}`}>
                    {log.verified ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  </div>
                  <div className="activity-details">
                    <p className="activity-name">{log.students?.name || 'Unknown'}</p>
                    <p className="activity-time">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
