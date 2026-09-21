import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/RouteGuards'
import Home from './pages/Home'
import Courses from './pages/Courses'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Payment from './pages/Payment'
import Profile from './pages/Profile'
import CoursePage from './pages/CoursePage'
import LessonPage from './pages/LessonPage'
import Admin from './pages/Admin'
import Legal from './pages/Legal'

function NotFound() {
  return <div className="not-found"><div><h1>404</h1><p>The page you are looking for does not exist.</p><Link className="btn btn-primary btn-lg" to="/">Back home</Link></div></div>
}

export default function App() {
  return <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/privacy" element={<Legal type="privacy" />} />
        <Route path="/terms" element={<Legal type="terms" />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/courses/:courseId" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
        <Route path="/lessons/:lessonId" element={<ProtectedRoute access><LessonPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute admin><Admin /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
}
