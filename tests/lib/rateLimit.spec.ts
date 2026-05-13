import { beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetRateLimitForTests, clientKey, rateLimit } from '@/src/lib/rateLimit'

describe('rateLimit', () => {
  beforeEach(() => {
    __resetRateLimitForTests()
    vi.useRealTimers()
  })

  it('allows up to max requests in the window', () => {
    for (let i = 0; i < 10; i++) {
      const r = rateLimit('user-a', { max: 10, windowMs: 60_000 })
      expect(r.allowed).toBe(true)
      expect(r.remaining).toBe(9 - i)
    }
  })

  it('blocks the 11th request and returns a retry hint', () => {
    for (let i = 0; i < 10; i++) rateLimit('user-b', { max: 10, windowMs: 60_000 })
    const r = rateLimit('user-b', { max: 10, windowMs: 60_000 })
    expect(r.allowed).toBe(false)
    expect(r.retryAfterSec).toBeGreaterThan(0)
    expect(r.remaining).toBe(0)
  })

  it('isolates keys', () => {
    for (let i = 0; i < 10; i++) rateLimit('user-c', { max: 10 })
    const blocked = rateLimit('user-c', { max: 10 })
    expect(blocked.allowed).toBe(false)
    // user-d still has full quota
    const fresh = rateLimit('user-d', { max: 10 })
    expect(fresh.allowed).toBe(true)
    expect(fresh.remaining).toBe(9)
  })

  it('releases quota after the window slides', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    for (let i = 0; i < 10; i++) rateLimit('user-e', { max: 10, windowMs: 60_000 })
    expect(rateLimit('user-e', { max: 10, windowMs: 60_000 }).allowed).toBe(false)
    // Advance past the window.
    vi.setSystemTime(new Date('2026-01-01T00:01:01Z'))
    const r = rateLimit('user-e', { max: 10, windowMs: 60_000 })
    expect(r.allowed).toBe(true)
  })
})

describe('clientKey', () => {
  it('prefers the first IP in x-forwarded-for', () => {
    const req = new Request('http://x', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(clientKey(req)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new Request('http://x', { headers: { 'x-real-ip': '9.8.7.6' } })
    expect(clientKey(req)).toBe('9.8.7.6')
  })

  it("returns 'unknown' when no proxy headers are set", () => {
    const req = new Request('http://x')
    expect(clientKey(req)).toBe('unknown')
  })
})
