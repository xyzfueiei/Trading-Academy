import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, paymentTimestamp, youtubeEmbed, youtubeId, youtubeThumbnail } from './api'

describe('YouTube helpers', () => {
  it('extracts IDs from common YouTube URLs', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('not-a-youtube-url')).toBe('')
  })

  it('generates thumbnail and privacy-enhanced embed URLs', () => {
    expect(youtubeThumbnail('dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    expect(youtubeEmbed('dQw4w9WgXcQ')).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })
})

describe('date helpers', () => {
  it('returns a stable placeholder for missing or invalid dates', () => {
    expect(formatDate('')).toBe('—')
    expect(formatDate('not-a-date')).toBe('—')
    expect(formatDateTime('')).toBe('—')
  })

  it('chooses a compatible payment timestamp without inventing one', () => {
    expect(paymentTimestamp({ submitted_at: '2026-09-20T10:00:00Z' })).toBe('2026-09-20T10:00:00Z')
    expect(paymentTimestamp({ reviewed_at: '2026-09-20T10:00:00Z' })).toBe(null)
  })
})
