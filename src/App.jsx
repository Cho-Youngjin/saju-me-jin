import { useEffect, useState } from 'react'
import './App.css'
import { buildSajuPrompt } from './prompt'
import { requestSajuAnalysis } from './gemini'
import MarkdownResult from './MarkdownResult'
import ProfileModal from './ProfileModal'
import GuestForm from './GuestForm'
import Mascot from './Mascot'
import {
  buildClaimActions,
  clearPendingReading,
  readPendingReading,
  writePendingReading,
} from './pendingReading'
import ShareButton from './ShareButton'
import { supabase } from './supabase'

const READING_COLUMNS = 'id, user_id, share_name, result, created_at'
const PROFILE_COLUMNS =
  'id, name, birth_date, birth_time, gender, calendar_type, created_at'

let pendingClaim = null

function withClaimLock(task) {
  if (!pendingClaim) {
    pendingClaim = Promise.resolve()
      .then(task)
      .finally(() => {
        pendingClaim = null
      })
  }
  return pendingClaim
}

function formatReadingLabel(createdAt) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt))
}

function formatBirthTime(value) {
  return value ? String(value).slice(0, 5) : ''
}

async function fetchProfile() {
  const { data, error: fetchError } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .maybeSingle()

  if (fetchError) throw fetchError
  return data ?? null
}

async function fetchReadings() {
  const { data, error: fetchError } = await supabase
    .from('saju_readings')
    .select(READING_COLUMNS)
    .order('created_at', { ascending: false })

  if (fetchError) throw fetchError
  return data ?? []
}

async function claimPendingReading(userId) {
  const pending = readPendingReading()
  const [existingProfile, existingReadings] = await Promise.all([
    fetchProfile(),
    fetchReadings(),
  ])
  const { profileInsert, readingInsert } = buildClaimActions({
    existingProfile,
    pending,
    userId,
  })

  let nextProfile = existingProfile
  if (profileInsert) {
    const { data, error: saveError } = await supabase
      .from('profiles')
      .insert(profileInsert)
      .select(PROFILE_COLUMNS)
      .single()
    if (saveError) throw saveError
    nextProfile = data
  }

  let nextReadings = existingReadings
  let claimedReading = null
  if (readingInsert) {
    const { data, error: insertError } = await supabase
      .from('saju_readings')
      .insert(readingInsert)
      .select(READING_COLUMNS)
      .single()
    if (insertError) throw insertError
    claimedReading = data
    nextReadings = [data, ...existingReadings]
    clearPendingReading()
  }

  return {
    profile: nextProfile,
    readings: nextReadings,
    claimedReading,
  }
}

function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)

  const [profile, setProfile] = useState(null)
  const [profileReady, setProfileReady] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [guestProfile, setGuestProfile] = useState(null)

  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profileError, setProfileError] = useState('')

  const [readings, setReadings] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const busy = loading || saving || authBusy || savingProfile
  const user = session?.user ?? null
  const needsOnboarding = authReady && Boolean(user) && profileReady && !profile

  useEffect(() => {
    let cancelled = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      setAuthReady(true)

      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        return
      }

      if (!nextSession?.user) {
        const pending = readPendingReading()
        setProfile(null)
        setProfileReady(false)
        setReadings([])
        setSelectedId(null)
        setEditingProfile(false)
        setGuestProfile(pending?.profile ?? null)
        setResult(pending?.result ?? '')
        return
      }

      withClaimLock(() => claimPendingReading(nextSession.user.id))
        .then(({ profile: nextProfile, readings: nextReadings, claimedReading }) => {
          if (cancelled) return
          setProfile(nextProfile)
          setProfileReady(true)
          setReadings(nextReadings)
          if (claimedReading) {
            setSelectedId(claimedReading.id)
            setResult(claimedReading.result ?? '')
            setGuestProfile(null)
          }
          setError('')
        })
        .catch((err) => {
          if (cancelled) return
          console.error(err)
          setProfileReady(true)
          setError(err.message || '사용자 정보를 불러오지 못했습니다.')
        })
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function handleGoogleLogin() {
    setAuthBusy(true)
    setError('')

    if (!user && result && guestProfile) {
      writePendingReading({ profile: guestProfile, result })
    }

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (oauthError) {
      console.error(oauthError)
      setError(oauthError.message || 'Google 로그인에 실패했습니다.')
      setAuthBusy(false)
    }
  }

  async function handleLogout() {
    setAuthBusy(true)
    setError('')
    clearPendingReading()

    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      console.error(signOutError)
      setError(signOutError.message || '로그아웃에 실패했습니다.')
      setAuthBusy(false)
      return
    }

    setSelectedId(null)
    setResult('')
    setReadings([])
    setProfile(null)
    setGuestProfile(null)
    setEditingProfile(false)
    setAuthBusy(false)
  }

  async function handleSaveProfile(payload) {
    if (!user) return

    setSavingProfile(true)
    setProfileError('')

    try {
      const query = profile
        ? supabase.from('profiles').update(payload).eq('id', user.id)
        : supabase.from('profiles').insert({ id: user.id, ...payload })

      const { data, error: saveError } = await query
        .select(PROFILE_COLUMNS)
        .single()

      if (saveError) throw saveError

      setProfile(data)
      setEditingProfile(false)
    } catch (err) {
      console.error(err)
      setProfileError(err.message || '프로필을 저장하지 못했습니다.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function analyzeFromInputs(payload) {
    const prompt = buildSajuPrompt({
      name: payload.name,
      birthDate: payload.birth_date,
      birthTime: formatBirthTime(payload.birth_time),
      gender: payload.gender,
      calendarType: payload.calendar_type,
    })
    return requestSajuAnalysis(prompt)
  }

  async function handleGuestAnalyze(payload) {
    setLoading(true)
    setError('')
    setResult('')
    setGuestProfile(payload)

    try {
      const text = await analyzeFromInputs(payload)
      setResult(text)
      writePendingReading({ profile: payload, result: text })
    } catch (err) {
      console.error(err)
      setError(err.message || '사주 해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyze() {
    if (!profile || !user) return

    setLoading(true)
    setError('')
    setResult('')

    try {
      const text = await analyzeFromInputs({
        name: profile.name,
        birth_date: profile.birth_date,
        birth_time: formatBirthTime(profile.birth_time),
        gender: profile.gender,
        calendar_type: profile.calendar_type,
      })
      setResult(text)

      const { data, error: insertError } = await supabase
        .from('saju_readings')
        .insert({
          user_id: user.id,
          share_name: profile.name,
          result: text,
        })
        .select(READING_COLUMNS)
        .single()

      if (insertError) throw insertError

      setReadings((prev) => [data, ...prev])
      setSelectedId(data.id)
    } catch (err) {
      console.error(err)
      setError(err.message || '사주 해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!selectedId) return
    if (!window.confirm('이 해석을 삭제할까냥?')) return

    setSaving(true)
    setError('')

    try {
      const { error: deleteError } = await supabase
        .from('saju_readings')
        .delete()
        .eq('id', selectedId)

      if (deleteError) throw deleteError

      setReadings((prev) => prev.filter((reading) => reading.id !== selectedId))
      setSelectedId(null)
      setResult('')
    } catch (err) {
      console.error(err)
      setError(err.message || '해석을 삭제하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function handleSelectReading(reading) {
    setSelectedId(reading.id)
    setResult(reading.result ?? '')
    setError('')
  }

  if (!authReady) {
    return (
      <div className="auth-screen">
        <p className="auth-loading">확인 중이라냥...</p>
      </div>
    )
  }

  const showProfileModal = Boolean(user) && (needsOnboarding || editingProfile)
  const googleName = user
    ? user.user_metadata?.full_name || user.user_metadata?.name || ''
    : ''

  return (
    <div className={user ? 'layout' : 'layout layout-guest'}>
      {user && (
        <aside className="sidebar" aria-label="저장된 사주 목록">
          <div className="account-bar">
            <p className="account-email">{user.email}</p>
            {profile && (
              <button
                type="button"
                className="logout-btn"
                onClick={() => {
                  setProfileError('')
                  setEditingProfile(true)
                }}
                disabled={busy}
              >
                프로필
              </button>
            )}
            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
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
                    onClick={() => handleSelectReading(reading)}
                    disabled={busy || !profile}
                  >
                    {formatReadingLabel(reading.created_at)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}

      <div className="app">
        {user ? (
          profile ? (
            <>
              <section className="profile-summary" aria-label="내 사주 정보">
                <h1 className="preview">{profile.name}님의 사주</h1>
                <dl className="profile-facts">
                  <div>
                    <dt>생년월일</dt>
                    <dd>{profile.birth_date}</dd>
                  </div>
                  <div>
                    <dt>태어난 시간</dt>
                    <dd>{formatBirthTime(profile.birth_time)}</dd>
                  </div>
                  <div>
                    <dt>성별</dt>
                    <dd>{profile.gender}</dd>
                  </div>
                  <div>
                    <dt>양력/음력</dt>
                    <dd>{profile.calendar_type}</dd>
                  </div>
                </dl>
              </section>

              <button
                type="button"
                className="analyze-btn"
                onClick={handleAnalyze}
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
                    shareName={
                      readings.find((reading) => reading.id === selectedId)
                        ?.share_name || profile.name
                    }
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={handleDelete}
                    disabled={busy}
                  >
                    삭제
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="sidebar-empty">프로필을 알려주면 사주를 봐준다냥.</p>
          )
        ) : (
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
                onClick={handleGoogleLogin}
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
              onSubmit={handleGuestAnalyze}
              busy={busy}
            />
          </>
        )}

        {error && (
          <p className="error" style={{ color: 'red' }}>
            {error}
          </p>
        )}

        {loading && (
          <section className="result result-loading" aria-busy="true" aria-live="polite">
            <img
              src="/assets/loading-cat.png"
              alt="운명의 지도를 분석 중이에요"
              className="loading-cat"
            />
            <span className="sr-only">사주 해석을 불러오는 중입니다.</span>
          </section>
        )}

        {!loading && result && (
          <section className={user ? 'result' : 'result result-gated'}>
            <div className="result-heading">
              <Mascot size="md" />
              <h2>기본 차트 해석</h2>
            </div>
            <MarkdownResult content={result} />
            {!user && (
              <div className="result-gate">
                <p className="result-gate-copy">나머지 해석은 로그인하면 본다냥.</p>
                <button
                  type="button"
                  className="analyze-btn"
                  onClick={handleGoogleLogin}
                  disabled={authBusy}
                >
                  {authBusy ? '이동 중이라냥...' : 'Google로 들어오면 나머지도 본다냥'}
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {showProfileModal && (
        <ProfileModal
          key={profile?.id ?? 'onboarding'}
          title={needsOnboarding ? '내 정보 알려달라냥' : '프로필 수정'}
          copy={
            needsOnboarding
              ? '사주를 보려면 필수 정보를 적어달라냥.'
              : '바꾼 내용은 다음 풀이부터 반영된다냥.'
          }
          initialProfile={
            profile ?? (googleName ? { name: googleName } : null)
          }
          submitLabel={needsOnboarding ? '시작할게냥' : '저장할게냥'}
          onSubmit={handleSaveProfile}
          onClose={needsOnboarding ? undefined : () => setEditingProfile(false)}
          busy={savingProfile}
          error={profileError}
        />
      )}
    </div>
  )
}

export default App
