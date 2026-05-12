'use client'

import { useMemo } from 'react'
import { getFormula } from '@/src/chem/formula'
import { validateScene } from '@/src/chem/validate'
import { LIBRARY } from '@/src/data/molecules'
import { useStore } from '@/src/store'

export function Inspector() {
  const scene = useStore((s) => s.scene)

  const summary = useMemo(() => {
    const atoms = Object.values(scene.atoms)
    if (atoms.length === 0) return null
    const formula = getFormula(atoms)
    const result = validateScene(scene)
    const entry = LIBRARY.find((m) => m.formula === formula)
    const totalElectrons = atoms.reduce((sum, a) => sum + a.Z, 0)
    return {
      formula,
      name: result.name ?? entry?.name ?? '—',
      atomCount: atoms.length,
      bondCount: Object.keys(scene.bonds).length,
      totalElectrons,
      uses: entry?.uses,
      description: entry?.description,
    }
  }, [scene])

  if (!summary) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[#6a6f95]">
        Pick a molecule from the Library to see its details.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 text-[#dffaff]">
      <header>
        <h2 className="text-xl font-bold">{summary.name}</h2>
        <p className="mt-1 font-mono text-sm text-[#9aa0c8]">{summary.formula}</p>
      </header>
      {summary.description && (
        <p className="text-sm leading-relaxed text-[#9aa0c8]">{summary.description}</p>
      )}
      {summary.uses && (
        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#8d92b8]">
            Common uses
          </h3>
          <p className="text-sm text-[#dffaff]">{summary.uses}</p>
        </section>
      )}
      <section className="flex gap-4 text-sm">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#8d92b8]">Atoms</div>
          <div className="font-mono text-lg">{summary.atomCount}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-[#8d92b8]">Bonds</div>
          <div className="font-mono text-lg">{summary.bondCount}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-[#8d92b8]">Electrons</div>
          <div className="font-mono text-lg">{summary.totalElectrons}</div>
        </div>
      </section>
    </div>
  )
}
