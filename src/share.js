export async function shareOrCopy({
  url,
  title,
  text,
  share,
  writeText,
}) {
  if (typeof share === 'function') {
    try {
      await share({ title, text, url })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }

  if (typeof writeText !== 'function') {
    throw new Error('공유를 지원하지 않습니다.')
  }

  await writeText(url)
  return 'copied'
}
