import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Edit3,
  Eye,
  FileText,
  LibraryBig,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Trash2,
  Users,
  WalletCards,
  X,
  Youtube,
} from 'lucide-react'
import SiteNav from '../components/SiteNav'
import { supabase } from '../lib/supabase'
import { Alert, Badge, Button, EmptyState, Spinner } from '../components/ui'
import { formatDate, formatDateTime, paymentTimestamp, youtubeId, youtubeThumbnail } from '../lib/api'

const tabs = [
  ['overview', 'Overview'],
  ['users', 'Users'],
  ['payments', 'Payments'],
  ['methods', 'Payment methods'],
  ['courses', 'Courses'],
  ['modules', 'Modules'],
  ['lessons', 'Lessons'],
  ['settings', 'Settings'],
]

const emptyData = { users: [], payments: [], methods: [], courses: [], modules: [], lessons: [] }

export default function Admin() {
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [loadError, setLoadError] = useState('')

  async function load() {
    setLoading(true)
    setLoadError('')
    try {
      const queries = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*').order('id', { ascending: false }),
        supabase.from('payment_methods').select('*').order('display_order', { ascending: true, nullsFirst: false }),
        supabase.from('courses').select('*').order('display_order', { ascending: true, nullsFirst: false }),
        supabase.from('modules').select('*').order('display_order', { ascending: true, nullsFirst: false }),
        supabase.from('lessons').select('*').order('display_order', { ascending: true, nullsFirst: false }),
      ])
      const failed = queries.find((result) => result.error)
      if (failed?.error) throw failed.error
      const [users, payments, methods, courses, modules, lessons] = queries
      setData({ users: users.data || [], payments: payments.data || [], methods: methods.data || [], courses: courses.data || [], modules: modules.data || [], lessons: lessons.data || [] })
    } catch (error) {
      setLoadError(error.message || 'Unable to load the admin workspace.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function updatePayment(id, status) {
    setMessage(null)
    const payment = data.payments.find((item) => String(item.id) === String(id))
    if (!payment) return

    if (!window.confirm(status === 'approved' ? 'Approve this payment and grant course access to the submitting user?' : 'Reject this payment?')) return

    const reviewedAt = new Date().toISOString()
    let paymentUpdate = await supabase.from('payments').update({ status, reviewed_at: reviewedAt }).eq('id', id)
    if (paymentUpdate.error && /reviewed_at.*does not exist|column.*reviewed_at|reviewed_at/i.test(paymentUpdate.error.message || '')) {
      paymentUpdate = await supabase.from('payments').update({ status }).eq('id', id)
    }
    if (paymentUpdate.error) return setMessage({ tone: 'error', text: paymentUpdate.error.message })

    if (status === 'approved') {
      let profileUpdate = await supabase.from('profiles').update({ payment_status: 'approved', updated_at: reviewedAt }).eq('id', payment.user_id)
      if (profileUpdate.error && /updated_at.*does not exist|column.*updated_at|updated_at/i.test(profileUpdate.error.message || '')) {
        profileUpdate = await supabase.from('profiles').update({ payment_status: 'approved' }).eq('id', payment.user_id)
      }
      if (profileUpdate.error) {
        let rollback = await supabase.from('payments').update({ status: 'pending', reviewed_at: null }).eq('id', id)
        if (rollback.error && /reviewed_at.*does not exist|column.*reviewed_at|reviewed_at/i.test(rollback.error.message || '')) {
          rollback = await supabase.from('payments').update({ status: 'pending' }).eq('id', id)
        }
        return setMessage({ tone: 'error', text: `Payment was not kept approved because user access could not be updated: ${profileUpdate.error.message}` })
      }
    }

    setMessage({ tone: 'success', text: status === 'approved' ? 'Payment approved and user access updated.' : 'Payment rejected. Existing approved access, if any, was left unchanged.' })
    await load()
  }

  async function deleteRow(table, id) {
    if (!window.confirm('Delete this record? This cannot be undone.')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return setMessage({ tone: 'error', text: error.message })
    setMessage({ tone: 'success', text: 'Record deleted.' })
    await load()
  }

  async function reorder(table, rows, index, direction) {
    const nextIndex = direction === 'up' ? index - 1 : index + 1
    if (nextIndex < 0 || nextIndex >= rows.length) return
    const current = rows[index]
    const next = rows[nextIndex]
    const currentOrder = Number(current.display_order ?? index + 1)
    const nextOrder = Number(next.display_order ?? nextIndex + 1)

    const first = await supabase.from(table).update({ display_order: nextOrder }).eq('id', current.id)
    if (first.error) return setMessage({ tone: 'error', text: first.error.message })
    const second = await supabase.from(table).update({ display_order: currentOrder }).eq('id', next.id)
    if (second.error) return setMessage({ tone: 'error', text: second.error.message })
    await load()
  }

  return <div className="app-shell">
    <SiteNav light />
    <main className="admin-shell">
      <section className="admin-top"><div className="container"><div className="admin-topline"><div><span className="eyebrow">Authorized workspace</span><h1>Admin control room.</h1><p>Manage access, payments, and the learning catalogue without bypassing Supabase policies.</p></div><Button variant="ghost" size="sm" onClick={load} disabled={loading}><RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh</Button></div><div className="admin-tabs" role="tablist">{tabs.map(([value, label]) => <button type="button" key={value} className={`admin-tab ${tab === value ? 'active' : ''}`} onClick={() => setTab(value)} role="tab" aria-selected={tab === value}>{label}</button>)}</div></div></section>
      <div className="container admin-content">
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        {loadError && <Alert tone="error">{loadError}</Alert>}
        {loading ? <div className="empty-state"><Spinner /><p>Loading admin workspace…</p></div> : <>
          {tab === 'overview' && <Overview data={data} setTab={setTab} />}
          {tab === 'users' && <UsersAdmin rows={data.users} />}
          {tab === 'payments' && <Payments rows={data.payments} users={data.users} onStatus={updatePayment} />}
          {tab === 'methods' && <Methods rows={data.methods} reload={load} remove={deleteRow} setMessage={setMessage} reorder={reorder} />}
          {tab === 'courses' && <CoursesAdmin rows={data.courses} reload={load} remove={deleteRow} setMessage={setMessage} reorder={reorder} />}
          {tab === 'modules' && <ModulesAdmin rows={data.modules} courses={data.courses} reload={load} remove={deleteRow} setMessage={setMessage} reorder={reorder} />}
          {tab === 'lessons' && <LessonsAdmin rows={data.lessons} modules={data.modules} courses={data.courses} reload={load} remove={deleteRow} setMessage={setMessage} reorder={reorder} />}
          {tab === 'settings' && <SettingsAdmin data={data} />}
        </>}
      </div>
    </main>
  </div>
}

function Overview({ data, setTab }) {
  const pending = data.payments.filter((item) => item.status === 'pending').length
  const approvedUsers = data.users.filter((item) => item.payment_status === 'approved').length
  const pendingUsers = data.users.filter((item) => item.payment_status === 'pending').length
  return <>
    <div className="admin-stat-grid">
      <Stat label="Total users" value={data.users.length} icon={<Users size={15} />} />
      <Stat label="Approved users" value={approvedUsers} icon={<Check size={15} />} />
      <Stat label="Pending users" value={pendingUsers} icon={<WalletCards size={15} />} />
      <Stat label="Pending payments" value={pending} icon={<WalletCards size={15} />} />
      <Stat label="Courses" value={data.courses.length} icon={<LibraryBig size={15} />} />
      <Stat label="Modules" value={data.modules.length} icon={<LibraryBig size={15} />} />
      <Stat label="Lessons" value={data.lessons.length} icon={<FileText size={15} />} />
      <Stat label="Active networks" value={data.methods.filter((item) => item.is_active).length} icon={<WalletCards size={15} />} />
    </div>
    <div className="admin-panel"><h2>Operating notes</h2><div className="principles" style={{ borderColor: 'var(--line-dark)' }}><div className="principle"><span>01</span><div><h3>Access is explicit</h3><p>A learner's course access follows the approved payment status in the database, never a frontend-only flag.</p></div></div><div className="principle"><span>02</span><div><h3>Payment review is manual</h3><p>User-submitted transaction details remain pending until an authorized administrator reviews them.</p></div></div><div className="principle"><span>03</span><div><h3>Content is yours to shape</h3><p>Use the catalogue tools to organize courses, modules, lessons, publication status, and YouTube URLs.</p></div></div></div><div className="admin-quick-actions"><Button onClick={() => setTab('payments')}>Review payments <ChevronDown size={14} /></Button><Button variant="outline-dark" onClick={() => setTab('courses')}>Manage catalogue</Button><Button variant="outline-dark" onClick={() => setTab('users')}>View users</Button></div></div>
  </>
}

function Stat({ label, value, icon }) { return <div className="admin-stat"><span style={{ display: 'flex', justifyContent: 'space-between' }}>{label}{icon}</span><strong>{value}</strong></div> }

function UsersAdmin({ rows }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const filtered = useMemo(() => rows.filter((row) => {
    const haystack = `${row.email || ''} ${row.id || ''} ${row.role || ''}`.toLowerCase()
    return haystack.includes(query.toLowerCase()) && (status === 'all' || row.payment_status === status)
  }), [rows, query, status])
  return <div className="admin-panel"><AdminHeader title="Users" count={`${filtered.length} shown`}><div className="admin-toolbar"><label className="search-field"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search email or user ID" /></label><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All access statuses</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option></select></div></AdminHeader>{filtered.length ? <TableWrap><table className="admin-table"><thead><tr><th>Email</th><th>Role</th><th>Access</th><th>Created</th><th>Updated</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id}><td><strong>{row.email || 'Email unavailable'}</strong><br /><small>{row.id}</small></td><td><Badge tone={row.role === 'admin' ? 'info' : 'muted'}>{row.role || 'user'}</Badge></td><td><AccessBadge status={row.payment_status} /></td><td>{formatDate(row.created_at)}</td><td>{formatDate(row.updated_at)}</td></tr>)}</tbody></table></TableWrap> : <EmptyState icon={<Users size={24} />} title="No users found" body="Try changing the search or access filter." />}</div>
}

function Payments({ rows, users, onStatus }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const userMap = useMemo(() => new Map(users.map((user) => [String(user.id), user])), [users])
  const filtered = useMemo(() => rows.filter((row) => {
    const user = userMap.get(String(row.user_id))
    const haystack = `${row.txid || ''} ${row.network || row.network_name || ''} ${user?.email || ''}`.toLowerCase()
    return haystack.includes(query.toLowerCase()) && (status === 'all' || row.status === status)
  }), [rows, userMap, query, status])
  return <div className="admin-panel"><AdminHeader title="Payment queue" count={`${filtered.length} shown`}><div className="admin-toolbar"><label className="search-field"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search email, network, TXID" /></label><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div></AdminHeader>{filtered.length ? <TableWrap><table className="admin-table"><thead><tr><th>Submitted</th><th>User</th><th>Network</th><th>Amount</th><th>TXID</th><th>Status</th><th>Review</th></tr></thead><tbody>{filtered.map((payment) => { const user = userMap.get(String(payment.user_id)); return <tr key={payment.id}><td>{formatDateTime(paymentTimestamp(payment))}</td><td><strong>{user?.email || 'User'}</strong><br /><small>{payment.user_id}</small></td><td>{payment.network || payment.network_name || '—'}</td><td>{payment.amount || '—'} USDT</td><td><small className="mono-wrap">{payment.txid || payment.transaction_id || '—'}</small></td><td><AccessBadge status={payment.status} /></td><td><div className="table-actions">{payment.status !== 'approved' && <Button size="sm" onClick={() => onStatus(payment.id, 'approved')}><Check size={12} /> Approve</Button>}{payment.status !== 'rejected' && <Button variant="danger" size="sm" onClick={() => onStatus(payment.id, 'rejected')}><X size={12} /> Reject</Button>}</div></td></tr> })}</tbody></table></TableWrap> : <EmptyState icon={<WalletCards size={24} />} title="No payment records" body="Submitted payments will appear here for review." />}</div>
}

function Methods({ rows, reload, remove, setMessage, reorder }) {
  const blank = { id: null, network_name: 'TRC20', token_name: 'USDT', wallet_address: '', display_order: rows.length + 1, is_active: true }
  const [form, setForm] = useState(blank)
  const editing = Boolean(form.id)

  async function save(event) {
    event.preventDefault()
    setMessage(null)
    if (!form.network_name.trim() || !form.token_name.trim() || !form.wallet_address.trim()) return setMessage({ tone: 'error', text: 'Network, token, and wallet address are required.' })
    const payload = { network_name: form.network_name.trim(), token_name: form.token_name.trim(), wallet_address: form.wallet_address.trim(), display_order: Number(form.display_order) || 1, is_active: Boolean(form.is_active) }
    const result = editing ? await supabase.from('payment_methods').update(payload).eq('id', form.id) : await supabase.from('payment_methods').insert(payload)
    if (result.error) return setMessage({ tone: 'error', text: result.error.message })
    setMessage({ tone: 'success', text: editing ? 'Payment method updated.' : 'Payment method added.' })
    setForm({ ...blank, display_order: rows.length + 1 })
    await reload()
  }

  async function toggle(row) {
    const { error } = await supabase.from('payment_methods').update({ is_active: !row.is_active }).eq('id', row.id)
    if (error) return setMessage({ tone: 'error', text: error.message })
    await reload()
  }

  return <>
    <div className="admin-panel"><AdminHeader title={editing ? 'Edit payment method' : 'Add a payment method'} count="USDT only" /><form className="admin-form-grid" onSubmit={save}><Field label="Network" value={form.network_name} onChange={(value) => setForm({ ...form, network_name: value })} /><Field label="Token" value={form.token_name} onChange={(value) => setForm({ ...form, token_name: value })} /><Field label="Wallet address" wide value={form.wallet_address} onChange={(value) => setForm({ ...form, wallet_address: value })} placeholder="Paste the production wallet address" /><Field label="Display order" type="number" value={form.display_order} onChange={(value) => setForm({ ...form, display_order: value })} /><label className="field checkbox-field"><span>Published to learners</span><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /></label><div className="admin-form-actions"><Button type="submit">{editing ? <><Save size={14} /> Save method</> : <><Plus size={14} /> Add method</>}</Button>{editing && <Button type="button" variant="outline-dark" onClick={() => setForm({ ...blank, display_order: rows.length + 1 })}>Cancel</Button>}</div></form></div>
    <div className="admin-panel"><AdminHeader title="Payment methods" count={`${rows.length} total`} />{rows.length ? <TableWrap><table className="admin-table"><thead><tr><th>Network</th><th>Token</th><th>Wallet</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.id}><td>{row.network_name}</td><td>{row.token_name}</td><td><small className="mono-wrap">{row.wallet_address}</small></td><td><Badge tone={row.is_active ? 'success' : 'muted'}>{row.is_active ? 'active' : 'hidden'}</Badge></td><td>{row.display_order ?? '—'}</td><td><RowActions onEdit={() => setForm(row)} onToggle={() => toggle(row)} toggleLabel={row.is_active ? 'Hide' : 'Publish'} onUp={() => reorder('payment_methods', rows, index, 'up')} onDown={() => reorder('payment_methods', rows, index, 'down')} onDelete={() => remove('payment_methods', row.id)} /></td></tr>)}</tbody></table></TableWrap> : <EmptyState title="No payment methods" body="Add the first production USDT network above." />}</div>
  </>
}

function CoursesAdmin({ rows, reload, remove, setMessage, reorder }) {
  const blank = { id: null, title: '', description: '', level: 'Foundations', display_order: rows.length + 1, is_published: true }
  const [form, setForm] = useState(blank)
  const editing = Boolean(form.id)
  async function save(event) {
    event.preventDefault()
    if (!form.title.trim()) return setMessage({ tone: 'error', text: 'Course title is required.' })
    const payload = { title: form.title.trim(), description: form.description.trim(), level: form.level.trim(), display_order: Number(form.display_order) || 1, is_published: Boolean(form.is_published) }
    const result = editing ? await supabase.from('courses').update(payload).eq('id', form.id) : await supabase.from('courses').insert(payload)
    if (result.error) return setMessage({ tone: 'error', text: result.error.message })
    setMessage({ tone: 'success', text: editing ? 'Course updated.' : 'Course created.' }); setForm({ ...blank, display_order: rows.length + 1 }); await reload()
  }
  async function toggle(row) { const { error } = await supabase.from('courses').update({ is_published: !row.is_published }).eq('id', row.id); if (error) return setMessage({ tone: 'error', text: error.message }); reload() }
  return <>
    <div className="admin-panel"><AdminHeader title={editing ? 'Edit course' : 'Create a course'} count="Course catalogue" /><form className="admin-form-grid" onSubmit={save}><Field label="Title" wide value={form.title} onChange={(value) => setForm({ ...form, title: value })} required /><Field label="Level" value={form.level} onChange={(value) => setForm({ ...form, level: value })} /><Field label="Display order" type="number" value={form.display_order} onChange={(value) => setForm({ ...form, display_order: value })} /><TextField label="Description" wide value={form.description} onChange={(value) => setForm({ ...form, description: value })} /><label className="field checkbox-field"><span>Published to learners</span><input type="checkbox" checked={form.is_published} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} /></label><div className="admin-form-actions"><Button type="submit">{editing ? <><Save size={14} /> Save course</> : <><Plus size={14} /> Create course</>}</Button>{editing && <Button type="button" variant="outline-dark" onClick={() => setForm({ ...blank, display_order: rows.length + 1 })}>Cancel</Button>}</div></form></div>
    <div className="admin-panel"><AdminHeader title="Course catalogue" count={`${rows.length} total`} />{rows.length ? <TableWrap><table className="admin-table"><thead><tr><th>Course</th><th>Level</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.id}><td><strong>{row.title}</strong><br /><small>{(row.description || '').slice(0, 90)}</small></td><td>{row.level || '—'}</td><td><Badge tone={row.is_published ? 'success' : 'muted'}>{row.is_published ? 'published' : 'draft'}</Badge></td><td>{row.display_order ?? '—'}</td><td><RowActions onEdit={() => setForm({ ...blank, ...row, description: row.description || '', level: row.level || 'Foundations' })} onToggle={() => toggle(row)} toggleLabel={row.is_published ? 'Unpublish' : 'Publish'} onUp={() => reorder('courses', rows, index, 'up')} onDown={() => reorder('courses', rows, index, 'down')} onDelete={() => remove('courses', row.id)} /></td></tr>)}</tbody></table></TableWrap> : <EmptyState title="No courses" body="Create the first course above." />}</div>
  </>
}

function ModulesAdmin({ rows, courses, reload, remove, setMessage, reorder }) {
  const blank = { id: null, title: '', course_id: '', display_order: rows.length + 1 }
  const [form, setForm] = useState(blank)
  const editing = Boolean(form.id)
  async function save(event) {
    event.preventDefault()
    if (!form.title.trim() || !form.course_id) return setMessage({ tone: 'error', text: 'Module title and course are required.' })
    const payload = { title: form.title.trim(), course_id: form.course_id, display_order: Number(form.display_order) || 1 }
    const result = editing ? await supabase.from('modules').update(payload).eq('id', form.id) : await supabase.from('modules').insert(payload)
    if (result.error) return setMessage({ tone: 'error', text: result.error.message })
    setMessage({ tone: 'success', text: editing ? 'Module updated.' : 'Module created.' }); setForm({ ...blank, display_order: rows.length + 1 }); await reload()
  }
  const courseName = (id) => courses.find((course) => String(course.id) === String(id))?.title || 'Unknown course'
  return <>
    <div className="admin-panel"><AdminHeader title={editing ? 'Edit module' : 'Create a module'} count="Course structure" /><form className="admin-form-grid" onSubmit={save}><Field label="Module title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required /><SelectField label="Course" value={form.course_id} onChange={(value) => setForm({ ...form, course_id: value })} options={courses.map((course) => [course.id, course.title])} required placeholder="Choose a course" /><Field label="Display order" type="number" value={form.display_order} onChange={(value) => setForm({ ...form, display_order: value })} /><div className="admin-form-actions"><Button type="submit">{editing ? <><Save size={14} /> Save module</> : <><Plus size={14} /> Add module</>}</Button>{editing && <Button type="button" variant="outline-dark" onClick={() => setForm({ ...blank, display_order: rows.length + 1 })}>Cancel</Button>}</div></form></div>
    <div className="admin-panel"><AdminHeader title="Module structure" count={`${rows.length} total`} />{rows.length ? <TableWrap><table className="admin-table"><thead><tr><th>Module</th><th>Course</th><th>Order</th><th>Actions</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.id}><td><strong>{row.title}</strong></td><td>{courseName(row.course_id)}</td><td>{row.display_order ?? '—'}</td><td><RowActions onEdit={() => setForm({ ...blank, ...row })} onUp={() => reorder('modules', rows, index, 'up')} onDown={() => reorder('modules', rows, index, 'down')} onDelete={() => remove('modules', row.id)} /></td></tr>)}</tbody></table></TableWrap> : <EmptyState title="No modules" body="Create a module after you have at least one course." />}</div>
  </>
}

function LessonsAdmin({ rows, modules, courses, reload, remove, setMessage, reorder }) {
  const blank = { id: null, title: '', module_id: '', youtube_url: '', youtube_video_id: '', description: '', display_order: rows.length + 1, is_published: true }
  const [form, setForm] = useState(blank)
  const editing = Boolean(form.id)
  const moduleOptions = useMemo(() => modules.map((module) => [module.id, `${courses.find((course) => String(course.id) === String(module.course_id))?.title || 'Course'} / ${module.title}`]), [modules, courses])

  function changeVideoUrl(value) {
    const id = youtubeId(value)
    setForm((current) => ({ ...current, youtube_url: value, youtube_video_id: id }))
  }

  async function save(event) {
    event.preventDefault()
    const id = youtubeId(form.youtube_url || form.youtube_video_id)
    if (!form.title.trim() || !form.module_id) return setMessage({ tone: 'error', text: 'Lesson title and module are required.' })
    if (form.youtube_url && !id) return setMessage({ tone: 'error', text: 'Enter a supported YouTube URL or valid 11-character video ID.' })
    const payload = { title: form.title.trim(), module_id: form.module_id, description: form.description.trim(), youtube_url: form.youtube_url.trim() || null, youtube_video_id: id || null, thumbnail_url: id ? youtubeThumbnail(id) : null, display_order: Number(form.display_order) || 1, is_published: Boolean(form.is_published), video_url: form.youtube_url.trim() || null }
    const result = editing ? await supabase.from('lessons').update(payload).eq('id', form.id) : await supabase.from('lessons').insert(payload)
    if (result.error) return setMessage({ tone: 'error', text: result.error.message })
    setMessage({ tone: 'success', text: editing ? 'Lesson updated.' : 'Lesson created.' }); setForm({ ...blank, display_order: rows.length + 1 }); await reload()
  }

  function moduleName(id) { return moduleOptions.find(([value]) => String(value) === String(id))?.[1] || 'Unknown module' }
  async function toggle(row) { const { error } = await supabase.from('lessons').update({ is_published: !row.is_published }).eq('id', row.id); if (error) return setMessage({ tone: 'error', text: error.message }); reload() }

  return <>
    <div className="admin-panel"><AdminHeader title={editing ? 'Edit lesson' : 'Create a lesson'} count="YouTube hosted" /><form className="admin-form-grid" onSubmit={save}><Field label="Lesson title" wide value={form.title} onChange={(value) => setForm({ ...form, title: value })} required /><SelectField label="Module" value={form.module_id} onChange={(value) => setForm({ ...form, module_id: value })} options={moduleOptions} required placeholder="Choose a module" /><Field label="Display order" type="number" value={form.display_order} onChange={(value) => setForm({ ...form, display_order: value })} /><Field label="YouTube URL" wide value={form.youtube_url} onChange={changeVideoUrl} placeholder="https://www.youtube.com/watch?v=VIDEO_ID" /><TextField label="Description" wide value={form.description} onChange={(value) => setForm({ ...form, description: value })} /><label className="field checkbox-field"><span>Published to learners</span><input type="checkbox" checked={form.is_published} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} /></label>{form.youtube_video_id && <div className="youtube-preview wide"><div className="youtube-preview-image"><img src={youtubeThumbnail(form.youtube_video_id)} alt="YouTube thumbnail preview" /></div><div><span className="eyebrow">YouTube preview</span><h3><Youtube size={17} /> {form.youtube_video_id}</h3><p>The thumbnail is generated from the video ID. No YouTube Data API key is required.</p></div></div>}<div className="admin-form-actions"><Button type="submit">{editing ? <><Save size={14} /> Save lesson</> : <><Plus size={14} /> Create lesson</>}</Button>{editing && <Button type="button" variant="outline-dark" onClick={() => setForm({ ...blank, display_order: rows.length + 1 })}>Cancel</Button>}</div></form></div>
    <div className="admin-panel"><AdminHeader title="Lesson library" count={`${rows.length} total`} />{rows.length ? <TableWrap><table className="admin-table"><thead><tr><th>Lesson</th><th>Module</th><th>YouTube</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.id}><td><strong>{row.title}</strong><br /><small>{(row.description || '').slice(0, 80)}</small></td><td>{moduleName(row.module_id)}</td><td>{row.youtube_video_id ? <span className="youtube-id"><Youtube size={12} /> {row.youtube_video_id}</span> : '—'}</td><td><Badge tone={row.is_published ? 'success' : 'muted'}>{row.is_published ? 'published' : 'draft'}</Badge></td><td>{row.display_order ?? '—'}</td><td><RowActions onEdit={() => setForm({ ...blank, ...row, description: row.description || '', youtube_url: row.youtube_url || row.video_url || '', youtube_video_id: row.youtube_video_id || youtubeId(row.youtube_url || row.video_url || ''), is_published: row.is_published !== false })} onToggle={() => toggle(row)} toggleLabel={row.is_published ? 'Unpublish' : 'Publish'} onUp={() => reorder('lessons', rows, index, 'up')} onDown={() => reorder('lessons', rows, index, 'down')} onDelete={() => remove('lessons', row.id)} /></td></tr>)}</tbody></table></TableWrap> : <EmptyState title="No lessons" body="Create the first YouTube lesson above." />}</div>
  </>
}

function SettingsAdmin({ data }) {
  return <div className="admin-panel settings-panel"><div className="settings-icon"><Settings size={21} /></div><h2>Workspace settings</h2><p className="settings-intro">These values describe the current application configuration. Secrets are intentionally not displayed here.</p><div className="settings-grid"><div><span>Supabase</span><strong>Connected by public client configuration</strong></div><div><span>Video hosting</span><strong>YouTube embeds</strong></div><div><span>Payment token</span><strong>USDT</strong></div><div><span>Active networks</span><strong>{data.methods.filter((item) => item.is_active).length}</strong></div><div><span>Demo mode</span><strong>{import.meta.env.VITE_DEMO_MODE === 'true' ? 'Enabled (development)' : 'Disabled'}</strong></div><div><span>Admin model</span><strong>Supabase profile role</strong></div></div><div className="security-callout"><Eye size={17} /><div><strong>Security reminder</strong><p>Never add a Supabase service-role key to React source code or GitHub. The browser should use only the public publishable/anon client key.</p></div></div></div>
}

function AdminHeader({ title, count, children }) { return <div className="admin-header"><div><h2>{title}</h2>{count && <span>{count}</span>}</div>{children}</div> }
function TableWrap({ children }) { return <div className="admin-table-wrap">{children}</div> }
function AccessBadge({ status }) { const tone = status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning'; return <Badge tone={tone}>{status || 'pending'}</Badge> }
function RowActions({ onEdit, onToggle, toggleLabel, onUp, onDown, onDelete }) { return <div className="table-actions">{onEdit && <Button size="sm" variant="outline-dark" onClick={onEdit}><Edit3 size={12} /> Edit</Button>}{onToggle && <Button size="sm" variant="outline-dark" onClick={onToggle}>{toggleLabel || 'Toggle'}</Button>}{onUp && <Button size="sm" variant="outline-dark" aria-label="Move up" onClick={onUp}><ArrowUp size={12} /></Button>}{onDown && <Button size="sm" variant="outline-dark" aria-label="Move down" onClick={onDown}><ArrowDown size={12} /></Button>}{onDelete && <Button size="sm" variant="danger" onClick={onDelete}><Trash2 size={12} /></Button>}</div> }
function Field({ label, value, onChange, type = 'text', wide = false, required = false, placeholder = '' }) { return <label className={`field ${wide ? 'wide' : ''}`}><span>{label}</span><input required={required} type={type} value={value ?? ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label> }
function TextField({ label, value, onChange, wide = false }) { return <label className={`field ${wide ? 'wide' : ''}`}><span>{label}</span><textarea value={value ?? ''} rows={4} onChange={(event) => onChange(event.target.value)} /></label> }
function SelectField({ label, value, onChange, options, required = false, placeholder = 'Select' }) { return <label className="field"><span>{label}</span><select required={required} value={value ?? ''} onChange={(event) => onChange(event.target.value)}><option value="">{placeholder}</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label> }
