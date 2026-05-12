import { describe, expect, it } from 'vitest'
import { getLibraryEntry } from '@/src/data/molecules'
import { spawnLibraryEntry } from '@/src/lib/spawn'

describe('spawnLibraryEntry', () => {
  it('water → 3 atoms + 2 bonds + 1 molecule, all freshly id-ed', () => {
    const entry = getLibraryEntry('water')!
    const { atoms, bonds, molecule } = spawnLibraryEntry(entry)
    expect(atoms.length).toBe(3)
    expect(bonds.length).toBe(2)
    expect(molecule.atomIds.length).toBe(3)
    expect(molecule.bondIds.length).toBe(2)
    for (const a of atoms) expect(a.moleculeId).toBe(molecule.id)
  })

  it('bonds reference real atom ids in the spawned set', () => {
    const entry = getLibraryEntry('methane')!
    const { atoms, bonds } = spawnLibraryEntry(entry)
    const ids = new Set(atoms.map((a) => a.id))
    for (const b of bonds) {
      expect(ids.has(b.atomA)).toBe(true)
      expect(ids.has(b.atomB)).toBe(true)
    }
  })

  it('origin offset shifts every atom by the given amount', () => {
    const entry = getLibraryEntry('water')!
    const { atoms } = spawnLibraryEntry(entry, [10, 5, -2])
    const original = entry.atoms[0]!
    const spawned = atoms[0]!
    expect(spawned.position[0]).toBeCloseTo(original.position[0] + 10, 5)
    expect(spawned.position[1]).toBeCloseTo(original.position[1] + 5, 5)
    expect(spawned.position[2]).toBeCloseTo(original.position[2] - 2, 5)
  })
})
