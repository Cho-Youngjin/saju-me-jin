import ProfileSummary from '../profile/ProfileSummary'
import ShareButton from './ShareButton'

export default function MemberHome({
  profile,
  readings,
  selectedId,
  loading,
  busy,
  onAnalyze,
  onDelete,
}) {
  if (!profile) {
    return <p className="sidebar-empty">프로필을 알려주면 사주를 봐준다냥.</p>
  }

  const selected = readings.find((reading) => reading.id === selectedId)

  return (
    <>
      <ProfileSummary profile={profile} />

      <button
        type="button"
        className="analyze-btn"
        onClick={onAnalyze}
        disabled={busy}
      >
        {loading
          ? '풀이 중이라냥...'
          : readings.length > 0
            ? '다시 봐달라냥'
            : '사주 봐달라냥'}
      </button>

      {selectedId && (
        <div className="action-row">
          <ShareButton
            readingId={selectedId}
            shareName={selected?.share_name || profile.name}
            disabled={busy}
          />
          <button
            type="button"
            className="danger-btn"
            onClick={onDelete}
            disabled={busy}
          >
            삭제
          </button>
        </div>
      )}
    </>
  )
}
