import { describe, expect, it } from 'vitest'
import {
  type Atom,
  atomId,
  type Bond,
  bondId,
  moleculeId,
  type SceneSnapshot,
} from '@/src/chem/types'
import { validateScene } from '@/src/chem/validate'

function scene(atoms: Atom[], bonds: Bond[]): SceneSnapshot {
  const s: SceneSnapshot = { atoms: {}, bonds: {}, molecules: {} }
  for (const a of atoms) s.atoms[a.id] = a
  for (const b of bonds) s.bonds[b.id] = b
  return s
}

describe('validateScene', () => {
  it('water → valid + named', () => {
    const m = moleculeId()
    const o: Atom = {
      id: atomId(),
      Z: 8,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const h1: Atom = {
      id: atomId(),
      Z: 1,
      position: [1, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const h2: Atom = {
      id: atomId(),
      Z: 1,
      position: [-0.25, 0.97, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const b1: Bond = { id: bondId(), atomA: o.id, atomB: h1.id, order: 1, type: 'covalent' }
    const b2: Bond = { id: bondId(), atomA: o.id, atomB: h2.id, order: 1, type: 'covalent' }
    const r = validateScene(scene([o, h1, h2], [b1, b2]))
    expect(r.status).toBe('valid-named')
    expect(r.name).toBe('Water')
    expect(r.formula).toBe('H2O')
  })

  it('CH4 → valid + named (Methane)', () => {
    const m = moleculeId()
    const c: Atom = {
      id: atomId(),
      Z: 6,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const hs: Atom[] = [
      { id: atomId(), Z: 1, position: [1, 1, 1], velocity: [0, 0, 0], charge: 0, moleculeId: m },
      { id: atomId(), Z: 1, position: [-1, -1, 1], velocity: [0, 0, 0], charge: 0, moleculeId: m },
      { id: atomId(), Z: 1, position: [-1, 1, -1], velocity: [0, 0, 0], charge: 0, moleculeId: m },
      { id: atomId(), Z: 1, position: [1, -1, -1], velocity: [0, 0, 0], charge: 0, moleculeId: m },
    ]
    const bs: Bond[] = hs.map((h) => ({
      id: bondId(),
      atomA: c.id,
      atomB: h.id,
      order: 1,
      type: 'covalent',
    }))
    const r = validateScene(scene([c, ...hs], bs))
    expect(r.status).toBe('valid-named')
    expect(r.name).toBe('Methane')
  })

  it('CH3 (free radical, C with only 3 bonds) → unusual', () => {
    const m = moleculeId()
    const c: Atom = {
      id: atomId(),
      Z: 6,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const hs: Atom[] = [1, 2, 3].map(() => ({
      id: atomId(),
      Z: 1,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }))
    const bs: Bond[] = hs.map((h) => ({
      id: bondId(),
      atomA: c.id,
      atomB: h.id,
      order: 1,
      type: 'covalent',
    }))
    const r = validateScene(scene([c, ...hs], bs))
    expect(r.status).toBe('valid-unusual')
  })

  it('empty scene → empty', () => {
    expect(validateScene(scene([], [])).status).toBe('empty')
  })

  it('single H atom → valid-unnamed or valid-unusual (no name, no broken rules)', () => {
    const m = moleculeId()
    const h: Atom = {
      id: atomId(),
      Z: 1,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const r = validateScene(scene([h], []))
    expect(['valid-unnamed', 'valid-unusual']).toContain(r.status)
  })
})
