import { getFormula } from '@/src/chem/formula'
import { REACTIONS, type Reaction } from '@/src/chem/reactions'
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
  // Drop the consumed ids from the pending-reactant pool so they don't
  // linger as zombie references.
  store.consumePendingReactants(reactantMoleculeIds)

  // Spread products around the origin so they don't stack on top of each
  // other (or on any leftover scene molecules). One product spawns at the
  // center; two-or-more get evenly distributed on a small ring.
  const totalProducts = reaction.products.reduce((sum, p) => sum + p.count, 0)
  const spreadRadius = totalProducts > 1 ? 2 : 0
  // Start at a random base angle so repeated reactions don't pile in the
  // same spots every time.
  const baseAngle = Math.random() * Math.PI * 2
  let pIdx = 0
  for (const p of reaction.products) {
    for (let i = 0; i < p.count; i++) {
      const entry = libraryByFormula(p.formula) ?? getLibraryEntry('water')
      if (!entry) continue
      const angle = baseAngle + (pIdx / Math.max(1, totalProducts)) * Math.PI * 2
      const px = Math.cos(angle) * spreadRadius
      const py = Math.sin(angle) * spreadRadius * 0.6 // squash Y to keep things near the scene plane
      const result = spawnLibraryEntry(entry, [px, py, 0])
      store.addMolecule(result.molecule)
      for (const a of result.atoms) store.addAtom(a)
      for (const b of result.bonds) store.addBond(b)
      pIdx++
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

interface TryReactOptions {
  /**
   * When true (the default for the Combine button), only molecules in the
   * lab slice's `pendingReactantIds` pool are considered. This prevents
   * background molecules — the initial water, products of earlier
   * reactions — from being looped through reverse reactions indefinitely.
   *
   * When false (collision-driven path), every molecule in the scene is in
   * play: the user has explicitly flung them together, so any chemically
   * valid contact reaction is fair game.
   */
  pendingOnly?: boolean
}

/**
 * Find and run a reaction. Returns the reaction id that fired (used to
 * debounce repeated collision callbacks) or null if no recipe was satisfied.
 *
 * Matching is subset-based: reactants only need to be present, not exclusive.
 */
export function tryReact({ pendingOnly = false }: TryReactOptions = {}): string | null {
  const state = useStore.getState()
  // Eligible-molecule pool: either the user's pending reactants (filtered to
  // those still in the scene) or every molecule in the scene.
  let eligibleIds: string[]
  if (pendingOnly) {
    eligibleIds = state.lab.pendingReactantIds.filter((id) => Boolean(state.scene.molecules[id]))
  } else {
    eligibleIds = Object.keys(state.scene.molecules)
  }
  // Index eligible molecules by formula → list of molecule ids.
  const byFormula = new Map<string, string[]>()
  for (const mid of eligibleIds) {
    const m = state.scene.molecules[mid]
    if (!m) continue
    const atomsInMol = m.atomIds
      .map((id) => state.scene.atoms[id])
      .filter((a): a is AtomData => Boolean(a))
    if (atomsInMol.length === 0) continue
    const formula = getFormula(atomsInMol)
    const list = byFormula.get(formula) ?? []
    list.push(m.id)
    byFormula.set(formula, list)
  }
  // Walk reactions in declaration order; first satisfied recipe wins.
  for (const r of REACTIONS) {
    const needed: string[] = []
    let ok = true
    for (const reactant of r.reactants) {
      const available = byFormula.get(reactant.formula) ?? []
      if (available.length < reactant.count) {
        ok = false
        break
      }
      // Reserve the first N molecules of this formula for the reaction.
      for (let i = 0; i < reactant.count; i++) {
        const id = available[i]
        if (id) needed.push(id)
      }
    }
    if (!ok) continue
    applyReaction(r, needed)
    return r.id
  }
  return null
}
