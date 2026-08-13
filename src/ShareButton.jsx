import { useState } from 'react'
import { buildResultShareUrl } from './resultRoute'
import { shareOrCopy } from './share'

function browserShare() {
  return navigator.share?.bind(navigator)
}

function browserWriteText() {
  return navigator.clipboard?.writeText?.bind(navigator.clipboard)
}

export default function ShareButton({
  readingId,
  shareName = '',
  disabled = false,
  className = 'secondary-btn',
}) {
  const [status, setStatus] = useState('')

  async function handleShare() {
    setStatus('')
    const url = buildResultShareUrl(window.location.origin, readingId)
    const title = shareName ? `${shareName}님의 사주` : '사주 미'
    const text = shareName
      ? `${shareName}님의 사주 해석을 공유한다냥.`
      : '사주 해석을 공유한다냥.'

    try {
      const result = await shareOrCopy({
        url,
        title,
        text,
        share: browserShare(),
        writeText: browserWriteText(),
      })
      if (result === 'copied') {
        setStatus('링크를 복사했다냥.')
      }
    } catch (err) {
      setStatus(err.message || '공유에 실패했다냥.')
    }
  }

  return (
    <div className="share-control">
      <button
        type="button"
        className={className}
        onClick={handleShare}
        disabled={disabled || !readingId}
      >
        공유
      </button>
      {status ? (
        <p className="share-status" role="status">
          {status}
        </p>
      ) : null}
    </div>
  )
}
