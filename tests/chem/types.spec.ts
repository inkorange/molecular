import { describe, expect, it } from 'vitest'
import type {
  Atom,
  AtomId,
  Bond,
  BondId,
  BondType,
  Element,
  ElementCategory,
  Molecule,
  MoleculeId,
  SceneSnapshot,
  Vec3,
} from '@/src/chem/types'

describe('chem types — runtime shape sanity', () => {
  it('Vec3 is a 3-tuple of numbers', () => {
    const v: Vec3 = [1, 2, 3]
    expect(v.length).toBe(3)
  })

  it('Atom carries Z, id, moleculeId, position, charge', () => {
    const atom: Atom = {
      id: 'a-1' as AtomId,
      Z: 8,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: 'm-1' as MoleculeId,
    }
    expect(atom.Z).toBe(8)
  })

  it('Bond carries type and order', () => {
    const bond: Bond = {
      id: 'b-1' as BondId,
      atomA: 'a-1' as AtomId,
      atomB: 'a-2' as AtomId,
      order: 1,
      type: 'covalent',
    }
    expect(bond.order).toBe(1)
    const types: BondType[] = ['covalent', 'ionic']
    expect(types.length).toBe(2)
  })

  it('Molecule carries atom + bond ids', () => {
    const mol: Molecule = {
      id: 'm-1' as MoleculeId,
      atomIds: ['a-1' as AtomId],
      bondIds: [],
    }
    expect(mol.atomIds.length).toBe(1)
  })

  it('SceneSnapshot is a flat dict-style scene', () => {
    const scene: SceneSnapshot = { atoms: {}, bonds: {}, molecules: {} }
    expect(Object.keys(scene.atoms)).toEqual([])
  })

  it('ElementCategory union covers all 8 categories', () => {
    const cats: ElementCategory[] = [
      'alkali',
      'alkaline',
      'transition',
      'other-metal',
      'metalloid',
      'nonmetal',
      'halogen',
      'noble',
    ]
    expect(cats.length).toBe(8)
  })

  it('Element shape sanity', () => {
    const o: Element = {
      Z: 8,
      symbol: 'O',
      name: 'Oxygen',
      mass: 16.0,
      category: 'nonmetal',
      cpkColor: '#FF0D0D',
      shells: [2, 6],
      valence: 6,
      bondingCapacity: 2,
      oxidationStates: [-2],
      electronegativity: 3.44,
      vdwRadius: 1.52,
    }
    expect(o.symbol).toBe('O')
  })
})
