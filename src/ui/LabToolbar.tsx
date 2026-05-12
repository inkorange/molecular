'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getFormula } from '@/src/chem/formula'
import { findReaction } from '@/src/chem/reactions'
import type { Atom } from '@/src/chem/types'
import { getLibraryEntry } from '@/src/data/molecules'
import { applyReaction } from '@/src/lib/applyReaction'
import { spawnLibraryEntry } from '@/src/lib/spawn'
import { useStore } from '@/src/store'
import { ReactionLog } from './ReactionLog'

/**
 * Lab-mode floating toolbar. v1 keeps the interaction model explicit
 * (Add reactant + React!) rather than full physics flinging, so mobile users
 * can demonstrate the chemistry without precision dragging. The fling-style
 * interaction can ship in a follow-up.
 */
export function LabToolbar() {
  const [logOpen, setLogOpen] = useState(false)
  const addAtom = useStore((s) => s.addAtom)
  const addBond = useStore((s) => s.addBond)
  const addMolecule = useStore((s) => s.addMolecule)

  function add(libId: string) {
    const entry = getLibraryEntry(libId)
    if (!entry) return
    const result = spawnLibraryEntry(entry, [
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 1.5,
      0,
    ])
    addMolecule(result.molecule)
    for (const a of result.atoms) addAtom(a)
    for (const b of result.bonds) addBond(b)
  }

  function react() {
    const state = useStore.getState()
    const counts = new Map<string, number>()
    const mIds: string[] = []
    for (const m of Object.values(state.scene.molecules)) {
      const atomsInMol = m.atomIds
        .map((id) => state.scene.atoms[id])
        .filter((a): a is Atom => Boolean(a))
      if (atomsInMol.length === 0) continue
      const formula = getFormula(atomsInMol)
      counts.set(formula, (counts.get(formula) ?? 0) + 1)
      mIds.push(m.id)
    }
    const inputs = Array.from(counts.entries()).map(([formula, count]) => ({ formula, count }))
    const r = findReaction(inputs)
    if (r) applyReaction(r, mIds)
  }

  return (
    <div className="absolute right-4 bottom-20 z-20 flex flex-col gap-2">
      <Button onClick={() => add('hydrogen-gas')} size="sm" className="min-h-[40px]">
        + H₂
      </Button>
      <Button onClick={() => add('oxygen-gas')} size="sm" className="min-h-[40px]">
        + O₂
      </Button>
      <Button
        onClick={react}
        size="sm"
        className="min-h-[40px] bg-[#5cc6ff] text-[#07051a] hover:bg-[#80d4ff]"
      >
        React!
      </Button>
      <Sheet open={logOpen} onOpenChange={setLogOpen}>
        <SheetTrigger
          render={
            <Button size="sm" variant="outline" className="min-h-[40px]">
              Log
            </Button>
          }
        />
        <SheetContent side="right" className="border-[#2a2655] bg-[#0d0a22] text-[#dffaff]">
          <SheetTitle className="px-3 pt-3 text-sm font-bold uppercase tracking-wider text-[#9aa0c8]">
            Reaction Log
          </SheetTitle>
          <ReactionLog />
        </SheetContent>
      </Sheet>
    </div>
  )
}
