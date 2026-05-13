import Link from 'next/link'

const BUTTON_BASE =
  'inline-flex min-h-[48px] items-center justify-center rounded-lg px-6 text-base font-bold transition-colors'

export function HeroCopy() {
  return (
    <div className="relative z-10 flex min-h-dvh items-center px-6 md:px-12">
      <div className="max-w-xl">
        <p className="mb-6 font-semibold text-[#5cc6ff] text-xs uppercase tracking-[0.3em]">
          MOLECULAR
        </p>
        <h1 className="font-extrabold text-4xl text-white leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
          Build the periodic <span className="text-[#5cc6ff]">table in 3D.</span>
        </h1>
        <p className="mt-6 text-[#9aa0c8] text-base md:text-lg">
          Drag atoms. Snap bonds. Throw molecules at each other.
        </p>
        <p className="mt-1 text-[#9aa0c8] text-base md:text-lg">
          Watch electrons transfer. Ask an AI why anything happened.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/app"
            className={`${BUTTON_BASE} bg-[#5cc6ff] text-[#07051a] hover:bg-[#7ad6ff]`}
          >
            Open the Lab →
          </Link>
          <Link
            href="/app?mode=explore"
            className={`${BUTTON_BASE} border border-white/25 bg-white/5 text-[#dffaff] hover:bg-white/10`}
          >
            Browse molecules
          </Link>
        </div>
        <p className="mt-12 text-[#6a6f95] text-xs">
          36 elements · 30 curated molecules · 26 reactions · AI tutor included
        </p>
      </div>
    </div>
  )
}
