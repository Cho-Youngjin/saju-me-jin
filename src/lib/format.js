export function formatReadingLabel(createdAt) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt))
}

export function formatBirthTime(value) {
  return value ? String(value).slice(0, 5) : ''
}
