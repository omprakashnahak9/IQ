import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, Users, ClipboardCheck, AlertTriangle, FileText, UserCog, LogOut } from 'lucide-react'

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Gate Verification</h2>
          <p className="user-email">{user?.email}</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/students" className={({ isActive }) => isActive ? 'active' : ''}>
            <Users size={20} />
            <span>Students</span>
          </NavLink>
          <NavLink to="/attendance" className={({ isActive }) => isActive ? 'active' : ''}>
            <ClipboardCheck size={20} />
            <span>Attendance</span>
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
            <FileText size={20} />
            <span>Reports</span>
          </NavLink>
          <NavLink to="/staff" className={({ isActive }) => isActive ? 'active' : ''}>
            <UserCog size={20} />
            <span>Staff</span>
          </NavLink>
          <NavLink to="/compliance" className={({ isActive }) => isActive ? 'active' : ''}>
            <AlertTriangle size={20} />
            <span>Compliance</span>
          </NavLink>
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
