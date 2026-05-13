import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

const PAGE_TITLE = 'About'
const PAGE_DESCRIPTION =
  'About Molecular — what the app is, who it is for, and the technology behind the 3D chemistry playground.'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: {
    title: `${PAGE_TITLE} · Molecular`,
    description: PAGE_DESCRIPTION,
    url: '/about',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PAGE_TITLE} · Molecular`,
    description: PAGE_DESCRIPTION,
  },
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-6 pb-16 md:px-12 md:pt-12 md:pb-24">
      {/* Top nav — glass-pill links matching the in-app button vocabulary,
          mirroring the DemoPicker pattern. */}
      <nav className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="button-glow inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#5cc6ff]/40 bg-[#0d0a22]/80 px-5 py-1.5 font-extrabold text-[#dffaff] text-xs uppercase tracking-wider backdrop-blur transition-transform hover:scale-105 hover:border-[#5cc6ff]/70 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Home
        </Link>
        <Link
          href="/app"
          className="button-glow inline-flex min-h-[40px] items-center gap-2 rounded-full px-5 py-1.5 font-extrabold text-white text-xs uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
          }}
        >
          Open the lab
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </nav>

      <header className="mb-10">
        <h1 className="mb-3 font-extrabold text-4xl text-white leading-[1.05] tracking-tight md:text-6xl">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
            }}
          >
            About Molecular
          </span>
        </h1>
        <p className="max-w-2xl text-[#9aa0c8] text-base md:text-lg">
          A 3D chemistry playground for the browser. Free, hands-on, and built for the curious.
        </p>
      </header>

      <section className="space-y-6 text-[#dffaff] text-base leading-relaxed md:text-lg">
        <p>
          Molecular is an interactive way to learn chemistry by doing it. Drag atoms together, snap
          bonds, run reactions, and watch what happens — in a real 3D scene that responds to your
          taps and drags. No installs, no logins, no ads.
        </p>

        <h2 className="pt-6 font-bold text-2xl text-[#dffaff] md:text-3xl">What you can do</h2>
        <ul className="list-disc space-y-2 pl-6 text-[#9aa0c8] md:text-lg">
          <li>
            <span className="font-semibold text-[#dffaff]">Explore</span> a curated library of
            molecules — water, hydrocarbons, acids, sugars, salts — and rotate them in 3D.
          </li>
          <li>
            <span className="font-semibold text-[#dffaff]">Build</span> atoms and bond them together
            with drag-and-snap interactions that respect real bonding rules.
          </li>
          <li>
            <span className="font-semibold text-[#dffaff]">React</span> in the lab — combine your
            reactants, watch animated transformations, and see the energy released.
          </li>
          <li>
            <span className="font-semibold text-[#dffaff]">Run teacher-led demos</span> with step-
            by-step narration tuned for elementary or advanced audiences.
          </li>
          <li>
            <span className="font-semibold text-[#dffaff]">Ask the AI tutor</span> anything about
            what you just made or what just happened.
          </li>
        </ul>

        <h2 className="pt-6 font-bold text-2xl text-[#dffaff] md:text-3xl">Who it&apos;s for</h2>
        <p>
          Students from late elementary through high school who learn better by doing. Teachers
          looking for a 3D demonstration that runs on a phone, tablet, or smartboard. Anyone who
          ever wondered what a benzene ring actually looks like.
        </p>

        <h2 className="pt-6 font-bold text-2xl text-[#dffaff] md:text-3xl">How it works</h2>
        <p>
          The 3D scene runs on Three.js and react-three-fiber. The chemistry engine is pure
          TypeScript — a small periodic-table dataset, VSEPR geometry, and a curated reactions
          table. Scenes auto-save to your browser and can be shared via short URLs.
        </p>
        <p>
          The tutor streams responses from the Vercel AI Gateway, with the current scene serialized
          into every prompt so the answers stay grounded in what you can actually see.
        </p>

        <h2 className="pt-6 font-bold text-2xl text-[#dffaff] md:text-3xl">Get started</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/app"
            className="button-glow inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 py-2 font-extrabold text-sm text-white uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
            }}
          >
            Open the lab
            <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} />
          </Link>
          <Link
            href="/demo"
            className="button-glow inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[#5cc6ff]/40 bg-[#0d0a22]/80 px-6 py-2 font-extrabold text-sm text-[#dffaff] uppercase tracking-wider backdrop-blur transition-transform hover:scale-105 hover:border-[#5cc6ff]/70 active:scale-95"
          >
            Try a demo
          </Link>
        </div>
      </section>
    </div>
  )
}
