import { describe, expect, it } from 'vitest'
import { getFormula } from '@/src/chem/formula'
import type { Atom } from '@/src/chem/types'
import { atomId, moleculeId } from '@/src/chem/types'

function make(Z: number): Atom {
  return {
    id: atomId(),
    Z,
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    charge: 0,
    moleculeId: moleculeId(),
  }
}

describe('getFormula — conventional chemistry textbook output', () => {
  it('water → H2O', () => {
    expect(getFormula([make(8), make(1), make(1)])).toBe('H2O')
  })

  it('methane → CH4 (Hill: C first, H second)', () => {
    expect(getFormula([make(6), make(1), make(1), make(1), make(1)])).toBe('CH4')
  })

  it('ethanol → C2H6O', () => {
    const atoms = [
      make(6),
      make(6),
      make(8),
      ...Array(6)
        .fill(0)
        .map(() => make(1)),
    ]
    expect(getFormula(atoms)).toBe('C2H6O')
  })

  it('ammonia → NH3 (hydride exception: N is hydride element → H last)', () => {
    expect(getFormula([make(7), make(1), make(1), make(1)])).toBe('NH3')
  })

  it('borane → BH3 (hydride exception)', () => {
    expect(getFormula([make(5), make(1), make(1), make(1)])).toBe('BH3')
  })

  it('phosphine → PH3 (hydride exception)', () => {
    expect(getFormula([make(15), make(1), make(1), make(1)])).toBe('PH3')
  })

  it('silane → SiH4 (hydride exception)', () => {
    expect(getFormula([make(14), make(1), make(1), make(1), make(1)])).toBe('SiH4')
  })

  it('hydrochloric acid → HCl (Cl not a hydride element → electronegativity-asc: H, Cl)', () => {
    expect(getFormula([make(1), make(17)])).toBe('HCl')
  })

  it('sodium chloride → NaCl (electronegativity-asc: Na, Cl)', () => {
    expect(getFormula([make(11), make(17)])).toBe('NaCl')
  })

  it('magnesium oxide → MgO', () => {
    expect(getFormula([make(12), make(8)])).toBe('MgO')
  })

  it('single atom counts emit no number', () => {
    expect(getFormula([make(8), make(1)])).toBe('HO')
  })

  it('empty atom list → empty string', () => {
    expect(getFormula([])).toBe('')
  })
})
