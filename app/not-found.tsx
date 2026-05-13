import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Not found',
  description: 'The page you tried to open does not exist.',
  // 404s are not content — keep them out of search results so users
  // don't land on this page from Google.
  robots: { index: false, follow: false },
}

/**
 * Branded 404 page. Routes that don't resolve land here instead of the
 * Next.js default. Matches the design language of the rest of the site —
 * gradient headline, glass-pill nav, dark space background.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center px-6 py-16 md:px-12">
      <div className="mx-auto max-w-2xl text-center">
        <p
          className="mb-4 font-bold text-[#5cc6ff] text-xs uppercase tracking-[0.3em] md:text-sm"
          style={{ textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)' }}
        >
          404
        </p>
        <h1 className="mb-4 font-extrabold text-5xl text-white leading-[1.05] tracking-tight md:text-7xl">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
            }}
          >
            Page not found
          </span>
        </h1>
        <p className="mb-10 text-[#9aa0c8] text-base md:text-lg">
          The URL you opened doesn&apos;t resolve to anything we know about. Maybe a typo, or a
          shared link that has since changed.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="button-glow inline-flex min-h-[48px] items-center gap-2 rounded-full border border-[#5cc6ff]/40 bg-[#0d0a22]/80 px-6 py-2 font-extrabold text-[#dffaff] text-sm uppercase tracking-wider backdrop-blur transition-transform hover:scale-105 hover:border-[#5cc6ff]/70 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
            Home
          </Link>
          <Link
            href="/app"
            className="button-glow inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 py-2 font-extrabold text-sm text-white uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
            }}
          >
            Open the lab
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </main>
  )
}
