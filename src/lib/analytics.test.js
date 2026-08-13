import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { trackEvent } from './analytics.js'

afterEach(() => {
  delete globalThis.window
})

describe('trackEvent', () => {
  it('sends the event through gtag when available', () => {
    const calls = []
    globalThis.window = {
      gtag(...args) {
        calls.push(args)
      },
    }

    trackEvent('login', { method: 'Google', login_source: 'guest_header' })

    assert.deepEqual(calls, [
      ['event', 'login', { method: 'Google', login_source: 'guest_header' }],
    ])
  })

  it('does nothing when gtag is missing', () => {
    globalThis.window = {}
    assert.doesNotThrow(() => trackEvent('analyze', { user_type: 'guest' }))
  })
})
