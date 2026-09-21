import { LoaderCircle } from 'lucide-react'
import { cn } from '../lib/utils'

export function Button({ className, variant = 'primary', size = 'md', children, ...props }) {
  return <button className={cn('btn', `btn-${variant}`, `btn-${size}`, className)} {...props}>{children}</button>
}

export function Card({ className, children, ...props }) {
  return <div className={cn('card', className)} {...props}>{children}</div>
}

export function Badge({ tone = 'muted', children, className }) {
  return <span className={cn('badge', `badge-${tone}`, className)}>{children}</span>
}

export function Spinner({ label = 'Loading' }) {
  return <span className="spinner-wrap"><LoaderCircle className="spin" size={16} /> <span className="sr-only">{label}</span></span>
}

export function Alert({ tone = 'info', children }) {
  return <div className={cn('alert', `alert-${tone}`)}>{children}</div>
}

export function EmptyState({ icon, title, body, action }) {
  return <div className="empty-state">{icon && <div className="empty-icon">{icon}</div>}<h3>{title}</h3><p>{body}</p>{action}</div>
}

export function SectionHeading({ eyebrow, title, body, align = 'left' }) {
  return <div className={cn('section-heading', align === 'center' && 'center')}><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{body && <p>{body}</p>}</div>
}

export function Field({ label, hint, ...props }) {
  return <label className="field"><span>{label}</span><input {...props} />{hint && <small>{hint}</small>}</label>
}
