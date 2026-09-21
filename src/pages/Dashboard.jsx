import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CircleCheck, Clock3, Lock, ReceiptText, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import SiteNav from '../components/SiteNav'
import { useAuth } from '../context/AuthContext'
import { EmptyState, Spinner } from '../components/ui'
import { getCourses, getLessons, getModules, getProgress } from '../lib/api'

export default function Dashboard() {
  const { user, profile, hasAccess } = useAuth()
  const [courses, setCourses] = useState([])
  const [progress, setProgress] = useState([])
  const [courseProgress, setCourseProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setError('')
        const [nextCourses, nextProgress] = await Promise.all([getCourses({ publishedOnly: true }), getProgress(user?.id)])
        if (!active) return
        setCourses(nextCourses)
        setProgress(nextProgress)

        if (!hasAccess) {
          setCourseProgress(Object.fromEntries(nextCourses.map((course) => [course.id, 0])))
          return
        }

        const entries = await Promise.all(nextCourses.map(async (course) => {
          try {
            const modules = await getModules(course.id)
            const lessons = await getLessons(modules.map((module) => module.id), { publishedOnly: true })
            const ids = new Set(lessons.map((lesson) => lesson.id))
            const done = nextProgress.filter((item) => ids.has(item.lesson_id) && (item.completed || item.is_completed)).length
            return [course.id, lessons.length ? Math.round((done / lessons.length) * 100) : 0]
          } catch {
            return [course.id, 0]
          }
        }))
        if (active) setCourseProgress(Object.fromEntries(entries))
      } finally {
        if (active) setLoading(false)
      }
    }
    load().catch((loadError) => { if (active) setError(loadError.message || 'Unable to load your learning desk.') })
    return () => { active = false }
  }, [user?.id, hasAccess])

  const completed = useMemo(() => progress.filter((item) => item.completed || item.is_completed).length, [progress])
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'learner'

  return <div className="app-shell">
    <SiteNav light />
    <main className="dashboard">
      <section className="dashboard-bar"><div className="container dash-head"><div><span className="eyebrow">Your learning desk</span><h1>Good to see you, {firstName}.</h1><p>{hasAccess ? 'Pick up where you left off, or choose the next idea to explore.' : 'Your workspace is ready. Complete the access step to unlock your course library.'}</p></div><div className="dash-kpis"><div className="kpi"><span>Courses</span><strong>{courses.length}</strong></div><div className="kpi"><span>Completed</span><strong>{completed}</strong></div><div className="kpi"><span>Access</span><strong>{hasAccess ? 'On' : '—'}</strong></div></div></div></section>
      <div className="container dash-body">
        {!hasAccess && <div className="alert alert-info" style={{ marginBottom: 32 }}>Your account is active, but course access is {profile?.payment_status || 'pending'}. <Link to="/payment" style={{ fontWeight: 800, textDecoration: 'underline' }}>Review the access process →</Link></div>}
        <div className="dash-section-title"><h2>Continue learning</h2><span>{loading ? 'SYNCING' : `${courses.length} AVAILABLE`}</span></div>
        {loading ? <div className="empty-state"><Spinner /><p>Loading your learning desk…</p></div> : error ? <div className="empty-state"><p>{error}</p></div> : courses.length ? <div className="dash-grid">{courses.slice(0, 6).map((course, index) => <CourseTile key={course.id || index} course={course} locked={!hasAccess} percent={courseProgress[course.id] || 0} />)}</div> : <EmptyState icon={<Lock size={24} />} title="Your library is taking shape" body="Published courses will appear here once they are added by the Academy team." />}
        {hasAccess && <div style={{ marginTop: 55 }}><div className="dash-section-title"><h2>Account shortcuts</h2><span>KEEP MOVING</span></div><div className="dash-grid"><Shortcut to="/payment" icon={<ReceiptText size={18} />} title="Access & payments" body="Review your payment submission status and available networks." /><Shortcut to="/profile" icon={<UserRound size={18} />} title="Your profile" body="Keep your account details and learning identity up to date." /><Shortcut to="/courses" icon={<Clock3 size={18} />} title="Browse library" body="Explore the full published course catalogue." /></div></div>}
      </div>
    </main>
  </div>
}

function CourseTile({ course, locked, percent }) {
  const label = locked ? 'Access pending' : percent === 100 ? 'Course complete' : `${percent}% complete`
  return <article className="dash-card"><div className="card-top"><span>{course.level || course.difficulty || 'COURSE'}</span>{locked ? <Lock size={14} /> : <CircleCheck size={14} color="#789b36" />}</div><h3>{course.title || 'Untitled course'}</h3><p>{course.description || 'A structured learning track.'}</p><div className="progress-track"><span style={{ width: `${locked ? 0 : percent}%` }} /></div><div className="progress-row"><span>{label}</span>{locked ? <Link to="/payment" className="btn btn-sm btn-outline-dark">Unlock</Link> : <Link to={`/courses/${course.id}`} className="btn btn-sm btn-dark">Open <ArrowRight size={12} /></Link>}</div></article>
}

function Shortcut({ to, icon, title, body }) { return <Link to={to} className="dash-card" style={{ display: 'block' }}><div style={{ color: '#789b36' }}>{icon}</div><h3>{title}</h3><p>{body}</p><span style={{ font: '10px var(--mono)', color: '#67736a' }}>VIEW DETAIL <ArrowRight size={12} style={{ verticalAlign: 'middle' }} /></span></Link> }
