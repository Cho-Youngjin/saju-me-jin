import { formatReadingLabel } from '../../lib/format'

export default function Sidebar({
  email,
  hasProfile,
  readings,
  selectedId,
  busy,
  onEditProfile,
  onLogout,
  onSelectReading,
}) {
  return (
    <aside className="sidebar" aria-label="저장된 사주 목록">
      <div className="account-bar">
        <p className="account-email">{email}</p>
        {hasProfile && (
          <button
            type="button"
            className="logout-btn"
            onClick={onEditProfile}
            disabled={busy}
          >
            프로필
          </button>
        )}
        <button
          type="button"
          className="logout-btn"
          onClick={onLogout}
          disabled={busy}
        >
          로그아웃
        </button>
      </div>
      <h2 className="sidebar-title">해석 기록</h2>
      {readings.length === 0 ? (
        <p className="sidebar-empty">아직 해석이 없다냥.</p>
      ) : (
        <ul className="sidebar-list">
          {readings.map((reading) => (
            <li key={reading.id}>
              <button
                type="button"
                className={
                  selectedId === reading.id
                    ? 'sidebar-item sidebar-item-active'
                    : 'sidebar-item'
                }
                onClick={() => onSelectReading(reading)}
                disabled={busy || !hasProfile}
              >
                {formatReadingLabel(reading.created_at)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
