'use client'

import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { DEMOS } from '@/src/data/demonstrations'

type Level = 'elementary' | 'advanced'

const REACTION_TYPE_LABEL: Record<string, string> = {
  synthesis: 'Synthesis',
  combustion: 'Combustion',
  decomposition: 'Decomposition',
  neutralization: 'Neutralization',
  displacement: 'Displacement',
  fusion: 'Fusion',
  fission: 'Fission',
}

const REACTION_TYPE_COLOR: Record<string, string> = {
  synthesis: '#5cc6ff',
  combustion: '#ff7a8c',
  decomposition: '#c89eff',
  neutralization: '#a4ff8c',
  displacement: '#ffd97a',
  // Nuclear types share their hue family with TransitionFlash for visual
  // continuity: fusion = hot blue plasma, fission = orange detonation.
  fusion: '#5cc6ff',
  fission: '#ff5a3a',
}

/**
 * Demo picker. Shows a grid of curated demonstration cards. The audience
 * level (Elementary / Advanced) is chosen here at picker time — selecting
 * a card navigates to `/demo/[id]?level=<level>`, baking the choice into
 * the URL so teachers can share a level-specific link.
 */
export function DemoPicker() {
  const [level, setLevel] = useState<Level>('elementary')

  // Stable difficulty sort so basic demos appear first by default.
  const sorted = [...DEMOS].sort((a, b) => a.difficulty - b.difficulty)

  return (
    <div className="mx-auto max-w-5xl px-6 pt-6 pb-12 md:px-12 md:pt-12 md:pb-20">
      {/* Top nav — glass-pill links matching the in-app button vocabulary.
          Home uses a translucent dark glass; Open the lab uses the bright
          tri-color gradient to read as the primary action. */}
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
            Demonstrations
          </span>
        </h1>
        <p className="max-w-2xl text-[#9aa0c8] text-base md:text-lg">
          Pick a chemistry demonstration to play with your class. Each demo walks through
          ingredients, the reaction, and the result — step by step, with animation effects tailored
          to the reaction type.
        </p>
      </header>

      {/* Audience level segment — choice rides into the share URL via ?level=. */}
      <div className="mb-8 inline-flex rounded-full border border-[#2a2655] bg-[#0d0a22]/80 p-1">
        {(['elementary', 'advanced'] as const).map((lvl) => (
          <button
            type="button"
            key={lvl}
            onClick={() => setLevel(lvl)}
            className={
              level === lvl
                ? 'rounded-full bg-[#5cc6ff] px-5 py-2 text-[#07051a] text-xs font-extrabold uppercase tracking-wider'
                : 'rounded-full px-5 py-2 text-[#9aa0c8] text-xs font-extrabold uppercase tracking-wider hover:text-[#dffaff]'
            }
          >
            {lvl === 'elementary' ? 'Elementary' : 'Advanced'}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((d) => (
          <Link
            key={d.id}
            href={`/demo/${d.id}?level=${level}`}
            className="group flex flex-col gap-3 rounded-xl border border-[#2a2655] bg-[#0d0a22]/60 p-5 transition-colors hover:border-[#5cc6ff]/40"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  color: REACTION_TYPE_COLOR[d.reactionType],
                  border: `1px solid ${REACTION_TYPE_COLOR[d.reactionType]}50`,
                }}
              >
                {REACTION_TYPE_LABEL[d.reactionType]}
              </span>
              <span className="text-[10px] text-[#6a6f95]">Level {'•'.repeat(d.difficulty)}</span>
            </div>
            <h2 className="font-bold text-[#dffaff] text-xl">{d.title}</h2>
            <p className="flex-1 text-[#9aa0c8] text-sm leading-snug">{d.summary}</p>
            <span className="mt-1 inline-flex items-center gap-1 self-start font-bold text-[#5cc6ff] text-xs uppercase tracking-wider group-hover:underline">
              Play demo
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
