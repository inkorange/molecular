import { deflateRaw, inflateRaw } from 'pako'

/**
 * URL-safe base64 (RFC 4648 §5) — `+` → `-`, `/` → `_`, and the `=` padding
 * stripped. Reversible by `base64UrlToBytes`. Hand-rolled rather than using
 * `Buffer` so this also works in browser context.
 */
function bytesToBase64Url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/**
 * Encode an arbitrary string payload as a URL-safe hash:
 *   raw deflate (level 9) → base64url
 *
 * Deflate keeps share URLs compact for any realistic scene; base64url makes
 * the result safe to drop into a path segment with no further escaping.
 */
export function encodeToHash(payload: string): string {
  const bytes = deflateRaw(new TextEncoder().encode(payload), { level: 9 })
  return bytesToBase64Url(bytes)
}

/** Reverse of {@link encodeToHash}. Throws on malformed input. */
export function decodeFromHash(hash: string): string {
  const bytes = base64UrlToBytes(hash)
  const out = inflateRaw(bytes)
  return new TextDecoder().decode(out)
}
