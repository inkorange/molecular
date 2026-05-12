'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getLibraryEntry } from '@/src/data/molecules'
import { tryReact } from '@/src/lib/applyReaction'
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
    tryReact()
  }

  return (
    <div className="absolute right-4 bottom-20 z-20 flex max-w-[200px] flex-col items-stretch gap-2">
      {/* Plain-English hint so users understand what the toolbar does. */}
      <p className="rounded-md border border-[#5cc6ff]/30 bg-[#0d0a22]/85 px-3 py-2 text-[10px] leading-snug text-[#9aa0c8] backdrop-blur">
        Add reactants, then drag-fling one into another — matching reactions fire on contact. Or tap{' '}
        <span className="font-bold text-[#5cc6ff]">Combine reactants</span> to run them instantly.
      </p>
      <Button
        onClick={() => add('hydrogen-gas')}
        size="sm"
        className="min-h-[40px] border border-[#2a2655] bg-[#14112e] text-[#dffaff] hover:bg-[#1a163a]"
      >
        + Hydrogen (H₂)
      </Button>
      <Button
        onClick={() => add('oxygen-gas')}
        size="sm"
        className="min-h-[40px] border border-[#2a2655] bg-[#14112e] text-[#dffaff] hover:bg-[#1a163a]"
      >
        + Oxygen (O₂)
      </Button>
      <Button
        onClick={react}
        size="sm"
        className="min-h-[40px] bg-[#5cc6ff] font-bold text-[#07051a] hover:bg-[#80d4ff]"
      >
        Combine reactants
      </Button>
      <Sheet open={logOpen} onOpenChange={setLogOpen}>
        <SheetTrigger
          render={
            <Button
              size="sm"
              className="min-h-[40px] border border-[#2a2655] bg-[#14112e] text-[#dffaff] hover:bg-[#1a163a]"
            >
              Reaction log
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
