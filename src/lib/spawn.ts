import { type Atom, atomId, type Bond, bondId, type Molecule, moleculeId } from '@/src/chem/types'
import type { LibraryMolecule } from '@/src/data/molecules'

export interface SpawnResult {
  atoms: Atom[]
  bonds: Bond[]
  molecule: Molecule
}

export function spawnLibraryEntry(
  entry: LibraryMolecule,
  origin: [number, number, number] = [0, 0, 0],
): SpawnResult {
  const mId = moleculeId()
  const atoms: Atom[] = entry.atoms.map((a) => ({
    id: atomId(),
    Z: a.Z,
    position: [a.position[0] + origin[0], a.position[1] + origin[1], a.position[2] + origin[2]],
    velocity: [0, 0, 0],
    charge: 0,
    moleculeId: mId,
  }))
  const bonds: Bond[] = entry.bonds.map((b) => ({
    id: bondId(),
    atomA: atoms[b.atomAIndex]!.id,
    atomB: atoms[b.atomBIndex]!.id,
    order: b.order,
    type: b.type ?? 'covalent',
  }))
  const molecule: Molecule = {
    id: mId,
    atomIds: atoms.map((a) => a.id),
    bondIds: bonds.map((b) => b.id),
  }
  return { atoms, bonds, molecule }
}
