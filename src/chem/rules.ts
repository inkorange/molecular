import type { BondOrder, BondType, Element } from './types'

export interface CanBondResult {
  allowed: boolean
  order: BondOrder
  type: BondType
  preference: 'common' | 'unusual'
}

const IONIC_THRESHOLD = 1.7

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
