import { useEffect, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, UserPlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Alert, Button } from '../components/ui'
import { AuthLoading } from '../components/RouteGuards'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const navigate = useNavigate()
  const { user, isAdmin, loading } = useAuth()
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [form, setForm] = useState({ email: '', password: '', confirm: '' })

  useEffect(() => {
    if (user && !loading) navigate(isAdmin ? '/admin' : '/dashboard', { replace: true })
  }, [user, isAdmin, loading, navigate])

  async function submit(event) {
    event.preventDefault()
    setMessage(null)

    const email = form.email.trim()
    if (!email || !form.password) {
      setMessage({ tone: 'error', text: 'Enter an email and password to continue.' })
      return
    }
    if (form.password.length < 8) {
      setMessage({ tone: 'error', text: 'Use at least 8 characters for your password.' })
      return
    }
    if (form.password !== form.confirm) {
      setMessage({ tone: 'error', text: 'Your passwords do not match.' })
      return
    }

    setBusy(true)
    const { data, error } = await supabase.auth.signUp({ email, password: form.password })
    setBusy(false)

    if (error) {
      setMessage({ tone: 'error', text: error.message })
      return
    }

    if (data.session) return

    setMessage({ tone: 'success', text: 'Account created. Check your email if confirmation is enabled, then return here to sign in.' })
    setForm({ email, password: '', confirm: '' })
  }

  if (user) return <AuthLoading />

  return <div className="auth-page">
    <div className="auth-visual">
      <Link to="/" className="brand"><span className="brand-mark" /><span>TRADING ACADEMY</span></Link>
      <div>
        <span className="kicker">Start with a strong foundation</span>
        <h1>Your process starts <em>with a question.</em></h1>
        <p>Create a private learning workspace designed to help you study markets with more context and less noise.</p>
      </div>
      <span className="footer-bottom auth-caption">NO PERFORMANCE PROMISES · JUST THE WORK</span>
    </div>

    <div className="auth-form-wrap">
      <div className="auth-form">
        <Link to="/" className="back-link"><ArrowLeft size={14} /> Back to home</Link>
        <h2>Make a start.</h2>
        <p>Your learning workspace takes less than a minute to set up.</p>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        <form className="form-stack" onSubmit={submit}>
          <label className="field"><span>Email address</span><input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label className="field"><span>Password</span><div className="password-wrap"><input type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button type="button" className="password-toggle" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((value) => !value)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          <label className="field"><span>Confirm password</span><input type="password" autoComplete="new-password" placeholder="Repeat your password" value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} /></label>
          <Button type="submit" size="lg" disabled={busy}>{busy ? 'Creating account…' : <><UserPlus size={15} /> Create account</>}</Button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  </div>
}
