export function normalizePhone(value) {
  if (value === undefined || value === null) return ''
  return String(value).replace(/\D/g, '')
}

export function formatPhone(value) {
  const digits = normalizePhone(value)
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    const body = digits.slice(1)
    return `+7 ${body.slice(0, 3)} ${body.slice(3, 6)}-${body.slice(6, 8)}-${body.slice(8, 10)}`
  }
  if (digits.length >= 10) return `+${digits}`
  return digits
}

export function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function avatarColor(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 62%, 52%)`
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
