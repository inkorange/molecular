import { describe, expect, it } from 'vitest'
import { decodeFromHash, encodeToHash } from '@/src/lib/shareUrl'

describe('shareUrl', () => {
  it('round-trips a JSON payload', () => {
    const payload = JSON.stringify({ hello: 'world', n: 42 })
    const hash = encodeToHash(payload)
    expect(decodeFromHash(hash)).toBe(payload)
  })

  it('handles unicode', () => {
    const p = '{"name":"水"}'
    expect(decodeFromHash(encodeToHash(p))).toBe(p)
  })

  it('produces url-safe characters only', () => {
    const payload = JSON.stringify({ scene: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] })
    const hash = encodeToHash(payload)
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('compresses redundant payloads', () => {
    // Highly repetitive input — deflate should shrink it noticeably.
    const payload = JSON.stringify({ x: 'aaaaaaaaaaaaaaaaaaaa'.repeat(50) })
    const hash = encodeToHash(payload)
    expect(hash.length).toBeLessThan(payload.length / 4)
  })

  it('throws on malformed input', () => {
    // Invalid base64url — decode should not silently succeed.
    expect(() => decodeFromHash('!!!not-real!!!')).toThrow()
  })
})
