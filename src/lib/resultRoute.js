const RESULT_PATH =
  /^\/result\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i

export function parseResultPath(pathname) {
  const match = pathname.match(RESULT_PATH)
  return match ? match[1].toLowerCase() : null
}

export function isResultPath(pathname) {
  return pathname === '/result' || pathname.startsWith('/result/')
}

export function buildResultShareUrl(origin, readingId) {
  return `${origin.replace(/\/$/, '')}/result/${readingId}`
}
