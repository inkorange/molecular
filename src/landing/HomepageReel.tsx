'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { type Atom, atomId, type Bond, bondId, moleculeId } from '@/src/chem/types'
import { Molecule } from '@/src/scene/Molecule'
import { Scene } from '@/src/scene/Scene'
import { getReelMolecule, REEL } from './reelData'

interface SceneData {
  atoms: Atom[]
  bonds: Bond[]
  name: string
  formula: string
}

function buildSceneFor(libraryId: string): SceneData {
  const entry = getReelMolecule(libraryId)
  if (!entry) return { atoms: [], bonds: [], name: '', formula: '' }
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
  return { atoms, bonds, name: entry.name, formula: entry.formula }
}

/**
 * Autonomous reel for the landing page. Cycles through the REEL list,
 * rebuilding a fresh local scene per step (avoids touching the global store
 * so `/app` isn't affected if a visitor opens both tabs).
 */
export function HomepageReel() {
  const [stepIndex, setStepIndex] = useState(0)
  const step = REEL[stepIndex] ?? REEL[0]!
  // Recompute the local scene whenever the library id changes. Atom + bond
  // ids are fresh per step — that's intentional so React keys flip and the
  // Atom components mount fresh (re-running the spawn-in animations).
  const scene = useMemo(() => buildSceneFor(step.libraryId), [step.libraryId])

  // biome-ignore lint/correctness/useExhaustiveDependencies: stepIndex re-runs the timer per step
  useEffect(() => {
    const t = setTimeout(() => setStepIndex((i) => (i + 1) % REEL.length), step.durationMs)
    return () => clearTimeout(t)
  }, [stepIndex, step.durationMs])

  return (
    <div className="absolute inset-0 -z-0">
      <Scene>
        {/* Offset the molecule rightward so the hero copy on the left has
            unobstructed visual space. */}
        <group position={[1.5, 0, 0]}>
          <Molecule atoms={scene.atoms} bonds={scene.bonds} />
        </group>
      </Scene>
      <Link
        href={`/app?molecule=${step.libraryId}`}
        aria-label={`Open ${scene.name} in the app`}
        className="absolute top-[55%] right-[10%] -translate-y-1/2 rounded-md bg-[#0d0a22]/40 px-3 py-1 text-xs text-[#dffaff]/80 backdrop-blur transition-colors hover:text-[#dffaff]"
      >
        {scene.name} · {scene.formula} ↗
      </Link>
    </div>
  )
}
