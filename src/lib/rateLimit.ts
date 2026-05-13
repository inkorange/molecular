/**
 * In-memory sliding-window rate limiter.
 *
 * Per Vercel Function instance: each invocation that reuses a warm
 * container sees the same Map. Cold starts begin with an empty bucket.
 * This means determined attackers can scale around it by triggering
 * fresh instances — but it kills 90%+ of accidental abuse / runaway
 * scripts at zero infrastructure cost. Promote to Vercel KV or Upstash
 * Ratelimit if/when this becomes the rate-limiter bottleneck.
 */

interface RateLimitOptions {
  /** Max requests in `windowMs`. Defaults to 10. */
  max?: number
  /** Window in ms. Defaults to 60_000 (one minute). */
  windowMs?: number
}

interface RateLimitResult {
  allowed: boolean
  /** Seconds the client should wait before retrying. Only meaningful
   *  when `allowed === false`. */
  retryAfterSec: number
  /** Remaining quota in the current window. */
  remaining: number
}

const buckets = new Map<string, number[]>()
let lastSweep = 0

/**
 * Sweep stale entries from the bucket map. Called opportunistically by
 * rateLimit() so the map doesn't grow unbounded across unique IPs.
 * Runs at most once per windowMs.
 */
function sweep(windowMs: number, now: number) {
  if (now - lastSweep < windowMs) return
  lastSweep = now
  for (const [key, timestamps] of buckets) {
    const fresh = timestamps.filter((t) => now - t < windowMs)
    if (fresh.length === 0) buckets.delete(key)
    else if (fresh.length !== timestamps.length) buckets.set(key, fresh)
  }
}

export function rateLimit(key: string, options: RateLimitOptions = {}): RateLimitResult {
  const max = options.max ?? 10
  const windowMs = options.windowMs ?? 60_000
  const now = Date.now()

  sweep(windowMs, now)

  const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)

  if (timestamps.length >= max) {
    // Block. Retry once the oldest sample falls out of the window.
    const oldest = timestamps[0] ?? now
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000))
    buckets.set(key, timestamps)
    return { allowed: false, retryAfterSec, remaining: 0 }
  }

  timestamps.push(now)
  buckets.set(key, timestamps)
  return { allowed: true, retryAfterSec: 0, remaining: max - timestamps.length }
}

/**
 * Pull the best-effort client identifier for rate-limiting from a Request.
 * Prefers x-forwarded-for (Vercel sets it), falls back to x-real-ip, then
 * 'unknown' so an internal proxy misconfiguration doesn't make every
 * request bypass the limit.
 */
export function clientKey(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) {
    const first = fwd.split(',')[0]?.trim()
    if (first) return first
  }
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

/** Test-only: reset all buckets. Exposed so unit tests don't leak state. */
export function __resetRateLimitForTests() {
  buckets.clear()
  lastSweep = 0
}
