import { supabase } from './supabase'

export async function getProfile(userId) {
  if (!userId) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function getCourses({ publishedOnly = false } = {}) {
  let query = supabase.from('courses').select('*').order('display_order', { ascending: true, nullsFirst: false })
  if (publishedOnly) query = query.eq('is_published', true)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getCourse(courseId, { publishedOnly = false } = {}) {
  if (!courseId) return null
  let query = supabase.from('courses').select('*').eq('id', courseId)
  if (publishedOnly) query = query.eq('is_published', true)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data
}

export async function getModules(courseId) {
  if (!courseId) return []
  const { data, error } = await supabase.from('modules').select('*').eq('course_id', courseId).order('display_order', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data || []
}

export async function getLessons(moduleIds = [], { publishedOnly = false } = {}) {
  if (!Array.isArray(moduleIds) || !moduleIds.length) return []
  let query = supabase.from('lessons').select('*').in('module_id', moduleIds).order('display_order', { ascending: true, nullsFirst: false })
  if (publishedOnly) query = query.eq('is_published', true)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getProgress(userId) {
  if (!userId) return []
  const { data, error } = await supabase.from('user_lesson_progress').select('*').eq('user_id', userId)
  if (error) throw error
  return data || []
}

export async function getPaymentMethods() {
  const { data, error } = await supabase.from('payment_methods').select('*').eq('is_active', true).order('display_order', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data || []
}

export function youtubeId(value = '') {
  const input = String(value).trim()
  if (!input) return ''

  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input

  try {
    const url = new URL(input)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()
    let id = ''

    if (host === 'youtu.be') {
      id = url.pathname.split('/').filter(Boolean)[0] || ''
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') id = url.searchParams.get('v') || ''
      else if (url.pathname.startsWith('/embed/')) id = url.pathname.split('/').filter(Boolean)[1] || ''
      else if (url.pathname.startsWith('/shorts/')) id = url.pathname.split('/').filter(Boolean)[1] || ''
      else if (url.pathname.startsWith('/live/')) id = url.pathname.split('/').filter(Boolean)[1] || ''
    }

    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : ''
  } catch {
    return ''
  }
}

export function youtubeThumbnail(value = '') {
  const id = youtubeId(value)
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : ''
}

export function youtubeEmbed(value = '') {
  const id = youtubeId(value)
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : ''
}

export function safeText(value, fallback = '') {
  return value === null || value === undefined || String(value).trim() === '' ? fallback : String(value)
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}

export function paymentTimestamp(payment) {
  return payment?.created_at || payment?.submitted_at || payment?.created_on || payment?.inserted_at || null
}
