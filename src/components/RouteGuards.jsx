import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Alert, Button, Spinner } from './ui'
import { Link } from 'react-router-dom'

export function AuthLoading() {
  return <div className="loading-screen">
    <div className="loader-box">
      <span className="brand"><span className="brand-mark" /><span>TRADING ACADEMY</span></span>
      <Spinner label="Restoring session" />
      <span>Restoring your workspace…</span>
    </div>
  </div>
}

export function AuthConfigError({ message }) {
  return <div className="loading-screen">
    <div className="loader-box auth-config-box">
      <span className="brand"><span className="brand-mark" /><span>TRADING ACADEMY</span></span>
      <Alert tone="error">{message}</Alert>
      <Link to="/"><Button variant="outline-dark">Back to home</Button></Link>
    </div>
  </div>
}

export function ProtectedRoute({ children, admin = false, access = false }) {
  const { user, profile, loading, profileError, hasAccess } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoading />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`} replace />
  if (!profile) return <AuthConfigError message={profileError || 'Your authenticated account does not have a profile record yet. Check the Supabase profile trigger/RLS configuration and refresh the page.'} />
  if (admin && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  if (access && !hasAccess) return <Navigate to="/payment" replace />
  return children
}
