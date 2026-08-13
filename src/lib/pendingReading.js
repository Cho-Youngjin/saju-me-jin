export const PENDING_READING_KEY = 'saju-pending-reading'

function hasRequiredProfile(profile) {
  return Boolean(
    profile &&
      typeof profile.name === 'string' &&
      profile.name.trim() &&
      profile.birth_date &&
      profile.birth_time &&
      profile.gender &&
      profile.calendar_type,
  )
}

export function readPendingReading(storage = globalThis.localStorage) {
  if (!storage) return null

  const raw = storage.getItem(PENDING_READING_KEY)
  if (!raw) return null

  try {
    const data = JSON.parse(raw)
    if (typeof data?.result !== 'string' || !data.result.trim()) return null
    if (!hasRequiredProfile(data.profile)) return null
    return {
      profile: {
        name: data.profile.name.trim(),
        birth_date: data.profile.birth_date,
        birth_time: data.profile.birth_time,
        gender: data.profile.gender,
        calendar_type: data.profile.calendar_type,
      },
      result: data.result,
    }
  } catch {
    return null
  }
}

export function writePendingReading(pending, storage = globalThis.localStorage) {
  storage.setItem(PENDING_READING_KEY, JSON.stringify(pending))
}

export function clearPendingReading(storage = globalThis.localStorage) {
  storage.removeItem(PENDING_READING_KEY)
}

export function buildClaimActions({ existingProfile, pending, userId }) {
  if (!pending) {
    return { profileInsert: null, readingInsert: null }
  }

  return {
    profileInsert: existingProfile
      ? null
      : { id: userId, ...pending.profile },
    readingInsert: {
      user_id: userId,
      share_name: pending.profile.name,
      result: pending.result,
    },
  }
}
