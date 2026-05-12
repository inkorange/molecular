'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getLibraryEntry } from '@/src/data/molecules'
import { tryReact } from '@/src/lib/applyReaction'
import { spawnLibraryEntry } from '@/src/lib/spawn'
import { useStore } from '@/src/store'
import { ReactionLog } from './ReactionLog'

// Curated reactant palette. Library IDs that appear as reactants in
// src/chem/reactions.ts and have decent visual / interaction value in Lab.
// H₂ and O₂ stay as quick-access buttons; everything else lives behind the
// "More reactants…" sheet to keep the toolbar compact.
const MORE_REACTANTS: { id: string; label: string }[] = [
  { id: 'nitrogen-gas', label: 'Nitrogen (N₂)' },
  { id: 'methane', label: 'Methane (CH₄)' },
  { id: 'ethane', label: 'Ethane (C₂H₆)' },
  { id: 'propane', label: 'Propane (C₃H₈)' },
  { id: 'ethanol', label: 'Ethanol (C₂H₆O)' },
  { id: 'hydrochloric-acid', label: 'HCl (acid)' },
  { id: 'sodium-hydroxide', label: 'NaOH (base)' },
  { id: 'ammonia', label: 'Ammonia (NH₃)' },
  { id: 'water', label: 'Water (H₂O)' },
]

/**
 * Lab-mode floating toolbar. v1 keeps the interaction model explicit
 * (Add reactant + React!) rather than full physics flinging, so mobile users
 * can demonstrate the chemistry without precision dragging. The fling-style
 * interaction can ship in a follow-up.
 */
export function LabToolbar() {
  const [logOpen, setLogOpen] = useState(false)
  const [reactantsOpen, setReactantsOpen] = useState(false)
  const addAtom = useStore((s) => s.addAtom)
  const addBond = useStore((s) => s.addBond)
  const addMolecule = useStore((s) => s.addMolecule)
  const resetScene = useStore((s) => s.resetScene)
  const clearReactionLog = useStore((s) => s.clearReactionLog)
  const addPendingReactant = useStore((s) => s.addPendingReactant)
  const clearPendingReactants = useStore((s) => s.clearPendingReactants)
  const setLastAddedLibId = useStore((s) => s.setLastAddedLibId)

  // Reset clears the scene, log, and pending pool, then respawns ONE
  // instance of the last reactant the user added — preserving their recent
  // context. Falls back to water on first visit (before anything's been
  // added). The respawned molecule is NOT marked pending; it's background.
  function resetLab() {
    resetScene()
    clearReactionLog()
    clearPendingReactants()
    const lastId = useStore.getState().lab.lastAddedLibId
    const entry = (lastId && getLibraryEntry(lastId)) || getLibraryEntry('water')
    if (!entry) return
    const result = spawnLibraryEntry(entry)
    addMolecule(result.molecule)
    for (const a of result.atoms) addAtom(a)
    for (const b of result.bonds) addBond(b)
  }

  function add(libId: string) {
    const entry = getLibraryEntry(libId)
    if (!entry) return
    // Spawn at a fixed radius from origin in a random direction so reactants
    // don't immediately collide with whatever's already at origin (typically
    // the initial water). Without this, the first collision response throws
    // bodies far across the scene before damping can settle them.
    const angle = Math.random() * Math.PI * 2
    const radius = 3
    const result = spawnLibraryEntry(entry, [
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.6, // squash Y a bit so molecules stay near scene plane
      0,
    ])
    addMolecule(result.molecule)
    for (const a of result.atoms) addAtom(a)
    for (const b of result.bonds) addBond(b)
    // Mark this molecule as a user-added reactant. The Combine button only
    // runs reactions whose recipes are satisfied by this pool — so once the
    // user's reactants have been consumed, repeated Combine clicks no-op.
    addPendingReactant(result.molecule.id)
    // Remember which library entry this was so Reset can return here later.
    setLastAddedLibId(libId)
  }

  function react() {
    tryReact({ pendingOnly: true })
  }

  return (
    <div className="absolute right-4 bottom-20 z-20 flex max-w-[200px] flex-col items-stretch gap-2">
      {/* Plain-English hint so users understand what the toolbar does. */}
      <p className="rounded-md border border-[#5cc6ff]/30 bg-[#0d0a22]/85 px-3 py-2 text-[10px] leading-snug text-[#9aa0c8] backdrop-blur">
        Add reactants, then tap <span className="font-bold text-[#5cc6ff]">Combine reactants</span>{' '}
        to run any matching reaction.
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
      <Sheet open={reactantsOpen} onOpenChange={setReactantsOpen}>
        <SheetTrigger
          render={
            <Button
              size="sm"
              className="min-h-[40px] border border-[#2a2655] bg-[#14112e] text-[#9aa0c8] hover:bg-[#1a163a] hover:text-[#dffaff]"
            >
              + More reactants…
            </Button>
          }
        />
        <SheetContent side="right" className="border-[#2a2655] bg-[#0d0a22] text-[#dffaff]">
          <SheetTitle className="px-3 pt-3 text-sm font-bold uppercase tracking-wider text-[#9aa0c8]">
            Add reactant
          </SheetTitle>
          <div className="flex flex-col gap-1 p-3">
            {MORE_REACTANTS.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => {
                  add(r.id)
                  setReactantsOpen(false)
                }}
                className="min-h-[44px] rounded-md border border-[#2a2655] bg-[#14112e] px-3 py-2 text-left text-sm text-[#dffaff] transition-colors hover:border-[#5cc6ff]/40 hover:bg-[#1a163a]"
              >
                + {r.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
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
      <Button
        onClick={resetLab}
        size="sm"
        className="min-h-[40px] border border-[#ff7a7a]/40 bg-transparent text-[#ff7a7a] hover:bg-[#5a1f1f]/30"
      >
        Reset scene
      </Button>
    </div>
  )
}
