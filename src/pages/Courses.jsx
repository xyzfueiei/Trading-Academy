import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Lock, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import SiteNav from '../components/SiteNav'
import Footer from '../components/Footer'
import { Button, EmptyState, SectionHeading, Spinner } from '../components/ui'
import { getCourses } from '../lib/api'

export default function Courses() {
  const [courses, setCourses] = useState([]); const [loading, setLoading] = useState(true); const [query, setQuery] = useState(''); const [error, setError] = useState('')
  useEffect(() => { getCourses({ publishedOnly: true }).then(setCourses).catch((loadError) => { setCourses([]); setError(loadError.message || 'Unable to load the course library.') }).finally(() => setLoading(false)) }, [])
  const filtered = courses.filter((course) => `${course.title} ${course.description} ${course.level}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="app-shell"><SiteNav light /><main className="page-light"><div className="container page-head"><span className="eyebrow">Course library</span><h1>Study with structure.</h1><p>Go deeper than a headline. Work through carefully organized courses that help you build the language, context, and process to keep learning.</p></div><div className="container" style={{ paddingBottom: 110 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, marginBottom: 22 }}><span className="eyebrow" style={{ color: '#718078' }}>{courses.length} published courses</span><label style={{ position: 'relative', width: 'min(280px, 100%)' }}><Search size={15} style={{ position: 'absolute', left: 13, top: 14, color: '#7c877e' }} /><input className="input" style={{ paddingLeft: 38 }} placeholder="Search the library" value={query} onChange={(e) => setQuery(e.target.value)} /></label></div>{loading ? <div className="empty-state"><Spinner /><p>Loading the course library…</p></div> : error ? <div className="empty-state"><p>{error}</p></div> : filtered.length ? <div className="course-preview-grid">{filtered.map((course, index) => <LibraryCard course={course} index={index} key={course.id || index} />)}</div> : <EmptyState icon={<BookOpen size={24} />} title="No courses found" body={courses.length ? 'Try another search term.' : 'Published courses will appear here once your Academy team adds them.'} action={<Link to="/signup"><Button>Make an account</Button></Link>} />}</div></main><Footer /></div>
}

function LibraryCard({ course, index }) { return <article className="course-card"><div className="course-top"><span>0{index + 1} / COURSE</span><span>{course.level || course.difficulty || 'Core'}</span></div><div className="course-art"><span>{index % 2 === 0 ? 'BEGIN WITH CONTEXT' : 'FOLLOW THE FRAME'}</span></div><h3>{course.title || 'Untitled course'}</h3><p>{course.description || 'A structured course inside Trading Academy.'}</p><div className="course-bottom"><span>{course.duration_minutes ? `${course.duration_minutes} min` : 'Self-paced'}</span><Link to={`/courses/${course.id}`} className="arrow" aria-label={`Open ${course.title}`}><ArrowRight size={14} /></Link></div></article> }
