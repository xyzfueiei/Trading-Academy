import { useEffect, useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui'

const links = [
  ['/', 'Home'],
  ['/courses', 'Courses'],
  ['/#about', 'About'],
  ['/#faq', 'FAQ'],
]

export default function SiteNav({ light = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAdmin, signOut } = useAuth()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, location.hash])

  function isActive(to) {
    if (to === '/') return location.pathname === '/' && !location.hash
    if (to.startsWith('/#')) return location.pathname === '/' && location.hash === to.slice(1)
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const buttonVariant = scrolled || !light ? 'ghost' : 'outline-dark'

  return <header className={`site-nav ${scrolled ? 'scrolled' : ''} ${light && !scrolled ? 'nav-light' : ''} ${menuOpen ? 'menu-open' : ''}`}>
    <div className="container nav-inner">
      <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
        <span className="brand-mark" />
        <span>TRADING ACADEMY</span>
      </Link>

      <nav className="nav-links" aria-label="Primary navigation">
        {links.map(([to, label]) => <Link key={label} className={isActive(to) ? 'active' : ''} to={to}>{label}</Link>)}
      </nav>

      <div className="nav-actions desktop-nav-actions">
        {user ? <>
          <Link to={isAdmin ? '/admin' : '/dashboard'}><Button variant={buttonVariant} size="sm">{isAdmin ? 'Admin' : 'Dashboard'} <ArrowUpRight size={13} /></Button></Link>
          <button className="btn btn-sm btn-ghost" onClick={handleSignOut}>Log out</button>
        </> : <>
          <Link to="/login"><Button variant={buttonVariant} size="sm">Log in</Button></Link>
          <Link to="/signup"><Button size="sm">Start learning <ArrowUpRight size={13} /></Button></Link>
        </>}
      </div>

      <button className="mobile-menu-btn" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
        {menuOpen ? <X /> : <Menu />}
      </button>
    </div>

    {menuOpen && <div className="mobile-nav-panel">
      <nav className="mobile-nav-links" aria-label="Mobile navigation">
        {links.map(([to, label]) => <Link key={label} className={isActive(to) ? 'active' : ''} to={to}>{label}</Link>)}
      </nav>
      <div className="nav-actions">
        {user ? <>
          <Link to={isAdmin ? '/admin' : '/dashboard'}><Button>{isAdmin ? 'Admin dashboard' : 'Dashboard'} <ArrowUpRight size={14} /></Button></Link>
          <button className="btn btn-outline-dark" onClick={handleSignOut}>Log out</button>
        </> : <>
          <Link to="/login"><Button variant="outline-dark">Log in</Button></Link>
          <Link to="/signup"><Button>Start learning <ArrowUpRight size={14} /></Button></Link>
        </>}
      </div>
    </div>}
  </header>
}
