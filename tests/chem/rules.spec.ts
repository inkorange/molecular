import { describe, expect, it } from 'vitest'
import { getElement } from '@/src/chem/elements'
import { canBond } from '@/src/chem/rules'

describe('canBond', () => {
  it('H + H → covalent single bond', () => {
    const r = canBond(getElement(1), getElement(1))
    expect(r.allowed).toBe(true)
    expect(r.order).toBe(1)
    expect(r.type).toBe('covalent')
    expect(r.preference).toBe('common')
  })

  it('H + O → covalent single bond', () => {
    const r = canBond(getElement(1), getElement(8))
    expect(r.allowed).toBe(true)
    expect(r.order).toBe(1)
    expect(r.type).toBe('covalent')
  })

  it('C + C → covalent single bond by default (orders up to triple are negotiated by getBondingSites)', () => {
    const r = canBond(getElement(6), getElement(6))
    expect(r.allowed).toBe(true)
    expect(r.order).toBe(1)
    expect(r.type).toBe('covalent')
  })

  it('Na + Cl → ionic single (Δχ > 1.7)', () => {
    const r = canBond(getElement(11), getElement(17))
    expect(r.allowed).toBe(true)
    expect(r.type).toBe('ionic')
    expect(r.order).toBe(1)
  })

  it('He + H → not allowed (noble has no bondingCapacity)', () => {
    const r = canBond(getElement(2), getElement(1))
    expect(r.allowed).toBe(false)
  })

  it('Ne + Ne → not allowed', () => {
    const r = canBond(getElement(10), getElement(10))
    expect(r.allowed).toBe(false)
  })

  it('O + O → covalent (becomes O=O double when sites negotiate)', () => {
    const r = canBond(getElement(8), getElement(8))
    expect(r.allowed).toBe(true)
    expect(r.type).toBe('covalent')
  })

  it('N + N → covalent (becomes N≡N triple in N₂)', () => {
    const r = canBond(getElement(7), getElement(7))
    expect(r.allowed).toBe(true)
    expect(r.type).toBe('covalent')
  })

  it('unusual: H + Be (allowed but flagged as unusual at large Δχ on metal side)', () => {
    const r = canBond(getElement(1), getElement(4))
    expect(r.allowed).toBe(true)
  })
})
