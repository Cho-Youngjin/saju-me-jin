import Mascot from '../shared/Mascot'
import GuestForm from './GuestForm'

export default function GuestHome({
  guestProfile,
  loading,
  result,
  busy,
  authBusy,
  onLogin,
  onAnalyze,
}) {
  return (
    <>
      <header className="guest-header">
        <div className="guest-brand">
          <Mascot size="md" />
          <div>
            <h1 className="guest-title">사주 미</h1>
            <p className="guest-copy">생년월일을 알려주면 사주를 봐준다냥.</p>
          </div>
        </div>
        <button
          type="button"
          className="logout-btn guest-login-btn"
          onClick={() => onLogin('guest_header')}
          disabled={authBusy}
        >
          {authBusy ? '이동 중이라냥...' : 'Google로 들어오기'}
        </button>
      </header>
      <GuestForm
        initialProfile={guestProfile}
        submitLabel={
          loading ? '풀이 중이라냥...' : result ? '다시 봐달라냥' : '사주 봐달라냥'
        }
        onSubmit={onAnalyze}
        busy={busy}
      />
    </>
  )
}
