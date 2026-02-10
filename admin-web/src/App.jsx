import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Attendance from './pages/Attendance'
import Compliance from './pages/Compliance'
import Reports from './pages/Reports'
import StaffManagement from './pages/StaffManagement'
import Layout from './components/Layout'
import './App.css'

const queryClient = new QueryClient()

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading">Loading...</div>
  }
  
  return user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="reports" element={<Reports />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="compliance" element={<Compliance />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
