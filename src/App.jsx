import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider'
import { useAuth } from './lib/auth'
import Dashboard from './pages/Dashboard'
import Review from './pages/Review'
import History from './pages/History'
import Login from './pages/Login'
import './index.css'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="page">
        <div className="loading"><div className="spinner" /></div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  const isReviewer = profile?.role === 'reviewer'
  const home = isReviewer ? '/review' : '/dashboard'

  return (
    <Routes>
      <Route path="/" element={<Navigate to={home} replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/review" element={<Review />} />
      <Route path="/history" element={<History />} />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
