'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { REACTIONS } from '@/src/chem/reactions'
import { getLibraryEntry } from '@/src/data/molecules'
import { applyReaction, tryReact } from '@/src/lib/applyReaction'
import { getRecipeHints, type RecipeHint } from '@/src/lib/recipeHints'
import { spawnLibraryEntry } from '@/src/lib/spawn'
import { useStore } from '@/src/store'
import { ReactionLog } from './ReactionLog'
import { RecipeHintPanel } from './RecipeHintPanel'

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
  const [hintsOpen, setHintsOpen] = useState(false)
  const addAtom = useStore((s) => s.addAtom)
  const addBond = useStore((s) => s.addBond)
  const addMolecule = useStore((s) => s.addMolecule)
  const resetScene = useStore((s) => s.resetScene)
  const clearReactionLog = useStore((s) => s.clearReactionLog)
  const addPendingReactant = useStore((s) => s.addPendingReactant)
  const clearPendingReactants = useStore((s) => s.clearPendingReactants)
  const dismissHint = useStore((s) => s.dismissHint)
  const clearDismissedHints = useStore((s) => s.clearDismissedHints)
  const dismissedHintIds = useStore((s) => s.lab.dismissedHintIds)

  // Auto-open the Hints sheet once per browser, so first-time visitors
  // immediately discover the affordance. The flag is set after the open
  // call so a hard refresh doesn't keep re-popping the sheet.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const KEY = 'molecular.lab.hintsSeen'
    if (window.localStorage.getItem(KEY) === '1') return
    setHintsOpen(true)
    window.localStorage.setItem(KEY, '1')
  }, [])

  // Recipe hints are a pure derived view over scene + pending pool. The
  // useStore subscriptions trigger re-renders when either changes, and
  // useMemo memoises the ranker output so we don't recompute on unrelated
  // re-renders. Scene snapshot reference equality is enough to invalidate
  // because Zustand immer slices replace nested objects on mutation.
  const scene = useStore((s) => s.scene)
  const pendingReactantIds = useStore((s) => s.lab.pendingReactantIds)
  const hints = useMemo<RecipeHint[]>(() => {
    const all = getRecipeHints({ scene, pendingReactantIds })
    if (dismissedHintIds.length === 0) return all
    const dismissed = new Set(dismissedHintIds)
    return all.filter((h) => !dismissed.has(h.reactionId))
  }, [scene, pendingReactantIds, dismissedHintIds])

  // Reset clears the scene, log, and pending pool, then respawns ONE
  // instance of the last reactant the user added — preserving their recent
  // context. Falls back to water on first visit (before anything's been
  // added). The respawned molecule is NOT marked pending; it's background.
  function resetLab() {
    resetScene()
    clearReactionLog()
    clearPendingReactants()
    clearDismissedHints()
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
    // Note: we deliberately do NOT update lastAddedLibId here. Reset uses
    // that to restore the user's chosen base scene (the molecule they
    // picked from the bottom drawer), not the last reactant they tested.
    addPendingReactant(result.molecule.id)
  }

  function react() {
    tryReact({ pendingOnly: true })
  }

  // Fire a specific hinted reaction. We pass the hint's pre-matched molecule
  // ids directly to applyReaction rather than going through tryReact — this
  // avoids the situation where two recipes might be simultaneously satisfied
  // by the scene and the wrong one fires.
  function combineHint(hint: RecipeHint) {
    const reaction = REACTIONS.find((r) => r.id === hint.reactionId)
    if (!reaction || hint.matchedMoleculeIds.length === 0) return
    applyReaction(reaction, hint.matchedMoleculeIds)
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
      <Sheet open={hintsOpen} onOpenChange={setHintsOpen}>
        <SheetTrigger
          render={
            <Button
              size="sm"
              className="min-h-[40px] border border-[#ffd97a]/50 bg-[#14112e] font-bold text-[#ffd97a] hover:bg-[#1a163a]"
            >
              💡 Hints
              {hints.some((h) => h.status === 'ready') && (
                <span className="ml-1 inline-block h-2 w-2 rounded-full bg-[#a4ff8c]" />
              )}
            </Button>
          }
        />
        <SheetContent side="right" className="border-[#2a2655] bg-[#0d0a22] text-[#dffaff]">
          <SheetTitle className="px-3 pt-3 text-sm font-bold uppercase tracking-wider text-[#9aa0c8]">
            Reaction hints
          </SheetTitle>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <RecipeHintPanel
              hints={hints}
              onCombine={(hint) => {
                combineHint(hint)
                // Leave the sheet open so the user can see the panel update
                // (the just-fired reaction's card will fall off and any new
                // recipes the products enable will appear).
              }}
              onAddReactant={(libId) => add(libId)}
              onDismiss={dismissHint}
            />
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
