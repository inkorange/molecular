'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { CATEGORY_LABEL, LIBRARY, LIBRARY_CATEGORIES } from '@/src/data/molecules'
import { formatFormula } from '@/src/lib/formatFormula'
import { spawnLibraryEntry } from '@/src/lib/spawn'
import { useStore } from '@/src/store'

export function LibraryBrowser({ onPick }: { onPick?: () => void }) {
  const [query, setQuery] = useState('')
  const addAtom = useStore((s) => s.addAtom)
  const addBond = useStore((s) => s.addBond)
  const addMolecule = useStore((s) => s.addMolecule)
  const resetScene = useStore((s) => s.resetScene)
  const setLastAddedLibId = useStore((s) => s.setLastAddedLibId)
  // Lab-slice clears. Picking a new base molecule is conceptually a
  // fresh start, so any reactant pool / dismissed hints / in-flight
  // animation from the previous base needs to go too. Without this,
  // hint cards still showed the previous reactant as "added" because
  // their reactant pool persisted across the scene reset.
  const clearPendingReactants = useStore((s) => s.clearPendingReactants)
  const clearDismissedHints = useStore((s) => s.clearDismissedHints)
  const clearReactionAnimation = useStore((s) => s.clearReactionAnimation)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return LIBRARY
    return LIBRARY.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.formula.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q),
    )
  }, [query])

  const groups = useMemo(() => {
    const map = new Map<string, typeof LIBRARY>()
    for (const m of filtered) {
      const arr = map.get(m.category) ?? []
      arr.push(m)
      map.set(m.category, arr)
    }
    return LIBRARY_CATEGORIES.filter((c) => map.has(c)).map((c) => ({
      category: c,
      entries: map.get(c) ?? [],
    }))
  }, [filtered])

  function pick(id: string) {
    const entry = LIBRARY.find((m) => m.id === id)
    if (!entry) return
    // Full reset: scene atoms/bonds/molecules AND the lab slice's
    // user-state (pending reactants, dismissed hints, in-flight
    // animation). Hint cards derive their "+ Add X" vs "✓ added" rows
    // from the scene plus this lab state — without clearing the lab
    // state, the user would switch base molecules and still see leftover
    // chips marked as added.
    resetScene()
    clearPendingReactants()
    clearDismissedHints()
    clearReactionAnimation()
    const result = spawnLibraryEntry(entry)
    addMolecule(result.molecule)
    for (const a of result.atoms) addAtom(a)
    for (const b of result.bonds) addBond(b)
    // Remember this pick so Lab Reset returns here. Lab toolbar reactant
    // adds do NOT update this — Reset's job is to restore the user's
    // chosen base scene, not the most recent reactant they were testing.
    setLastAddedLibId(id)
    onPick?.()
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <Input
        type="search"
        placeholder="Search molecules…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border-[#2a2655] bg-[#14112e] text-[#dffaff] placeholder:text-[#6a6f95]"
      />
      {/* Plain overflow-y-auto + min-h-0 reliably scrolls inside a flex column;
          Radix ScrollArea was swallowing flex-1 height inside the drawer. */}
      <div
        className="-mr-3 min-h-0 flex-1 overflow-y-auto pr-3"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex flex-col gap-3 pb-6">
          {groups.map(({ category, entries }) => (
            <section key={category}>
              <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8d92b8]">
                {CATEGORY_LABEL[category]}
              </h3>
              <ul className="flex flex-col gap-1">
                {entries.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => pick(m.id)}
                      className="flex min-h-[44px] w-full items-baseline justify-between rounded-md border border-transparent bg-[#14112e] px-3 py-2 text-left text-sm text-[#dffaff] transition-colors hover:border-[#5cc6ff]/40 hover:bg-[#1a163a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5cc6ff]"
                    >
                      <span className="font-medium">{m.name}</span>
                      <span className="font-mono text-xs text-[#9aa0c8]">
                        {formatFormula(m.formula)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
