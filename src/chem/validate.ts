import { NAMED_MOLECULES } from '../data/named-molecules'
import { getElement } from './elements'
import { getFormula } from './formula'
import type { SceneSnapshot } from './types'

export type ValidityStatus = 'empty' | 'valid-named' | 'valid-unnamed' | 'valid-unusual' | 'invalid'

export interface ValidationResult {
  status: ValidityStatus
  formula: string
  name?: string
  reason?: string
}

export function validateScene(scene: SceneSnapshot): ValidationResult {
  const atoms = Object.values(scene.atoms)
  if (atoms.length === 0) return { status: 'empty', formula: '' }

  const formula = getFormula(atoms)

  // Count bond order used by each atom.
  const usedByAtom = new Map<string, number>()
  for (const b of Object.values(scene.bonds)) {
    usedByAtom.set(b.atomA, (usedByAtom.get(b.atomA) ?? 0) + b.order)
    usedByAtom.set(b.atomB, (usedByAtom.get(b.atomB) ?? 0) + b.order)
  }

  let hasUnusual = false
  for (const a of atoms) {
    const el = getElement(a.Z)
    const used = usedByAtom.get(a.id) ?? 0
    if (used > el.bondingCapacity) {
      return {
        status: 'invalid',
        formula,
        reason: `${el.symbol} has ${used} bonds but allows ${el.bondingCapacity}`,
      }
    }
    // Free radical: a non-noble nonmetal with unfilled capacity in a multi-atom scene.
    if (
      el.category !== 'noble' &&
      el.bondingCapacity > 0 &&
      used < el.bondingCapacity &&
      atoms.length > 1
    ) {
      hasUnusual = true
    }
  }

  const name = NAMED_MOLECULES[formula]
  if (name) return { status: 'valid-named', formula, name }
  if (hasUnusual) {
    return { status: 'valid-unusual', formula, reason: 'unfilled valence on some atoms' }
  }
  return { status: 'valid-unnamed', formula }
}
