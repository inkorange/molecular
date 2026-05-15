'use client'

import { useEffect } from 'react'

/**
 * Route-level error boundary for /elements/[slug]. Catches anything that
 * throws inside the detail page (3D scene, content rendering, etc.) and
 * surfaces it instead of letting Next.js silently render its default
 * blank fallback. Also logs to the console so DevTools captures the
 * stack.
 */
export default function ElementSlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[/elements/[slug]] error boundary caught:', error)
  }, [error])

  return (
    <main className="flex min-h-dvh w-full items-center justify-center px-6 py-16 md:px-12">
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 font-bold text-[#ec59b6] text-xs uppercase tracking-[0.3em]">Error</p>
        <h1 className="mb-4 font-extrabold text-3xl text-white tracking-tight md:text-5xl">
          Something broke on this element
        </h1>
        <pre className="mb-4 max-h-[40vh] overflow-auto rounded-lg border border-[#ec59b6]/40 bg-[#0d0a22]/80 p-4 text-[#ffb8b8] text-xs">
          {error.message}
          {error.stack ? `\n\n${error.stack}` : ''}
        </pre>
        {error.digest && <p className="mb-4 text-[#9aa0c8] text-xs">digest: {error.digest}</p>}
        <button
          type="button"
          onClick={reset}
          className="button-glow inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 py-2 font-extrabold text-sm text-white uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
          }}
        >
          Retry
        </button>
      </div>
    </main>
  )
}
