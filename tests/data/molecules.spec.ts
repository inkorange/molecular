import { describe, expect, it } from 'vitest'
import { getLibraryEntry, LIBRARY, LIBRARY_CATEGORIES } from '@/src/data/molecules'

describe('molecule library', () => {
  it('contains at least 30 entries', () => {
    expect(LIBRARY.length).toBeGreaterThanOrEqual(30)
  })

  it('every entry has name, formula, category, atoms, bonds', () => {
    for (const m of LIBRARY) {
      expect(m.id).toBeDefined()
      expect(m.name).toBeDefined()
      expect(m.formula).toBeDefined()
      expect(m.category).toBeDefined()
      expect(m.atoms.length).toBeGreaterThan(0)
      expect(Array.isArray(m.bonds)).toBe(true)
    }
  })

  it('bonds reference valid atom indices', () => {
    for (const m of LIBRARY) {
      for (const b of m.bonds) {
        expect(b.atomAIndex).toBeGreaterThanOrEqual(0)
        expect(b.atomAIndex).toBeLessThan(m.atoms.length)
        expect(b.atomBIndex).toBeGreaterThanOrEqual(0)
        expect(b.atomBIndex).toBeLessThan(m.atoms.length)
      }
    }
  })

  it('water exists by id', () => {
    expect(getLibraryEntry('water')).toBeDefined()
  })

  it('LIBRARY_CATEGORIES includes the categories used by entries', () => {
    const used = new Set(LIBRARY.map((m) => m.category))
    for (const c of used) {
      expect(LIBRARY_CATEGORIES).toContain(c)
    }
  })
})
