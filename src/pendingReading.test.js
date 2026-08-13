import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  PENDING_READING_KEY,
  buildClaimActions,
  clearPendingReading,
  readPendingReading,
  writePendingReading,
} from './pendingReading.js'

const profile = {
  name: '집사',
  birth_date: '1998-01-15',
  birth_time: '09:30',
  gender: '여자',
  calendar_type: '양력',
}

const pending = {
  profile,
  result: '앞부분 해석\n\n뒷부분 해석',
}

function createMemoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null
    },
    setItem(key, value) {
      data[key] = String(value)
    },
    removeItem(key) {
      delete data[key]
    },
  }
}

describe('writePendingReading / readPendingReading', () => {
  it('round-trips a guest profile and result', () => {
    const storage = createMemoryStorage()
    writePendingReading(pending, storage)
    assert.deepEqual(readPendingReading(storage), pending)
  })

  it('returns null when storage is empty', () => {
    assert.equal(readPendingReading(createMemoryStorage()), null)
  })

  it('returns null for invalid json', () => {
    const storage = createMemoryStorage({ [PENDING_READING_KEY]: '{nope' })
    assert.equal(readPendingReading(storage), null)
  })

  it('returns null when result or required profile fields are missing', () => {
    const storage = createMemoryStorage()
    writePendingReading({ profile, result: '   ' }, storage)
    assert.equal(readPendingReading(storage), null)

    writePendingReading({ profile: { ...profile, name: '' }, result: 'ok' }, storage)
    assert.equal(readPendingReading(storage), null)
  })
})

describe('clearPendingReading', () => {
  it('removes the stored guest reading', () => {
    const storage = createMemoryStorage()
    writePendingReading(pending, storage)
    clearPendingReading(storage)
    assert.equal(readPendingReading(storage), null)
  })
})

describe('buildClaimActions', () => {
  const userId = 'user-1'

  it('returns no writes when there is no pending reading', () => {
    assert.deepEqual(
      buildClaimActions({ existingProfile: null, pending: null, userId }),
      { profileInsert: null, readingInsert: null },
    )
  })

  it('inserts both profile and reading for a first-time account', () => {
    assert.deepEqual(
      buildClaimActions({ existingProfile: null, pending, userId }),
      {
        profileInsert: { id: userId, ...profile },
        readingInsert: {
          user_id: userId,
          share_name: pending.profile.name,
          result: pending.result,
        },
      },
    )
  })

  it('keeps an existing profile and only inserts the reading', () => {
    const existingProfile = { id: userId, name: '기존' }
    assert.deepEqual(
      buildClaimActions({ existingProfile, pending, userId }),
      {
        profileInsert: null,
        readingInsert: {
          user_id: userId,
          share_name: pending.profile.name,
          result: pending.result,
        },
      },
    )
  })
})
