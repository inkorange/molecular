import Link from 'next/link'

// Match the gameplay UI's signature pill style — chunky rounded-full,
// extrabold uppercase, glow shadow, micro-interaction on hover/press.
// Same vocabulary as the in-app top toolbar (Clear/Info/Tutor) and the
// bottom Elements/Molecules drawer trigger so the landing feels of-a-piece
// with the app it opens.
const CTA_PRIMARY =
  'button-glow inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 py-2 font-extrabold text-sm text-white uppercase tracking-wider transition-transform hover:scale-105 active:scale-95'

const CTA_SECONDARY =
  'button-glow inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[#5cc6ff]/40 bg-[#0d0a22]/80 px-6 py-2 font-extrabold text-sm text-[#dffaff] uppercase tracking-wider backdrop-blur transition-transform hover:scale-105 hover:border-[#5cc6ff]/70 active:scale-95'

export function HeroCopy() {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col items-start px-6 pt-[33vh] sm:flex-row sm:items-center sm:pt-0 md:px-12">
      <div className="max-w-xl">
        <p
          className="mb-6 font-bold text-[#5cc6ff] text-sm uppercase tracking-[0.3em] md:text-base"
          style={{ textShadow: '0 0 28px rgba(0, 0, 0, 0.95), 0 2px 6px rgba(0, 0, 0, 0.9)' }}
        >
          MOLECULAR
        </p>
        {/* Heavy blurred black text-shadow so the headline stays readable
            against the bright atoms / electron trails in the background reel.
            Tailwind v4 supports text-shadow via arbitrary value. */}
        <h1
          className="font-extrabold text-6xl text-white leading-[1.05] tracking-tight md:text-7xl lg:text-8xl"
          style={{
            textShadow:
              '0 0 56px rgba(0, 0, 0, 1), 0 0 24px rgba(0, 0, 0, 0.95), 0 2px 8px rgba(0, 0, 0, 0.9)',
          }}
        >
          Build the periodic <span className="text-[#5cc6ff]">table in 3D.</span>
        </h1>
        <p
          className="mt-6 text-[#dffaff] text-base md:text-xl"
          style={{ textShadow: '0 0 24px rgba(0, 0, 0, 0.9)' }}
        >
          Drag atoms. Snap bonds. Throw molecules at each other.
        </p>
        <p
          className="mt-1 text-[#dffaff] text-base md:text-xl"
          style={{ textShadow: '0 0 24px rgba(0, 0, 0, 0.9)' }}
        >
          Watch electrons transfer. Ask an AI why anything happened.
        </p>
        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:gap-3">
          <Link
            href="/app"
            className={CTA_PRIMARY}
            style={{
              background: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
            }}
          >
            Open the Lab
            <span className="text-base leading-none">↗</span>
          </Link>
          <Link href="/app?mode=explore" className={CTA_SECONDARY}>
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
