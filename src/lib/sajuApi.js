import { formatBirthTime } from './format'
import { requestSajuAnalysis } from './gemini'
import {
  buildClaimActions,
  clearPendingReading,
  readPendingReading,
} from './pendingReading'
import { buildSajuPrompt } from './prompt'
import { supabase } from './supabase'

export const READING_COLUMNS = 'id, user_id, share_name, result, created_at'
export const PROFILE_COLUMNS =
  'id, name, birth_date, birth_time, gender, calendar_type, created_at'

export async function fetchProfile() {
  const { data, error: fetchError } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .maybeSingle()

  if (fetchError) throw fetchError
  return data ?? null
}

export async function fetchReadings() {
  const { data, error: fetchError } = await supabase
    .from('saju_readings')
    .select(READING_COLUMNS)
    .order('created_at', { ascending: false })

  if (fetchError) throw fetchError
  return data ?? []
}

export async function claimPendingReading(userId) {
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

export async function saveProfile({ userId, existingProfile, payload }) {
  const query = existingProfile
    ? supabase.from('profiles').update(payload).eq('id', userId)
    : supabase.from('profiles').insert({ id: userId, ...payload })

  const { data, error: saveError } = await query
    .select(PROFILE_COLUMNS)
    .single()

  if (saveError) throw saveError
  return data
}

export async function analyzeFromInputs(payload) {
  const prompt = buildSajuPrompt({
    name: payload.name,
    birthDate: payload.birth_date,
    birthTime: formatBirthTime(payload.birth_time),
    gender: payload.gender,
    calendarType: payload.calendar_type,
  })
  return requestSajuAnalysis(prompt)
}

export async function insertReading({ userId, shareName, result }) {
  const { data, error: insertError } = await supabase
    .from('saju_readings')
    .insert({
      user_id: userId,
      share_name: shareName,
      result,
    })
    .select(READING_COLUMNS)
    .single()

  if (insertError) throw insertError
  return data
}

export async function deleteReading(id) {
  const { error: deleteError } = await supabase
    .from('saju_readings')
    .delete()
    .eq('id', id)

  if (deleteError) throw deleteError
}

export async function fetchPublicReading(readingId) {
  const { data, error: fetchError } = await supabase.rpc('get_public_reading', {
    p_id: readingId,
  })

  if (fetchError) throw fetchError
  return Array.isArray(data) ? data[0] : data
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}
