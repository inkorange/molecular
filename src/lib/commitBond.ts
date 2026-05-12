import type { Atom, Bond, Vec3 } from '@/src/chem/types'
import { atomId as makeAtomId, bondId as makeBondId } from '@/src/chem/types'

export interface CommitBondActions {
  addAtom: (atom: Atom) => void
  addBond: (bond: Bond) => void
  clearHeld: () => void
}

/**
 * Pure-ish helper: given a host atom, the Z of the held element, and the world
 * position of the chosen bonding site, create the new atom + bond on the store
 * and clear the held state. Returns the ids of the newly-created atom and bond.
 *
 * Centralizes the "what does it mean to commit a bond" logic so it can be
 * reused outside `<AttachPoints>` (e.g. snap-on-drop, future drag-and-drop).
 */
export function commitBond(
  host: Atom,
  heldZ: number,
  sitePosition: Vec3,
  actions: CommitBondActions,
) {
  const newAtomId = makeAtomId()
  const newBondId = makeBondId()
  actions.addAtom({
    id: newAtomId,
    Z: heldZ,
    position: sitePosition,
    velocity: [0, 0, 0],
    charge: 0,
    moleculeId: host.moleculeId,
  })
  actions.addBond({
    id: newBondId,
    atomA: host.id,
    atomB: newAtomId,
    order: 1,
    type: 'covalent',
  })
  actions.clearHeld()
  return { atomId: newAtomId, bondId: newBondId }
}
