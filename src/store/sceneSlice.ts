import { type Draft, produce } from 'immer'
import type { StateCreator } from 'zustand'
import { freeCapacity } from '@/src/chem/rules'
import {
  type Atom,
  type AtomId,
  type Bond,
  type BondId,
  bondId,
  type Molecule,
  type MoleculeId,
  type SceneSnapshot,
  type Vec3,
} from '@/src/chem/types'

export type Mode = 'explore' | 'build' | 'lab'
export type Tier = 'beginner' | 'standard' | 'advanced'

export interface SceneSliceState {
  scene: SceneSnapshot & {
    mode: Mode
    tier: Tier
    selection: AtomId | MoleculeId | null
  }
}

export interface SceneSliceActions {
  addAtom: (atom: Atom) => void
  removeAtom: (id: AtomId) => void
  /** Update an existing atom's position. Used by drag-to-reposition. */
  moveAtom: (id: AtomId, position: Vec3) => void
  addBond: (bond: Bond) => void
  removeBond: (id: BondId) => void
  addMolecule: (molecule: Molecule) => void
  removeMolecule: (id: MoleculeId) => void
  /** Create a covalent single bond between two existing atoms. Merges
   *  molecules if the atoms belong to different ones. No-op if a bond
   *  between these atoms already exists. */
  connectAtoms: (atomAId: AtomId, atomBId: AtomId) => void
  setMode: (mode: Mode) => void
  setTier: (tier: Tier) => void
  setSelection: (id: AtomId | MoleculeId | null) => void
  resetScene: () => void
}

export type SceneSlice = SceneSliceState & SceneSliceActions

const initial: SceneSliceState['scene'] = {
  atoms: {},
  bonds: {},
  molecules: {},
  mode: 'explore',
  tier: 'beginner',
  selection: null,
}

export const createSceneSlice: StateCreator<SceneSlice> = (set) => ({
  scene: initial,

  addAtom: (atom) =>
    set(
      produce<SceneSlice>((s) => {
        s.scene.atoms[atom.id] = atom as Draft<Atom>
        const mol = s.scene.molecules[atom.moleculeId]
        if (mol) {
          if (!mol.atomIds.includes(atom.id)) mol.atomIds.push(atom.id)
        } else {
          s.scene.molecules[atom.moleculeId] = {
            id: atom.moleculeId,
            atomIds: [atom.id],
            bondIds: [],
          }
        }
      }),
    ),

  removeAtom: (id) =>
    set(
      produce<SceneSlice>((s) => {
        const atom = s.scene.atoms[id]
        if (!atom) return
        delete s.scene.atoms[id]
        const mol = s.scene.molecules[atom.moleculeId]
        if (mol) {
          mol.atomIds = mol.atomIds.filter((aid) => aid !== id)
          if (mol.atomIds.length === 0) delete s.scene.molecules[atom.moleculeId]
        }
        for (const bid of Object.keys(s.scene.bonds)) {
          const b = s.scene.bonds[bid]
          if (!b) continue
          if (b.atomA === id || b.atomB === id) {
            delete s.scene.bonds[bid]
            if (mol) mol.bondIds = mol.bondIds.filter((x) => x !== bid)
          }
        }
      }),
    ),

  moveAtom: (id, position) =>
    set(
      produce<SceneSlice>((s) => {
        const atom = s.scene.atoms[id]
        if (!atom) return
        atom.position = position as Draft<Vec3>
      }),
    ),

  addBond: (bond) =>
    set(
      produce<SceneSlice>((s) => {
        s.scene.bonds[bond.id] = bond
        const atom = s.scene.atoms[bond.atomA]
        if (atom) {
          const mol = s.scene.molecules[atom.moleculeId]
          if (mol && !mol.bondIds.includes(bond.id)) mol.bondIds.push(bond.id)
        }
      }),
    ),

  removeBond: (id) =>
    set(
      produce<SceneSlice>((s) => {
        const b = s.scene.bonds[id]
        if (!b) return
        delete s.scene.bonds[id]
        const atom = s.scene.atoms[b.atomA]
        if (atom) {
          const mol = s.scene.molecules[atom.moleculeId]
          if (mol) mol.bondIds = mol.bondIds.filter((x) => x !== id)
        }
      }),
    ),

  addMolecule: (m) =>
    set(
      produce<SceneSlice>((s) => {
        s.scene.molecules[m.id] = m
      }),
    ),

  removeMolecule: (id) =>
    set(
      produce<SceneSlice>((s) => {
        const m = s.scene.molecules[id]
        if (!m) return
        for (const aid of m.atomIds) delete s.scene.atoms[aid]
        for (const bid of m.bondIds) delete s.scene.bonds[bid]
        delete s.scene.molecules[id]
      }),
    ),

  connectAtoms: (atomAId, atomBId) =>
    set(
      produce<SceneSlice>((s) => {
        if (atomAId === atomBId) return
        const a = s.scene.atoms[atomAId]
        const b = s.scene.atoms[atomBId]
        if (!a || !b) return
        // No-op if a bond already exists between these two atoms.
        for (const existing of Object.values(s.scene.bonds)) {
          if (
            (existing.atomA === atomAId && existing.atomB === atomBId) ||
            (existing.atomA === atomBId && existing.atomB === atomAId)
          ) {
            return
          }
        }
        // Refuse if either atom is already at its bonding capacity. A new
        // single bond would push at least one atom past nature's limit.
        if (
          freeCapacity(atomAId, s.scene.atoms, s.scene.bonds) < 1 ||
          freeCapacity(atomBId, s.scene.atoms, s.scene.bonds) < 1
        ) {
          return
        }
        // Merge molecule B into A if they differ. All of B's atoms get
        // reparented to A's molecule, then B's molecule entry is removed.
        if (a.moleculeId !== b.moleculeId) {
          const targetMolId = a.moleculeId
          const sourceMolId = b.moleculeId
          const sourceMol = s.scene.molecules[sourceMolId]
          const targetMol = s.scene.molecules[targetMolId]
          if (sourceMol && targetMol) {
            for (const aid of sourceMol.atomIds) {
              const atom = s.scene.atoms[aid]
              if (atom) atom.moleculeId = targetMolId
              if (!targetMol.atomIds.includes(aid)) targetMol.atomIds.push(aid)
            }
            for (const bid of sourceMol.bondIds) {
              if (!targetMol.bondIds.includes(bid)) targetMol.bondIds.push(bid)
            }
            delete s.scene.molecules[sourceMolId]
          }
        }
        const newBond: Bond = {
          id: bondId(),
          atomA: atomAId,
          atomB: atomBId,
          order: 1,
          type: 'covalent',
        }
        s.scene.bonds[newBond.id] = newBond
        const mol = s.scene.molecules[a.moleculeId]
        if (mol && !mol.bondIds.includes(newBond.id)) mol.bondIds.push(newBond.id)
      }),
    ),

  setMode: (mode) =>
    set(
      produce<SceneSlice>((s) => {
        s.scene.mode = mode
      }),
    ),
  setTier: (tier) =>
    set(
      produce<SceneSlice>((s) => {
        s.scene.tier = tier
      }),
    ),
  setSelection: (id) =>
    set(
      produce<SceneSlice>((s) => {
        s.scene.selection = id
      }),
    ),

  resetScene: () =>
    set(
      produce<SceneSlice>((s) => {
        s.scene = { ...initial, mode: s.scene.mode, tier: s.scene.tier } as Draft<
          SceneSliceState['scene']
        >
      }),
    ),
})
