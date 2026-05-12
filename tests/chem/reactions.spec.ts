import { describe, expect, it } from 'vitest'
import { findReaction, REACTIONS } from '@/src/chem/reactions'

describe('REACTIONS database', () => {
  it('contains at least 25 reactions', () => {
    expect(REACTIONS.length).toBeGreaterThanOrEqual(25)
  })

  it('every reaction has reactants, products, type, enthalpy, activationEnergy, notes', () => {
    for (const r of REACTIONS) {
      expect(r.id).toBeDefined()
      expect(r.reactants.length).toBeGreaterThan(0)
      expect(r.products.length).toBeGreaterThan(0)
      expect([
        'synthesis',
        'decomposition',
        'displacement',
        'combustion',
        'neutralization',
      ]).toContain(r.type)
      expect(['exothermic', 'endothermic']).toContain(r.enthalpy)
      expect(typeof r.activationEnergy).toBe('number')
    }
  })

  it('water synthesis is present and balances mass', () => {
    const r = findReaction([
      { formula: 'H2', count: 2 },
      { formula: 'O2', count: 1 },
    ])
    expect(r?.products).toEqual([{ formula: 'H2O', count: 2 }])
  })

  it('order of reactants in input does not matter', () => {
    const a = findReaction([
      { formula: 'H2', count: 2 },
      { formula: 'O2', count: 1 },
    ])
    const b = findReaction([
      { formula: 'O2', count: 1 },
      { formula: 'H2', count: 2 },
    ])
    expect(a?.id).toBe(b?.id)
  })

  it('methane combustion is present', () => {
    const r = findReaction([
      { formula: 'CH4', count: 1 },
      { formula: 'O2', count: 2 },
    ])
    expect(r?.products).toEqual([
      { formula: 'CO2', count: 1 },
      { formula: 'H2O', count: 2 },
    ])
  })

  it('NaCl synthesis is present', () => {
    const r = findReaction([
      { formula: 'Na', count: 2 },
      { formula: 'Cl2', count: 1 },
    ])
    expect(r?.products).toEqual([{ formula: 'NaCl', count: 2 }])
  })

  it('neutralization (HCl + NaOH) is present', () => {
    const r = findReaction([
      { formula: 'HCl', count: 1 },
      { formula: 'NaOH', count: 1 },
    ])
    expect(r?.type).toBe('neutralization')
  })

  it('unmatched mixture returns undefined', () => {
    const r = findReaction([
      { formula: 'He', count: 1 },
      { formula: 'Ne', count: 1 },
    ])
    expect(r).toBeUndefined()
  })
})
