import { getFormula } from '@/src/chem/formula'
import { findReaction, type Reaction } from '@/src/chem/reactions'
import type { Atom as AtomData } from '@/src/chem/types'
import { getLibraryEntry, LIBRARY } from '@/src/data/molecules'
import { useStore } from '@/src/store'
import { spawnLibraryEntry } from './spawn'

function libraryByFormula(formula: string) {
  return LIBRARY.find((m) => m.formula === formula)
}

/**
 * Apply a matched reaction to the current scene: remove the reactant
 * molecules and spawn the products at staggered offsets so they don't
 * stack at the origin. Append a log entry recording the balanced equation
 * and enthalpy.
 */
export function applyReaction(reaction: Reaction, reactantMoleculeIds: string[]) {
  const store = useStore.getState()
  for (const id of reactantMoleculeIds) store.removeMolecule(id as never)

  let xOffset = 0
  for (const p of reaction.products) {
    for (let i = 0; i < p.count; i++) {
      const entry = libraryByFormula(p.formula) ?? getLibraryEntry('water')
      if (!entry) continue
      const result = spawnLibraryEntry(entry, [xOffset, 0, 0])
      store.addMolecule(result.molecule)
      for (const a of result.atoms) store.addAtom(a)
      for (const b of result.bonds) store.addBond(b)
      xOffset += 1.6
    }
  }

  const eqL = reaction.reactants
    .map((r) => `${r.count > 1 ? `${r.count} ` : ''}${r.formula}`)
    .join(' + ')
  const eqR = reaction.products
    .map((r) => `${r.count > 1 ? `${r.count} ` : ''}${r.formula}`)
    .join(' + ')
  store.logReaction({
    id: reaction.id,
    equation: `${eqL} → ${eqR}`,
    enthalpy: reaction.enthalpy,
  })
}

/**
 * Look at all molecules currently in the scene, tally them by formula, and
 * fire the first matching reaction in the database. Used by both the
 * "Combine reactants" button and the physics-collision auto-react path.
 *
 * Returns the reaction id that fired (for telemetry / debouncing) or null.
 */
export function tryReact(): string | null {
  const state = useStore.getState()
  const counts = new Map<string, number>()
  const mIds: string[] = []
  for (const m of Object.values(state.scene.molecules)) {
    const atomsInMol = m.atomIds
      .map((id) => state.scene.atoms[id])
      .filter((a): a is AtomData => Boolean(a))
    if (atomsInMol.length === 0) continue
    const formula = getFormula(atomsInMol)
    counts.set(formula, (counts.get(formula) ?? 0) + 1)
    mIds.push(m.id)
  }
  const inputs = Array.from(counts.entries()).map(([formula, count]) => ({ formula, count }))
  const r = findReaction(inputs)
  if (!r) return null
  applyReaction(r, mIds)
  return r.id
}
