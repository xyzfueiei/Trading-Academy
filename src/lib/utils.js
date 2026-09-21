export function cn(...values) {
  return values.flatMap((value) => {
    if (!value) return []
    if (typeof value === 'string') return value.split(' ')
    if (typeof value === 'object') return Object.entries(value).filter(([, active]) => active).map(([name]) => name)
    return []
  }).join(' ')
}

export function initials(value = '') {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join('') || 'TA'
}
