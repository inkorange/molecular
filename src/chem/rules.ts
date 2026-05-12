import { getElement } from './elements'
import type { Atom, AtomId, Bond, BondOrder, BondType, Element } from './types'

export interface CanBondResult {
  allowed: boolean
  order: BondOrder
  type: BondType
  preference: 'common' | 'unusual'
}

const IONIC_THRESHOLD = 1.7

/**
 * Remaining covalent bonding capacity for an atom in the current scene.
 * Capacity is consumed by the SUM of bond orders for every bond the atom
 * participates in (a double bond counts as 2). Returns 0 for atoms at or
 * above capacity, or with zero capacity (noble gases).
 */
export function freeCapacity(
  atomId: AtomId,
  atoms: Record<string, Atom>,
  bonds: Record<string, Bond>,
): number {
  const atom = atoms[atomId as string]
  if (!atom) return 0
  const cap = getElement(atom.Z).bondingCapacity
  if (cap === 0) return 0
  let used = 0
  for (const b of Object.values(bonds)) {
    if (b.atomA === atomId || b.atomB === atomId) used += b.order
  }
  return Math.max(0, cap - used)
}

export function canBond(a: Element, b: Element): CanBondResult {
  if (a.bondingCapacity === 0 || b.bondingCapacity === 0) {
    return { allowed: false, order: 1, type: 'covalent', preference: 'unusual' }
  }

  const dx = Math.abs(a.electronegativity - b.electronegativity)
  const type: BondType = dx >= IONIC_THRESHOLD ? 'ionic' : 'covalent'

  // canBond is the gate; bond ORDER beyond single is decided later by getBondingSites
  // based on remaining valence on each atom in the actual scene context.
  const preference: 'common' | 'unusual' =
    a.category === 'noble' || b.category === 'noble' ? 'unusual' : 'common'

  return { allowed: true, order: 1, type, preference }
}
