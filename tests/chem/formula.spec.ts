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

describe('getFormula', () => {
  it('water → H2O', () => {
    const atoms = [make(8), make(1), make(1)]
    expect(getFormula(atoms)).toBe('H2O')
  })

  it('methane → CH4', () => {
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

  it('ammonia → H3N (Hill: when no carbon, alphabetical incl. H)', () => {
    expect(getFormula([make(7), make(1), make(1), make(1)])).toBe('H3N')
  })

  it('sodium chloride → ClNa (Hill: when no carbon, alphabetical)', () => {
    expect(getFormula([make(11), make(17)])).toBe('ClNa')
  })

  it('single atom counts emit no number', () => {
    expect(getFormula([make(8), make(1)])).toBe('HO')
  })

  it('empty atom list → empty string', () => {
    expect(getFormula([])).toBe('')
  })
})
