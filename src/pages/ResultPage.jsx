import { useEffect, useState } from 'react'
import MarkdownResult from '../components/reading/MarkdownResult'
import ShareButton from '../components/reading/ShareButton'
import Mascot from '../components/shared/Mascot'
import { trackEvent } from '../lib/analytics'
import { fetchPublicReading } from '../lib/sajuApi'

export default function ResultPage({ readingId }) {
  const [reading, setReading] = useState(null)
  const [loading, setLoading] = useState(Boolean(readingId))
  const [error, setError] = useState(
    readingId ? '' : '이 해석을 찾을 수 없다냥.',
  )

  useEffect(() => {
    if (!readingId) return undefined

    let cancelled = false

    fetchPublicReading(readingId)
      .then((row) => {
        if (cancelled) return

        if (!row) {
          setError('이 해석을 찾을 수 없다냥.')
          return
        }

        setReading(row)
        trackEvent('view_shared_result', { reading_id: row.id })
      })
      .catch((fetchError) => {
        if (cancelled) return
        setError(fetchError.message || '해석을 불러오지 못했다냥.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [readingId])

  return (
    <div className="app result-page">
      <header className="result-page-header">
        <a className="result-home-link" href="/">
          사주 미
        </a>
      </header>

      {loading ? (
        <p className="result-page-status">불러오는 중이라냥...</p>
      ) : error ? (
        <section className="result-page-empty">
          <Mascot size="md" />
          <p>{error}</p>
          <a className="result-home-link" href="/">
            홈으로 돌아가기
          </a>
        </section>
      ) : reading ? (
        <section className="result">
          <h1 className="preview">{reading.share_name}님의 사주</h1>
          <ShareButton
            readingId={reading.id}
            shareName={reading.share_name}
          />
          <div className="result-heading">
            <Mascot size="md" />
            <h2>기본 차트 해석</h2>
          </div>
          <MarkdownResult content={reading.result ?? ''} />
        </section>
      ) : (
        <p className="result-page-status">이 해석을 찾을 수 없다냥.</p>
      )}
    </div>
  )
}
