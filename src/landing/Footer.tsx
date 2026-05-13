import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-[#2a2655] border-t px-6 py-8 text-[#6a6f95] text-xs md:px-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <div>© Molecular · Built with Three.js, Next.js, and Vercel AI Gateway.</div>
        {/* About — flashier than a plain link. Uses the same button-glow pill
            vocabulary as the in-app top toolbar so the footer reads as part
            of the same design family. */}
        <Link
          href="/about"
          className="button-glow inline-flex min-h-[40px] items-center gap-2 rounded-full px-5 py-1.5 font-extrabold text-white text-xs uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #5cc6ff 0%, #ec59b6 100%)',
          }}
        >
          About
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>
    </footer>
  )
}
