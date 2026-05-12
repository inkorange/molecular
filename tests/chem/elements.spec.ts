import { describe, expect, it } from 'vitest'
import { ELEMENTS, getElement } from '@/src/chem/elements'

describe('ELEMENTS table', () => {
  it('contains exactly 36 elements (Z=1–36)', () => {
    expect(ELEMENTS.length).toBe(36)
    expect(ELEMENTS[0]?.Z).toBe(1)
    expect(ELEMENTS[35]?.Z).toBe(36)
  })

  it('every entry has Z, symbol, name, mass, category, cpkColor, shells, valence, bondingCapacity, electronegativity', () => {
    for (const e of ELEMENTS) {
      expect(typeof e.Z).toBe('number')
      expect(e.symbol).toMatch(/^[A-Z][a-z]?$/)
      expect(e.name.length).toBeGreaterThan(0)
      expect(e.mass).toBeGreaterThan(0)
      expect(e.category).toBeDefined()
      expect(e.cpkColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(e.shells.length).toBeGreaterThan(0)
      expect(typeof e.valence).toBe('number')
      expect(typeof e.bondingCapacity).toBe('number')
      expect(typeof e.electronegativity).toBe('number')
    }
  })

  it('shells sum equals Z', () => {
    for (const e of ELEMENTS) {
      const sum = e.shells.reduce((a, b) => a + b, 0)
      expect(sum).toBe(e.Z)
    }
  })

  it('Hydrogen: Z=1, valence=1, bondingCapacity=1', () => {
    const h = getElement(1)
    expect(h.symbol).toBe('H')
    expect(h.valence).toBe(1)
    expect(h.bondingCapacity).toBe(1)
  })

  it('Oxygen: Z=8, valence=6, bondingCapacity=2', () => {
    const o = getElement(8)
    expect(o.symbol).toBe('O')
    expect(o.valence).toBe(6)
    expect(o.bondingCapacity).toBe(2)
  })

  it('Carbon: Z=6, valence=4, bondingCapacity=4', () => {
    const c = getElement(6)
    expect(c.symbol).toBe('C')
    expect(c.valence).toBe(4)
    expect(c.bondingCapacity).toBe(4)
  })

  it('Neon: bondingCapacity=0 (noble)', () => {
    const ne = getElement(10)
    expect(ne.category).toBe('noble')
    expect(ne.bondingCapacity).toBe(0)
  })

  it('Sodium and Chlorine have a large electronegativity gap (ionic territory)', () => {
    const na = getElement(11)
    const cl = getElement(17)
    expect(Math.abs(na.electronegativity - cl.electronegativity)).toBeGreaterThan(1.7)
  })

  it('getElement throws on Z out of range', () => {
    expect(() => getElement(0)).toThrow()
    expect(() => getElement(37)).toThrow()
  })
})
