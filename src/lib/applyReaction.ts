import type { Reaction } from '@/src/chem/reactions'
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
