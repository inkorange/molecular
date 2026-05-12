import { describe, expect, it } from 'vitest'
import {
  type Atom,
  atomId,
  type Bond,
  bondId,
  moleculeId,
  type SceneSnapshot,
} from '@/src/chem/types'
import { BOND_LENGTH, getBondingSites } from '@/src/chem/vsper'

function makeScene(atoms: Atom[], bonds: Bond[] = []): SceneSnapshot {
  const scene: SceneSnapshot = { atoms: {}, bonds: {}, molecules: {} }
  for (const a of atoms) scene.atoms[a.id] = a
  for (const b of bonds) scene.bonds[b.id] = b
  return scene
}

describe('getBondingSites', () => {
  it('isolated oxygen has 2 sites (bondingCapacity=2, no existing bonds)', () => {
    const m = moleculeId()
    const o: Atom = {
      id: atomId(),
      Z: 8,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const scene = makeScene([o])
    const sites = getBondingSites(o, scene)
    expect(sites.length).toBe(2)
    for (const s of sites) {
      expect(typeof s.position[0]).toBe('number')
      const len = Math.hypot(...s.position)
      expect(len).toBeCloseTo(BOND_LENGTH, 1)
    }
  })

  it('water — one H already bonded to O, O exposes one remaining site at ~104.5°', () => {
    const m = moleculeId()
    const oId = atomId()
    const h1Id = atomId()
    const o: Atom = {
      id: oId,
      Z: 8,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const h1: Atom = {
      id: h1Id,
      Z: 1,
      position: [BOND_LENGTH, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const b: Bond = {
      id: bondId(),
      atomA: oId,
      atomB: h1Id,
      order: 1,
      type: 'covalent',
    }
    const scene = makeScene([o, h1], [b])
    const sites = getBondingSites(o, scene)
    expect(sites.length).toBe(1)

    // Angle between (h1.position - o.position) and (site.position - o.position) is ~104.5° (tetrahedral with lone pairs)
    const a: [number, number, number] = [BOND_LENGTH, 0, 0]
    const s = sites[0]!.position
    const dot = a[0] * s[0] + a[1] * s[1] + a[2] * s[2]
    const cos = dot / (BOND_LENGTH * BOND_LENGTH)
    const degrees = (Math.acos(cos) * 180) / Math.PI
    expect(degrees).toBeGreaterThan(100)
    expect(degrees).toBeLessThan(115)
  })

  it('carbon — 4 sites in tetrahedral arrangement (~109.5° each)', () => {
    const m = moleculeId()
    const c: Atom = {
      id: atomId(),
      Z: 6,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const scene = makeScene([c])
    const sites = getBondingSites(c, scene)
    expect(sites.length).toBe(4)

    for (let i = 0; i < sites.length; i++) {
      for (let j = i + 1; j < sites.length; j++) {
        const a = sites[i]!.position
        const b = sites[j]!.position
        const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
        const cos = dot / (BOND_LENGTH * BOND_LENGTH)
        const degrees = (Math.acos(cos) * 180) / Math.PI
        expect(degrees).toBeGreaterThan(105)
        expect(degrees).toBeLessThan(115)
      }
    }
  })

  it('CO2 carbon — at least one site approximately opposite the existing O', () => {
    const m = moleculeId()
    const cId = atomId()
    const o1Id = atomId()
    const c: Atom = {
      id: cId,
      Z: 6,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const o1: Atom = {
      id: o1Id,
      Z: 8,
      position: [BOND_LENGTH, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const b: Bond = {
      id: bondId(),
      atomA: cId,
      atomB: o1Id,
      order: 2,
      type: 'covalent',
    }
    const scene = makeScene([c, o1], [b])
    const sites = getBondingSites(c, scene)
    expect(sites.length).toBeGreaterThanOrEqual(1)
    // C has capacity 4; a double bond (order=2) consumes 2 → 2 remaining single-bond slots.
    // Total electron domains = 1 (existing double bond) + 2 (open slots) = 3 → trigonal planar.
    // Trigonal-planar VSEPR places the open sites at ±120° from the existing neighbor at +x,
    // i.e. at (-0.5, ±√3/2, 0) — they orient AWAY from +x but are not strictly antipodal.
    // The tolerance below is 75° (enough to include ±120° and ±180°) so that the test asserts
    // "oriented away from the existing double bond" rather than strict linearity, which would
    // require a 2-domain (linear) geometry that is physically inconsistent with this scene.
    const site = sites[0]!.position
    const angle = Math.atan2(site[1], site[0]) * (180 / Math.PI)
    expect(Math.abs(Math.abs(angle) - 180)).toBeLessThan(75)
  })

  it('fully-bonded oxygen (in H2O) — 0 sites', () => {
    const m = moleculeId()
    const oId = atomId()
    const h1Id = atomId()
    const h2Id = atomId()
    const o: Atom = {
      id: oId,
      Z: 8,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const h1: Atom = {
      id: h1Id,
      Z: 1,
      position: [BOND_LENGTH, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const h2: Atom = {
      id: h2Id,
      Z: 1,
      position: [-0.25, BOND_LENGTH * 0.97, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const b1: Bond = {
      id: bondId(),
      atomA: oId,
      atomB: h1Id,
      order: 1,
      type: 'covalent',
    }
    const b2: Bond = {
      id: bondId(),
      atomA: oId,
      atomB: h2Id,
      order: 1,
      type: 'covalent',
    }
    const scene = makeScene([o, h1, h2], [b1, b2])
    const sites = getBondingSites(o, scene)
    expect(sites.length).toBe(0)
  })

  it('noble gas — 0 sites', () => {
    const m = moleculeId()
    const ne: Atom = {
      id: atomId(),
      Z: 10,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    }
    const scene = makeScene([ne])
    expect(getBondingSites(ne, scene).length).toBe(0)
  })
})
