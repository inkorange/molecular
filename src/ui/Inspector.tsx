'use client'

import { useMemo } from 'react'
import { getFormula } from '@/src/chem/formula'
import type { Atom, Bond, Molecule, SceneSnapshot } from '@/src/chem/types'
import { LIBRARY } from '@/src/data/molecules'
import { NAMED_MOLECULES } from '@/src/data/named-molecules'
import { useStore } from '@/src/store'

interface MoleculeSummary {
  id: string
  formula: string
  name: string
  atomCount: number
  bondCount: number
  totalElectrons: number
  uses?: string
  description?: string
}

function summarize(molecule: Molecule, scene: SceneSnapshot): MoleculeSummary | null {
  const atoms = molecule.atomIds.map((id) => scene.atoms[id]).filter((a): a is Atom => Boolean(a))
  if (atoms.length === 0) return null
  const bonds = molecule.bondIds.map((id) => scene.bonds[id]).filter((b): b is Bond => Boolean(b))
  const formula = getFormula(atoms)
  const entry = LIBRARY.find((m) => m.formula === formula)
  const totalElectrons = atoms.reduce((sum, a) => sum + a.Z, 0)
  return {
    id: molecule.id,
    formula,
    name: NAMED_MOLECULES[formula] ?? entry?.name ?? '—',
    atomCount: atoms.length,
    bondCount: bonds.length,
    totalElectrons,
    uses: entry?.uses,
    description: entry?.description,
  }
}

export function Inspector() {
  const scene = useStore((s) => s.scene)

  const summaries = useMemo<MoleculeSummary[]>(() => {
    const out: MoleculeSummary[] = []
    for (const m of Object.values(scene.molecules)) {
      const s = summarize(m, scene)
      if (s) out.push(s)
    }
    return out
  }, [scene])

  if (summaries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[#6a6f95]">
        Pick a molecule from the Library to see its details.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 text-[#dffaff]">
      {summaries.length > 1 && (
        <div className="text-xs uppercase tracking-wider text-[#8d92b8]">
          {summaries.length} molecules in scene
        </div>
      )}
      {summaries.map((s, idx) => (
        <article
          key={s.id}
          className={
            summaries.length > 1
              ? 'rounded-md border border-[#2a2655] bg-[#14112e] p-3'
              : 'flex flex-col gap-3'
          }
        >
          <header>
            <h2 className="text-xl font-bold">
              {summaries.length > 1 && (
                <span className="mr-2 text-xs font-mono text-[#6a6f95]">#{idx + 1}</span>
              )}
              {s.name}
            </h2>
            <p className="mt-1 font-mono text-sm text-[#9aa0c8]">{s.formula}</p>
          </header>
          {s.description && (
            <p className="mt-2 text-sm leading-relaxed text-[#9aa0c8]">{s.description}</p>
          )}
          {s.uses && (
            <section className="mt-2">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#8d92b8]">
                Common uses
              </h3>
              <p className="text-sm text-[#dffaff]">{s.uses}</p>
            </section>
          )}
          <section className="mt-2 flex gap-4 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#8d92b8]">Atoms</div>
              <div className="font-mono text-lg">{s.atomCount}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-[#8d92b8]">Bonds</div>
              <div className="font-mono text-lg">{s.bondCount}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-[#8d92b8]">Electrons</div>
              <div className="font-mono text-lg">{s.totalElectrons}</div>
            </div>
          </section>
        </article>
      ))}
    </div>
  )
}
