'use client'

import { useEffect } from 'react'

/**
 * Registers `/sw.js` once on mount in production builds. Bails in dev
 * to avoid the service worker caching dev-server assets, which would
 * make HMR confusing. Failures are swallowed — a missing service
 * worker is a perf regression, not an app failure.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
  return null
}
