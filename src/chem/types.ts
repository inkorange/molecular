// Branded id types so we don't mix them up.
export type AtomId = string & { readonly __brand: 'AtomId' }
export type BondId = string & { readonly __brand: 'BondId' }
export type MoleculeId = string & { readonly __brand: 'MoleculeId' }

export type Vec3 = readonly [number, number, number]

export type BondType = 'covalent' | 'ionic'
export type BondOrder = 1 | 2 | 3

export type ElementCategory =
  | 'alkali'
  | 'alkaline'
  | 'transition'
  | 'other-metal'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble'

export interface Element {
  Z: number
  symbol: string
  name: string
  mass: number
  category: ElementCategory
  cpkColor: string
  shells: readonly number[]
  valence: number
  bondingCapacity: number
  oxidationStates: readonly number[]
  electronegativity: number
  vdwRadius: number
}

export interface Atom {
  id: AtomId
  Z: number
  position: Vec3
  velocity: Vec3
  charge: number
  moleculeId: MoleculeId
}

export interface Bond {
  id: BondId
  atomA: AtomId
  atomB: AtomId
  order: BondOrder
  type: BondType
}

export interface Molecule {
  id: MoleculeId
  atomIds: AtomId[]
  bondIds: BondId[]
}

export interface SceneSnapshot {
  atoms: Record<string, Atom>
  bonds: Record<string, Bond>
  molecules: Record<string, Molecule>
}

// Helpers for creating branded ids without leaking the brand.
let __atomCounter = 0
let __bondCounter = 0
let __molCounter = 0

export function atomId(): AtomId {
  return `a-${++__atomCounter}` as AtomId
}
export function bondId(): BondId {
  return `b-${++__bondCounter}` as BondId
}
export function moleculeId(): MoleculeId {
  return `m-${++__molCounter}` as MoleculeId
}
