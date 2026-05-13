/**
 * Coarse device classification used to gate expensive rendering work.
 *
 * - `mobile-lite` — touch device with ≤ 4 logical cores (typical phones).
 *   Skip postprocessing (bloom) and high-density particle counts here.
 * - `tablet` — touch device with more cores (iPad-class).
 * - `desktop` — non-touch pointer (mouse).
 *
 * The check is intentionally one-shot at mount, not reactive — Phase 9
 * gates feature flags off it, not anything that changes mid-session.
 */
export type DeviceTier = 'mobile-lite' | 'tablet' | 'desktop'

export function detectDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'desktop'
  const isTouch = window.matchMedia('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency ?? 4
  if (isTouch && cores <= 4) return 'mobile-lite'
  if (isTouch) return 'tablet'
  return 'desktop'
}
