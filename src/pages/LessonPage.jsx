import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, CircleCheck, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import SiteNav from '../components/SiteNav'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getCourse, getLessons, getModules, youtubeEmbed } from '../lib/api'
import { Alert, Button, Spinner } from '../components/ui'

export default function LessonPage() {
  const { lessonId } = useParams()
  const { user, isAdmin } = useAuth()
  const [lesson, setLesson] = useState(null)
  const [course, setCourse] = useState(null)
  const [siblings, setSiblings] = useState([])
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        let lessonQuery = supabase.from('lessons').select('*').eq('id', lessonId)
        if (!isAdmin) lessonQuery = lessonQuery.eq('is_published', true)
        const { data: nextLesson, error: lessonError } = await lessonQuery.maybeSingle()
        if (lessonError) throw lessonError
        if (!nextLesson) {
          if (active) setLesson(null)
          return
        }

        const { data: module, error: moduleError } = await supabase.from('modules').select('course_id').eq('id', nextLesson.module_id).maybeSingle()
        if (moduleError) throw moduleError

        let nextCourse = null
        let nextSiblings = []
        if (module?.course_id) {
          nextCourse = await getCourse(module.course_id, { publishedOnly: !isAdmin })
          const modules = await getModules(module.course_id)
          nextSiblings = await getLessons(modules.map((item) => item.id), { publishedOnly: !isAdmin })
        }

        const { data: existing, error: progressError } = await supabase.from('user_lesson_progress').select('*').eq('user_id', user.id).eq('lesson_id', lessonId).maybeSingle()
        if (progressError) throw progressError

        if (!active) return
        setLesson(nextLesson)
        setCourse(nextCourse)
        setSiblings(nextSiblings)
        setCompleted(Boolean(existing?.completed || existing?.is_completed))
      } catch (error) {
        if (active) setMessage({ tone: 'error', text: error.message || 'Unable to load this lesson.' })
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [lessonId, user?.id, isAdmin])

  const currentIndex = useMemo(() => siblings.findIndex((item) => String(item.id) === String(lessonId)), [siblings, lessonId])
  const previous = currentIndex > 0 ? siblings[currentIndex - 1] : null
  const next = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null

  async function markComplete() {
    setBusy(true)
    setMessage(null)
    const payload = { user_id: user.id, lesson_id: Number(lessonId), completed: true, completed_at: new Date().toISOString() }
    const { error } = await supabase.from('user_lesson_progress').upsert(payload, { onConflict: 'user_id,lesson_id' })
    setBusy(false)
    if (error) return setMessage({ tone: 'error', text: error.message })
    setCompleted(true)
    setMessage({ tone: 'success', text: 'Lesson marked complete. Your progress has been saved.' })
  }

  if (loading) return <div className="loading-screen"><div className="loader-box"><Spinner /><span>Loading lesson…</span></div></div>
  if (!lesson) return <div className="not-found"><div><h1>404</h1><p>This lesson could not be found or is not published.</p><Link to={course ? `/courses/${course.id}` : '/dashboard'}><Button>Back to course</Button></Link></div></div>

  const embed = youtubeEmbed(lesson.youtube_url || lesson.video_url || lesson.youtube_video_id || '')

  return <div className="app-shell">
    <SiteNav light />
    <main className="page-light" style={{ paddingTop: 78 }}>
      <div className="container lesson-page-shell">
        <Link to={course ? `/courses/${course.id}` : '/dashboard'} className="sidebar-back"><ArrowLeft size={12} /> BACK TO COURSE</Link>
        <span className="eyebrow lesson-eyebrow">Lesson {currentIndex >= 0 ? String(currentIndex + 1).padStart(2, '0') : ''}</span>
        <h1 className="lesson-title">{lesson.title || lesson.name || 'Untitled lesson'}</h1>
        <p className="course-description">{lesson.description || 'Take your time with this lesson and return to the ideas that need another pass.'}</p>

        {embed ? <div className="video-wrap"><iframe src={embed} title={lesson.title || 'YouTube lesson'} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div> : <div className="empty-state" style={{ marginTop: 30 }}><ExternalLink size={23} /><h3>Video not configured</h3><p>Add a YouTube URL to this lesson from the admin workspace.</p></div>}

        {lesson.content && <div className="lesson-copy"><h2>Notes from the lesson</h2><p>{lesson.content}</p></div>}
        {message && <Alert tone={message.tone}>{message.text}</Alert>}

        <div className="lesson-actions">
          {completed ? <Button variant="outline-dark" disabled><CircleCheck size={15} color="#789b36" /> Lesson complete</Button> : <Button size="lg" onClick={markComplete} disabled={busy}>{busy ? 'Saving progress…' : <><CheckCircle2 size={15} /> Mark as complete</>}</Button>}
          <span className="lesson-save-note">{completed ? 'SAVED TO YOUR LEARNING DESK' : 'YOUR PROGRESS WILL BE SAVED'}</span>
        </div>

        <div className="lesson-pagination">
          {previous ? <Link to={`/lessons/${previous.id}`} className="lesson-nav-card"><span>PREVIOUS LESSON</span><strong><ArrowLeft size={14} /> {previous.title}</strong></Link> : <span />}
          {next ? <Link to={`/lessons/${next.id}`} className="lesson-nav-card next"><span>NEXT LESSON</span><strong>{next.title} <ArrowRight size={14} /></strong></Link> : <span />}
        </div>
      </div>
    </main>
  </div>
}
