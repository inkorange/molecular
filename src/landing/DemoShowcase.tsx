'use client'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { DEMOS } from '@/src/data/demonstrations'

/**
 * Featured demos for the homepage promo. Picked to span reaction types so
 * the row reads with visual variety: synthesis (blue), combustion
 * (pink/red), decomposition (purple), neutralization (green).
 */
const FEATURED_IDS = ['water-synthesis', 'methane-combustion', 'water-electrolysis', 'hcl-naoh']

const REACTION_TYPE_LABEL: Record<string, string> = {
  synthesis: 'Synthesis',
  combustion: 'Combustion',
  decomposition: 'Decomposition',
  neutralization: 'Neutralization',
  displacement: 'Displacement',
  fusion: 'Fusion',
  fission: 'Fission',
  decay: 'Decay',
}

const REACTION_TYPE_COLOR: Record<string, string> = {
  synthesis: '#5cc6ff',
  combustion: '#ff7a8c',
  decomposition: '#c89eff',
  neutralization: '#a4ff8c',
  displacement: '#ffd97a',
  fusion: '#5cc6ff',
  fission: '#ff5a3a',
  decay: '#a4ff8c',
}

const CTA_STYLES =
  'button-glow inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-8 py-3 font-extrabold text-base text-white uppercase tracking-wider transition-transform hover:scale-105 active:scale-95'

/**
 * Homepage promo section for the /demo surface. Larger than the
 * FeatureCards row above — more breathing room, bigger heading, a soft
 * cyan glow behind the content, four reaction-type-coded preview cards,
 * and a chunky CTA pill that drops the visitor into the picker.
 */
export function DemoShowcase() {
  const featured = FEATURED_IDS.map((id) => DEMOS.find((d) => d.id === id)).filter(
    (d): d is NonNullable<typeof d> => Boolean(d),
  )

  return (
    <section className="relative px-6 py-20 md:px-12 md:py-32">
      {/* Soft radial cyan glow centered on the section — visually distinct
          from FeatureCards (flat background) so this block reads as a
          headline feature, not another row of cards. */}
      <div
        className="-z-10 absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse at 50% 35%, rgba(92, 198, 255, 0.12) 0%, transparent 65%)',
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-4 font-bold text-[#5cc6ff] text-xs uppercase tracking-[0.3em] md:text-sm">
            ★ For teachers
          </p>
          <h2 className="mb-5 font-extrabold text-4xl uppercase tracking-tight md:text-6xl lg:text-7xl">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
              }}
            >
              Demos for the classroom
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-[#9aa0c8] text-base md:text-xl">
            Run curated chemistry demonstrations in front of your class. Each demo walks through the
            ingredients, the reaction, and the result — with animations and effects tailored to the
            reaction type. Audience-level copy switches between Elementary and Advanced.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((d) => {
            const color = REACTION_TYPE_COLOR[d.reactionType] ?? '#5cc6ff'
            return (
              <Link
                key={d.id}
                href={`/demo/${d.id}?level=elementary`}
                className="group flex flex-col gap-3 rounded-xl border border-[#2a2655] bg-[#0d0a22]/70 p-5 transition-all hover:border-[#5cc6ff]/50 hover:bg-[#14112e]/80"
                style={{
                  boxShadow: `0 0 24px ${color}15`,
                }}
              >
                <span
                  className="self-start rounded-full px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-wider"
                  style={{
                    color,
                    border: `1px solid ${color}50`,
                    background: `${color}10`,
                  }}
                >
                  {REACTION_TYPE_LABEL[d.reactionType]}
                </span>
                <h3 className="font-bold text-[#dffaff] text-lg leading-tight">{d.title}</h3>
                <p className="flex-1 text-[#9aa0c8] text-sm leading-snug">{d.summary}</p>
                <span
                  className="mt-1 inline-flex items-center gap-1 self-start font-bold text-xs uppercase tracking-wider group-hover:underline"
                  style={{ color }}
                >
                  Play
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
                </span>
              </Link>
            )
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/demo"
            className={CTA_STYLES}
            style={{
              background: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
            }}
          >
            View all demonstrations
            <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </section>
  )
}
