import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { 
  FileText, Download, Calendar, Users, TrendingUp, 
  Clock, CheckCircle, XCircle, Filter, BarChart3 
} from 'lucide-react'

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  
  // Report Data
  const [reportData, setReportData] = useState({
    overview: {
      totalStudents: 0,
      enrolledStudents: 0,
      totalAttendance: 0,
      averageAttendance: 0,
      verificationSuccess: 0,
      verificationFailed: 0
    },
    departmentStats: [],
    yearStats: [],
    dailyAttendance: [],
    topAttendees: [],
    lowAttendees: [],
    peakHours: [],
    complianceIssues: 0
  })

  useEffect(() => {
    fetchReportData()
  }, [dateRange, selectedDepartment, selectedYear])

  const fetchReportData = async () => {
    try {
      setLoading(true)

      // Fetch all students
      let studentsQuery = supabase.from('students').select('*')
      if (selectedDepartment !== 'all') {
        studentsQuery = studentsQuery.eq('department', selectedDepartment)
      }
      if (selectedYear !== 'all') {
        studentsQuery = studentsQuery.eq('year', parseInt(selectedYear))
      }
      const { data: students } = await studentsQuery

      // Fetch attendance logs in date range
      let logsQuery = supabase
        .from('gate_logs')
        .select('*, students(*)')
        .gte('timestamp', `${dateRange.startDate}T00:00:00`)
        .lte('timestamp', `${dateRange.endDate}T23:59:59`)
      
      const { data: logs } = await logsQuery

      // Filter logs by department/year if selected
      let filteredLogs = logs || []
      if (selectedDepartment !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.students?.department === selectedDepartment)
      }
      if (selectedYear !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.students?.year === parseInt(selectedYear))
      }

      // Fetch compliance issues
      const { data: compliance } = await supabase
        .from('compliance_logs')
        .select('*')
        .gte('timestamp', `${dateRange.startDate}T00:00:00`)
        .lte('timestamp', `${dateRange.endDate}T23:59:59`)

      // Calculate overview stats
      const enrolledStudents = students?.filter(s => s.face_embedding) || []
      const verifiedLogs = filteredLogs.filter(log => log.verified)
      const failedLogs = filteredLogs.filter(log => !log.verified)

      // Calculate department stats
      const deptStats = {}
      students?.forEach(student => {
        if (!deptStats[student.department]) {
          deptStats[student.department] = {
            department: student.department,
            totalStudents: 0,
            enrolled: 0,
            attendance: 0
          }
        }
        deptStats[student.department].totalStudents++
        if (student.face_embedding) deptStats[student.department].enrolled++
      })

      filteredLogs.forEach(log => {
        if (log.verified && log.students?.department) {
          if (deptStats[log.students.department]) {
            deptStats[log.students.department].attendance++
          }
        }
      })

      // Calculate year stats
      const yearStats = {}
      students?.forEach(student => {
        if (!yearStats[student.year]) {
          yearStats[student.year] = {
            year: student.year,
            totalStudents: 0,
            enrolled: 0,
            attendance: 0
          }
        }
        yearStats[student.year].totalStudents++
        if (student.face_embedding) yearStats[student.year].enrolled++
      })

      filteredLogs.forEach(log => {
        if (log.verified && log.students?.year) {
          if (yearStats[log.students.year]) {
            yearStats[log.students.year].attendance++
          }
        }
      })

      // Calculate daily attendance
      const dailyStats = {}
      filteredLogs.forEach(log => {
        if (log.verified) {
          const date = log.timestamp.split('T')[0]
          dailyStats[date] = (dailyStats[date] || 0) + 1
        }
      })

      const dailyAttendance = Object.entries(dailyStats)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Calculate student attendance counts
      const studentAttendance = {}
      filteredLogs.forEach(log => {
        if (log.verified && log.student_id) {
          studentAttendance[log.student_id] = (studentAttendance[log.student_id] || 0) + 1
        }
      })

      const attendanceWithNames = Object.entries(studentAttendance).map(([id, count]) => {
        const student = students?.find(s => s.student_id === id)
        return {
          student_id: id,
          name: student?.name || 'Unknown',
          department: student?.department || 'N/A',
          count
        }
      })

      const topAttendees = attendanceWithNames
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      const lowAttendees = attendanceWithNames
        .filter(a => a.count > 0)
        .sort((a, b) => a.count - b.count)
        .slice(0, 10)

      // Calculate peak hours
      const hourStats = {}
      filteredLogs.forEach(log => {
        if (log.verified) {
          const hour = new Date(log.timestamp).getHours()
          hourStats[hour] = (hourStats[hour] || 0) + 1
        }
      })

      const peakHours = Object.entries(hourStats)
        .map(([hour, count]) => ({ 
          hour: `${hour.padStart(2, '0')}:00`, 
          count 
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setReportData({
        overview: {
          totalStudents: students?.length || 0,
          enrolledStudents: enrolledStudents.length,
          totalAttendance: verifiedLogs.length,
          averageAttendance: students?.length > 0 
            ? (verifiedLogs.length / students.length).toFixed(2) 
            : 0,
          verificationSuccess: verifiedLogs.length,
          verificationFailed: failedLogs.length
        },
        departmentStats: Object.values(deptStats),
        yearStats: Object.values(yearStats).sort((a, b) => a.year - b.year),
        dailyAttendance,
        topAttendees,
        lowAttendees,
        peakHours,
        complianceIssues: compliance?.length || 0
      })

      setLoading(false)
    } catch (error) {
      console.error('Error fetching report data:', error)
      setLoading(false)
    }
  }

  const exportToCSV = (data, filename) => {
    const csv = convertToCSV(data)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return ''
    
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    )
    
    return [headers, ...rows].join('\n')
  }

  const exportFullReport = async () => {
    try {
      // Fetch detailed attendance data
      const { data: detailedLogs } = await supabase
        .from('gate_logs')
        .select('*, students(*)')
        .gte('timestamp', `${dateRange.startDate}T00:00:00`)
        .lte('timestamp', `${dateRange.endDate}T23:59:59`)
        .eq('verified', true)
        .order('timestamp', { ascending: false })

      const exportData = detailedLogs?.map(log => ({
        Date: new Date(log.timestamp).toLocaleDateString(),
        Time: new Date(log.timestamp).toLocaleTimeString(),
        'Student ID': log.student_id,
        'Student Name': log.students?.name || 'Unknown',
        Department: log.students?.department || 'N/A',
        Year: log.students?.year || 'N/A',
        'Confidence %': (log.confidence * 100).toFixed(1),
        'Gate Location': log.gate_location || 'Main Gate',
        Status: log.verified ? 'Verified' : 'Failed'
      })) || []

      exportToCSV(exportData, 'attendance_report')
    } catch (error) {
      console.error('Error exporting report:', error)
      alert('Failed to export report')
    }
  }

  if (loading) {
    return <div className="loading">Loading reports...</div>
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Detailed Reports</h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            Comprehensive analytics and insights for college administration
          </p>
        </div>
        <button onClick={exportFullReport} className="btn-primary">
          <Download size={20} />
          Export Full Report
        </button>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="filter-group">
          <label>
            <Calendar size={16} />
            Start Date
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
          />
        </div>

        <div className="filter-group">
          <label>
            <Calendar size={16} />
            End Date
          </label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
          />
        </div>

        <div className="filter-group">
          <label>
            <Filter size={16} />
            Department
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="all">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics">Electronics</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Civil">Civil</option>
            <option value="Electrical">Electrical</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <Filter size={16} />
            Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dbeafe' }}>
            <Users size={24} style={{ color: '#2563eb' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Students</p>
            <h3 className="stat-value">{reportData.overview.totalStudents}</h3>
            <p className="stat-detail">
              {reportData.overview.enrolledStudents} enrolled with face data
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7' }}>
            <CheckCircle size={24} style={{ color: '#16a34a' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Attendance</p>
            <h3 className="stat-value">{reportData.overview.totalAttendance}</h3>
            <p className="stat-detail">
              Avg: {reportData.overview.averageAttendance} per student
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}>
            <TrendingUp size={24} style={{ color: '#ca8a04' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Success Rate</p>
            <h3 className="stat-value">
              {reportData.overview.verificationSuccess + reportData.overview.verificationFailed > 0
                ? ((reportData.overview.verificationSuccess / 
                   (reportData.overview.verificationSuccess + reportData.overview.verificationFailed)) * 100).toFixed(1)
                : 0}%
            </h3>
            <p className="stat-detail">
              {reportData.overview.verificationFailed} failed attempts
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fee2e2' }}>
            <XCircle size={24} style={{ color: '#dc2626' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Compliance Issues</p>
            <h3 className="stat-value">{reportData.complianceIssues}</h3>
            <p className="stat-detail">Anomalies detected</p>
          </div>
        </div>
      </div>

      {/* Department Statistics */}
      <div className="report-section">
        <div className="section-header">
          <h2>
            <BarChart3 size={20} />
            Department-wise Statistics
          </h2>
          <button 
            onClick={() => exportToCSV(reportData.departmentStats, 'department_stats')}
            className="btn-secondary"
          >
            <Download size={16} />
            Export
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Students</th>
                <th>Enrolled</th>
                <th>Enrollment %</th>
                <th>Total Attendance</th>
                <th>Avg Attendance</th>
              </tr>
            </thead>
            <tbody>
              {reportData.departmentStats.map((dept, index) => (
                <tr key={index}>
                  <td><strong>{dept.department}</strong></td>
                  <td>{dept.totalStudents}</td>
                  <td>{dept.enrolled}</td>
                  <td>
                    <span className={`badge ${dept.enrolled / dept.totalStudents >= 0.8 ? 'success' : 'warning'}`}>
                      {((dept.enrolled / dept.totalStudents) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td>{dept.attendance}</td>
                  <td>{dept.totalStudents > 0 ? (dept.attendance / dept.totalStudents).toFixed(2) : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Year-wise Statistics */}
      <div className="report-section">
        <div className="section-header">
          <h2>
            <BarChart3 size={20} />
            Year-wise Statistics
          </h2>
          <button 
            onClick={() => exportToCSV(reportData.yearStats, 'year_stats')}
            className="btn-secondary"
          >
            <Download size={16} />
            Export
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Total Students</th>
                <th>Enrolled</th>
                <th>Enrollment %</th>
                <th>Total Attendance</th>
                <th>Avg Attendance</th>
              </tr>
            </thead>
            <tbody>
              {reportData.yearStats.map((year, index) => (
                <tr key={index}>
                  <td><strong>{year.year}{year.year === 1 ? 'st' : year.year === 2 ? 'nd' : year.year === 3 ? 'rd' : 'th'} Year</strong></td>
                  <td>{year.totalStudents}</td>
                  <td>{year.enrolled}</td>
                  <td>
                    <span className={`badge ${year.enrolled / year.totalStudents >= 0.8 ? 'success' : 'warning'}`}>
                      {((year.enrolled / year.totalStudents) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td>{year.attendance}</td>
                  <td>{year.totalStudents > 0 ? (year.attendance / year.totalStudents).toFixed(2) : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="reports-grid">
        {/* Top Attendees */}
        <div className="report-section">
          <div className="section-header">
            <h2>
              <TrendingUp size={20} />
              Top 10 Attendees
            </h2>
            <button 
              onClick={() => exportToCSV(reportData.topAttendees, 'top_attendees')}
              className="btn-secondary"
            >
              <Download size={16} />
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Days</th>
                </tr>
              </thead>
              <tbody>
                {reportData.topAttendees.map((student, index) => (
                  <tr key={index}>
                    <td>
                      <span className="rank-badge" style={{
                        backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : index === 2 ? '#f97316' : '#e5e7eb',
                        color: index < 3 ? '#fff' : '#374151',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}>
                        #{index + 1}
                      </span>
                    </td>
                    <td>{student.student_id}</td>
                    <td>{student.name}</td>
                    <td>{student.department}</td>
                    <td><strong>{student.count}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Attendees */}
        <div className="report-section">
          <div className="section-header">
            <h2>
              <XCircle size={20} />
              Low Attendance Alert
            </h2>
            <button 
              onClick={() => exportToCSV(reportData.lowAttendees, 'low_attendees')}
              className="btn-secondary"
            >
              <Download size={16} />
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.lowAttendees.map((student, index) => (
                  <tr key={index}>
                    <td>{student.student_id}</td>
                    <td>{student.name}</td>
                    <td>{student.department}</td>
                    <td><strong>{student.count}</strong></td>
                    <td>
                      <span className="badge danger">Low</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Peak Hours */}
      <div className="report-section">
        <div className="section-header">
          <h2>
            <Clock size={20} />
            Peak Entry Hours
          </h2>
          <button 
            onClick={() => exportToCSV(reportData.peakHours, 'peak_hours')}
            className="btn-secondary"
          >
            <Download size={16} />
          </button>
        </div>
        <div className="peak-hours-grid">
          {reportData.peakHours.map((hour, index) => (
            <div key={index} className="peak-hour-card">
              <div className="peak-hour-time">{hour.hour}</div>
              <div className="peak-hour-count">{hour.count} entries</div>
              <div className="peak-hour-bar" style={{
                width: `${(hour.count / reportData.peakHours[0]?.count) * 100}%`
              }}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Attendance Trend */}
      <div className="report-section">
        <div className="section-header">
          <h2>
            <FileText size={20} />
            Daily Attendance Trend
          </h2>
          <button 
            onClick={() => exportToCSV(reportData.dailyAttendance, 'daily_attendance')}
            className="btn-secondary"
          >
            <Download size={16} />
          </button>
        </div>
        <div className="daily-trend-container">
          {reportData.dailyAttendance.map((day, index) => (
            <div key={index} className="daily-trend-item">
              <div className="trend-date">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              <div className="trend-bar-container">
                <div 
                  className="trend-bar" 
                  style={{
                    height: `${(day.count / Math.max(...reportData.dailyAttendance.map(d => d.count))) * 100}%`
                  }}
                ></div>
              </div>
              <div className="trend-count">{day.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
