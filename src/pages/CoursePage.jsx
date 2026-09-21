import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Circle, Lock, PlayCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import SiteNav from '../components/SiteNav'
import { useAuth } from '../context/AuthContext'
import { Button, EmptyState, Spinner } from '../components/ui'
import { getCourse, getLessons, getModules, getProgress } from '../lib/api'

export default function CoursePage() {
  const { courseId } = useParams()
  const { user, hasAccess } = useAuth()
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [lessons, setLessons] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const nextCourse = await getCourse(courseId, { publishedOnly: true })
        if (!nextCourse) {
          if (active) setCourse(null)
          return
        }

        let nextModules = []
        let nextLessons = []
        let nextProgress = []
        if (hasAccess) {
          nextModules = await getModules(courseId)
          nextLessons = await getLessons(nextModules.map((module) => module.id), { publishedOnly: true })
          nextProgress = await getProgress(user?.id)
        }

        if (!active) return
        setCourse(nextCourse)
        setModules(nextModules)
        setProgress(nextProgress)
        setLessons(nextLessons)
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load this course.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [courseId, user?.id, hasAccess])

  const progressIds = useMemo(() => new Set(progress.filter((item) => item.completed || item.is_completed).map((item) => item.lesson_id)), [progress])
  const progressPercent = lessons.length ? Math.round((progressIds.size / lessons.length) * 100) : 0

  if (loading) return <div className="loading-screen"><div className="loader-box"><Spinner /><span>Loading course…</span></div></div>
  if (error) return <div className="not-found"><div><h1>!</h1><p>{error}</p><Link to="/courses"><Button>Back to courses</Button></Link></div></div>
  if (!course) return <div className="not-found"><div><h1>404</h1><p>This course could not be found or is not published.</p><Link to="/courses"><Button>Back to courses</Button></Link></div></div>

  return <div className="app-shell">
    <SiteNav light />
    <main className="course-layout" style={{ paddingTop: 78 }}>
      <aside className="course-sidebar">
        <Link to="/courses" className="sidebar-back"><ArrowLeft size={12} /> COURSE LIBRARY</Link>
        <h3>{course.title}</h3>
        {hasAccess ? modules.map((module, moduleIndex) => <div key={module.id}><span className="module-label">{String(moduleIndex + 1).padStart(2, '0')} / {module.title || module.name || 'Module'}</span>{lessons.filter((lesson) => lesson.module_id === module.id).map((lesson) => <Link key={lesson.id} className="lesson-link" to={`/lessons/${lesson.id}`}><PlayCircle size={13} /><span>{lesson.title || lesson.name || 'Lesson'}{progressIds.has(lesson.id) && <CheckCircle2 size={11} color="#789b36" style={{ marginLeft: 6, verticalAlign: 'middle' }} />}</span></Link>)}</div>) : <div style={{ marginTop: 28, color: '#78847a', fontSize: 12 }}>Access is required to view modules and lessons.</div>}
      </aside>

      <section className="course-main">
        <span className="eyebrow">Course overview</span>
        <h1>{course.title}</h1>
        <div className="lesson-meta"><span>{course.level || course.difficulty || 'CORE'}</span><span>·</span><span>{modules.length} MODULES</span><span>·</span><span>{lessons.length} LESSONS</span>{hasAccess && <><span>·</span><span>{progressPercent}% COMPLETE</span></>}</div>
        <p className="course-description">{course.description || 'A considered learning path inside Trading Academy.'}</p>

        {!hasAccess ? <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 30, marginTop: 40, maxWidth: 620 }}><Lock size={20} color="var(--lime)" /><h2 style={{ font: '600 26px var(--display)', margin: '14px 0 8px' }}>This course is protected.</h2><p style={{ color: 'rgba(242,240,232,.56)', fontSize: 13 }}>Your account is authenticated, but lesson access is only granted after your payment submission is approved.</p><Link to="/payment"><Button style={{ marginTop: 15 }}>Review access process <ArrowRight size={14} /></Button></Link></div> : <div className="lesson-list">{modules.length ? modules.map((module, moduleIndex) => <div key={module.id} style={{ marginBottom: 35 }}><span className="eyebrow" style={{ color: '#768178' }}>Module {String(moduleIndex + 1).padStart(2, '0')}</span><h2 style={{ font: '600 25px var(--display)', margin: '8px 0 14px', letterSpacing: '-.04em' }}>{module.title || module.name || 'Module'}</h2>{lessons.filter((lesson) => lesson.module_id === module.id).map((lesson, index) => <Link className="lesson-row" to={`/lessons/${lesson.id}`} key={lesson.id}><div className="lesson-row-left"><span className="lesson-index">{String(index + 1).padStart(2, '0')}</span>{progressIds.has(lesson.id) ? <CheckCircle2 size={17} color="#789b36" /> : <Circle size={17} color="#99a39a" />}<div><h3>{lesson.title || lesson.name || 'Lesson'}</h3><p>{lesson.description || 'Work through this lesson at your own pace.'}</p></div></div><ChevronRight size={16} color="#738077" /></Link>)}</div>) : <EmptyState icon={<Circle size={22} />} title="Modules are coming together" body="This course has not been populated with published lessons yet." />}</div>}
      </section>
    </main>
  </div>
}
