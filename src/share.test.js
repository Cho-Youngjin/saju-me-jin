import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { shareOrCopy } from './share.js'

const payload = {
  url: 'https://saju-me-jin.vercel.app/result/9006badd-1e92-4f7e-b1a2-c32a2c6f3d22',
  title: '사주 미',
  text: 'ddd님의 사주 해석을 공유한다냥.',
}

describe('shareOrCopy', () => {
  it('uses the native share sheet when available', async () => {
    const shared = []
    const result = await shareOrCopy({
      ...payload,
      share: async (data) => {
        shared.push(data)
      },
      writeText: async () => {
        throw new Error('clipboard should not be used')
      },
    })

    assert.equal(result, 'shared')
    assert.deepEqual(shared, [
      { title: payload.title, text: payload.text, url: payload.url },
    ])
  })

  it('returns cancelled when the share sheet is dismissed', async () => {
    const err = new Error('Share canceled')
    err.name = 'AbortError'

    const result = await shareOrCopy({
      ...payload,
      share: async () => {
        throw err
      },
      writeText: async () => {
        throw new Error('clipboard should not be used')
      },
    })

    assert.equal(result, 'cancelled')
  })

  it('copies the url when native share is unavailable', async () => {
    let copied = ''
    const result = await shareOrCopy({
      ...payload,
      writeText: async (text) => {
        copied = text
      },
    })

    assert.equal(result, 'copied')
    assert.equal(copied, payload.url)
  })

  it('copies the url when native share fails', async () => {
    let copied = ''
    const result = await shareOrCopy({
      ...payload,
      share: async () => {
        throw new Error('share failed')
      },
      writeText: async (text) => {
        copied = text
      },
    })

    assert.equal(result, 'copied')
    assert.equal(copied, payload.url)
  })

  it('throws when neither share nor clipboard is available', async () => {
    await assert.rejects(
      () => shareOrCopy(payload),
      /공유를 지원하지 않습니다/,
    )
  })
})
