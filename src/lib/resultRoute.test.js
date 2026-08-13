import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildResultShareUrl,
  isResultPath,
  parseResultPath,
} from './resultRoute.js'

const READING_ID = '9006badd-1e92-4f7e-b1a2-c32a2c6f3d22'

describe('parseResultPath', () => {
  it('returns the reading id from /result/:uuid', () => {
    assert.equal(parseResultPath(`/result/${READING_ID}`), READING_ID)
  })

  it('accepts an optional trailing slash', () => {
    assert.equal(parseResultPath(`/result/${READING_ID}/`), READING_ID)
  })

  it('normalizes uppercase uuids', () => {
    assert.equal(
      parseResultPath(`/result/${READING_ID.toUpperCase()}`),
      READING_ID,
    )
  })

  it('returns null for the app root', () => {
    assert.equal(parseResultPath('/'), null)
  })

  it('returns null for a missing id', () => {
    assert.equal(parseResultPath('/result'), null)
    assert.equal(parseResultPath('/result/'), null)
  })

  it('returns null for a non-uuid id', () => {
    assert.equal(parseResultPath('/result/not-a-uuid'), null)
  })

  it('returns null for extra path segments', () => {
    assert.equal(parseResultPath(`/result/${READING_ID}/extra`), null)
  })
})

describe('isResultPath', () => {
  it('detects result routes even with an invalid id', () => {
    assert.equal(isResultPath('/result'), true)
    assert.equal(isResultPath('/result/'), true)
    assert.equal(isResultPath('/result/not-a-uuid'), true)
    assert.equal(isResultPath(`/result/${READING_ID}`), true)
  })

  it('returns false for the app root', () => {
    assert.equal(isResultPath('/'), false)
  })
})

describe('buildResultShareUrl', () => {
  it('builds a result url from origin and reading id', () => {
    assert.equal(
      buildResultShareUrl('https://saju-me-jin.vercel.app', READING_ID),
      `https://saju-me-jin.vercel.app/result/${READING_ID}`,
    )
  })

  it('strips a trailing slash from origin', () => {
    assert.equal(
      buildResultShareUrl('https://saju-me-jin.vercel.app/', READING_ID),
      `https://saju-me-jin.vercel.app/result/${READING_ID}`,
    )
  })
})
