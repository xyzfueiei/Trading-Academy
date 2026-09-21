import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from './ui'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Trading Academy render error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return <main className="error-screen">
      <div className="error-card">
        <div className="empty-icon"><AlertTriangle size={28} /></div>
        <span className="eyebrow">Something went wrong</span>
        <h1>The page could not finish loading.</h1>
        <p>Refresh the page and try again. The error was contained so it does not leave you with a blank screen.</p>
        <Button onClick={() => window.location.reload()}><RotateCcw size={15} /> Refresh page</Button>
      </div>
    </main>
  }
}
