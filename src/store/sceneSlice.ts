import { type Draft, produce } from 'immer'
import type { StateCreator } from 'zustand'
import type {
  Atom,
  AtomId,
  Bond,
  BondId,
  Molecule,
  MoleculeId,
  SceneSnapshot,
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
  addBond: (bond: Bond) => void
  removeBond: (id: BondId) => void
  addMolecule: (molecule: Molecule) => void
  removeMolecule: (id: MoleculeId) => void
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
