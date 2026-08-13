import { useEffect, useState } from 'react'
import { trackEvent } from '../lib/analytics'
import {
  clearPendingReading,
  readPendingReading,
  writePendingReading,
} from '../lib/pendingReading'
import {
  analyzeFromInputs,
  claimPendingReading,
  deleteReading,
  insertReading,
  saveProfile,
  signInWithGoogle,
  signOut,
} from '../lib/sajuApi'
import { supabase } from '../lib/supabase'

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

export function useSajuApp() {
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
  const showProfileModal = Boolean(user) && (needsOnboarding || editingProfile)
  const googleName = user
    ? user.user_metadata?.full_name || user.user_metadata?.name || ''
    : ''

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

  async function handleGoogleLogin(loginSource = 'unknown') {
    trackEvent('login', { method: 'Google', login_source: loginSource })
    setAuthBusy(true)
    setError('')

    if (!user && result && guestProfile) {
      writePendingReading({ profile: guestProfile, result })
    }

    const { error: oauthError } = await signInWithGoogle()

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

    const { error: signOutError } = await signOut()

    if (signOutError) {
      console.error(signOutError)
      setError(signOutError.message || '로그아웃에 실패했습니다.')
      setAuthBusy(false)
      return
    }

    trackEvent('logout')
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
      const data = await saveProfile({
        userId: user.id,
        existingProfile: profile,
        payload,
      })
      trackEvent('save_profile', { context: profile ? 'edit' : 'onboarding' })
      setProfile(data)
      setEditingProfile(false)
    } catch (err) {
      console.error(err)
      setProfileError(err.message || '프로필을 저장하지 못했습니다.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleGuestAnalyze(payload) {
    trackEvent('analyze', { user_type: 'guest' })
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

    trackEvent('analyze', { user_type: 'member' })
    setLoading(true)
    setError('')
    setResult('')

    try {
      const text = await analyzeFromInputs({
        name: profile.name,
        birth_date: profile.birth_date,
        birth_time: profile.birth_time,
        gender: profile.gender,
        calendar_type: profile.calendar_type,
      })
      setResult(text)

      const data = await insertReading({
        userId: user.id,
        shareName: profile.name,
        result: text,
      })

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
      await deleteReading(selectedId)
      trackEvent('delete_reading')
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

  function openProfileEditor() {
    setProfileError('')
    setEditingProfile(true)
  }

  function closeProfileEditor() {
    setEditingProfile(false)
  }

  return {
    authReady,
    authBusy,
    user,
    profile,
    guestProfile,
    result,
    loading,
    error,
    profileError,
    readings,
    selectedId,
    busy,
    savingProfile,
    needsOnboarding,
    showProfileModal,
    googleName,
    handleGoogleLogin,
    handleLogout,
    handleSaveProfile,
    handleGuestAnalyze,
    handleAnalyze,
    handleDelete,
    handleSelectReading,
    openProfileEditor,
    closeProfileEditor,
  }
}
