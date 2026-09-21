import { Link } from 'react-router-dom'

export default function Footer() {
  return <footer className="site-footer"><div className="container"><div className="footer-main"><div><Link to="/" className="brand"><span className="brand-mark" /><span>TRADING ACADEMY</span></Link><p className="footer-note">A structured place to build market literacy, process discipline, and a clearer point of view.</p></div><div className="footer-links"><div><h4>Explore</h4><Link to="/courses">Courses</Link><Link to="/#about">Our approach</Link><Link to="/#faq">FAQ</Link></div><div><h4>Account</h4><Link to="/login">Log in</Link><Link to="/signup">Create account</Link><Link to="/dashboard">Dashboard</Link></div><div><h4>Legal</h4><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Trading Academy</span><span>Educational content only · Not financial advice</span></div></div></footer>
}
