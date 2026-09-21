import { useEffect, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Alert, Button } from '../components/ui'
import { AuthLoading } from '../components/RouteGuards'
import { useAuth } from '../context/AuthContext'

function safeNext(value) {
  if (!value) return '/dashboard'
  try {
    const decoded = decodeURIComponent(value)
    return decoded.startsWith('/') && !decoded.startsWith('//') ? decoded : '/dashboard'
  } catch {
    return '/dashboard'
  }
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAdmin, loading, profileError } = useAuth()
  const next = safeNext(new URLSearchParams(location.search).get('next'))
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (user && !loading) navigate(isAdmin ? '/admin' : next, { replace: true })
  }, [user, isAdmin, loading, next, navigate])

  async function submit(event) {
    event.preventDefault()
    setMessage(null)

    const email = form.email.trim()
    if (!email || !form.password) {
      setMessage({ tone: 'error', text: 'Enter your email and password to continue.' })
      return
    }

    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: form.password })
    setBusy(false)

    if (error) {
      setMessage({ tone: 'error', text: error.message })
      return
    }

  }

  if (user) return <AuthLoading />

  return <div className="auth-page">
    <div className="auth-visual">
      <Link to="/" className="brand"><span className="brand-mark" /><span>TRADING ACADEMY</span></Link>
      <div>
        <span className="kicker">Return to your practice</span>
        <h1>Keep the signal. <em>Lose the noise.</em></h1>
        <p>Your library, your notes, your next lesson—right where you left them.</p>
      </div>
      <span className="footer-bottom auth-caption">SECURE ACCOUNT ACCESS · EDUCATION FIRST</span>
    </div>

    <div className="auth-form-wrap">
      <div className="auth-form">
        <Link to="/" className="back-link"><ArrowLeft size={14} /> Back to home</Link>
        <h2>Welcome back.</h2>
        <p>Sign in to continue your learning path.</p>
        {profileError && <Alert tone="info">Your session can still be restored, but your profile could not be loaded yet. Please try again after signing in.</Alert>}
        {message && <Alert tone={message.tone}>{message.text}</Alert>}

        <form className="form-stack" onSubmit={submit}>
          <label className="field">
            <span>Email address</span>
            <input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label className="field">
            <span>Password</span>
            <div className="password-wrap">
              <input type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              <button type="button" className="password-toggle" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((value) => !value)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </label>
          <Button type="submit" size="lg" disabled={busy}>{busy ? 'Signing in…' : <><LockKeyhole size={15} /> Sign in</>}</Button>
        </form>
        <p className="auth-switch">New here? <Link to="/signup">Create an account</Link></p>
      </div>
    </div>
  </div>
}
