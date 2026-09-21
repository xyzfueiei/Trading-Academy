import { useEffect, useState } from 'react'
import { Mail, ShieldCheck, UserRound } from 'lucide-react'
import SiteNav from '../components/SiteNav'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Alert, Badge, Button, Spinner } from '../components/ui'
import { initials } from '../lib/utils'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    setName(profile?.full_name ?? profile?.name ?? '')
  }, [profile])

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)

    const value = name.trim()
    let result = await supabase.from('profiles').update({ full_name: value }).eq('id', user.id)
    if (result.error && /full_name|column/i.test(result.error.message)) {
      result = await supabase.from('profiles').update({ name: value }).eq('id', user.id)
    }

    setBusy(false)
    if (result.error) return setMessage({ tone: 'error', text: result.error.message })
    await refreshProfile()
    setMessage({ tone: 'success', text: 'Profile updated.' })
  }

  return <div className="app-shell"><SiteNav light /><main className="page-light">
    <div className="container page-head"><span className="eyebrow">Account</span><h1>Your profile.</h1><p>Keep your account details and access status visible in one place.</p></div>
    <div className="container profile-grid">
      <aside className="profile-aside">
        <div className="avatar">{initials(name || user?.email || '')}</div>
        <h2>{name || 'Your learning profile'}</h2>
        <p>{user?.email}</p>
        <Badge tone={profile?.payment_status === 'approved' ? 'success' : profile?.payment_status === 'rejected' ? 'danger' : 'warning'}>{profile?.payment_status || 'pending'} access</Badge>
        <div className="profile-security"><ShieldCheck size={16} color="var(--lime)" /> Your account is secured by Supabase Auth.</div>
      </aside>
      <section className="profile-form">
        <h2>Profile details</h2>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        <form className="form-stack" onSubmit={save}>
          <label className="field"><span>Display name</span><input maxLength={80} placeholder="How should we call you?" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="field"><span>Email address</span><div className="input-with-icon"><Mail size={15} /><input value={user?.email || ''} readOnly /></div><small>Email changes should be handled through your authentication provider.</small></label>
          <Button type="submit" size="lg" disabled={busy}>{busy ? <><Spinner /><span>Saving…</span></> : <><UserRound size={15} /> Save profile</>}</Button>
        </form>
      </section>
    </div>
  </main></div>
}
