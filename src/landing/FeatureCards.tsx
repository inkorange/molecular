'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { type Atom, atomId, type Bond, bondId, moleculeId } from '@/src/chem/types'
import { getLibraryEntry } from '@/src/data/molecules'
import { Molecule } from '@/src/scene/Molecule'
import { Scene } from '@/src/scene/Scene'

function MiniPreview({ libraryId }: { libraryId: string }) {
  // Local atoms/bonds with stable refs per libraryId so we don't churn ids
  // on every render. Bloom off — the mini canvas is small and bloom looks
  // hazy at this scale.
  const data = useMemo(() => {
    const entry = getLibraryEntry(libraryId)
    if (!entry) return null
    const mId = moleculeId()
    const atoms: Atom[] = entry.atoms.map((a) => ({
      id: atomId(),
      Z: a.Z,
      position: a.position,
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: mId,
    }))
    const bonds: Bond[] = entry.bonds.map((b) => {
      const atomA = atoms[b.atomAIndex]
      const atomB = atoms[b.atomBIndex]
      return {
        id: bondId(),
        atomA: atomA ? atomA.id : atoms[0]!.id,
        atomB: atomB ? atomB.id : atoms[0]!.id,
        order: b.order,
        type: b.type ?? 'covalent',
      }
    })
    return { atoms, bonds }
  }, [libraryId])

  if (!data) return null
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-[#0a0719]">
      <Scene enableBloom={false}>
        <Molecule atoms={data.atoms} bonds={data.bonds} />
      </Scene>
    </div>
  )
}

const CARDS = [
  {
    id: 'explore',
    title: 'Explore',
    body: "Browse a curated library of molecules. Spin them in 3D. Ask the tutor what they're for.",
    libraryId: 'ethanol',
    href: '/app?mode=explore',
  },
  {
    id: 'build',
    title: 'Build',
    body: "Drag atoms from the periodic table. Snap bonds. The chemistry engine tells you when you're making sense.",
    libraryId: 'ammonia',
    href: '/app?mode=build',
  },
  {
    id: 'lab',
    title: 'Lab',
    body: 'Combine reactants. Watch matching reactions fire. The reaction log records every transformation.',
    libraryId: 'propane',
    href: '/app?mode=lab',
  },
]

export function FeatureCards() {
  return (
    <section className="px-6 py-16 md:px-12 md:py-24">
      <h2 className="mb-8 font-bold text-2xl text-white md:text-3xl">Three ways to learn</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.id}
            href={c.href}
            className="group flex flex-col rounded-xl border border-[#2a2655] bg-[#0d0a22]/60 p-4 transition-colors hover:border-[#5cc6ff]/40"
          >
            <MiniPreview libraryId={c.libraryId} />
            <h3 className="mt-4 font-bold text-[#dffaff] text-xl">{c.title}</h3>
            <p className="mt-2 text-[#9aa0c8] text-sm">{c.body}</p>
            <span className="mt-3 font-semibold text-[#5cc6ff] text-xs group-hover:underline">
              Open →
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
