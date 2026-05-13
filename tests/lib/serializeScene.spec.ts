import { describe, expect, it } from 'vitest'
import { atomId, bondId, moleculeId } from '@/src/chem/types'
import { deserializeScene, serializeScene } from '@/src/lib/serializeScene'

describe('serializeScene', () => {
  it('round-trips water', () => {
    const mId = moleculeId()
    const o = atomId()
    const h1 = atomId()
    const h2 = atomId()
    const b1 = bondId()
    const b2 = bondId()
    const scene = {
      atoms: {
        [o]: {
          id: o,
          Z: 8,
          position: [0, 0, 0] as const,
          velocity: [0, 0, 0] as const,
          charge: 0,
          moleculeId: mId,
        },
        [h1]: {
          id: h1,
          Z: 1,
          position: [1, 0, 0] as const,
          velocity: [0, 0, 0] as const,
          charge: 0,
          moleculeId: mId,
        },
        [h2]: {
          id: h2,
          Z: 1,
          position: [-1, 0, 0] as const,
          velocity: [0, 0, 0] as const,
          charge: 0,
          moleculeId: mId,
        },
      },
      bonds: {
        [b1]: { id: b1, atomA: o, atomB: h1, order: 1 as const, type: 'covalent' as const },
        [b2]: { id: b2, atomA: o, atomB: h2, order: 1 as const, type: 'covalent' as const },
      },
      molecules: { [mId]: { id: mId, atomIds: [o, h1, h2], bondIds: [b1, b2] } },
    }
    const json = serializeScene(scene as never)
    const back = deserializeScene(json)
    expect(Object.keys(back.atoms).length).toBe(3)
    expect(Object.keys(back.bonds).length).toBe(2)
    expect(Object.keys(back.molecules).length).toBe(1)
    // Spot-check an atom round-tripped including position.
    expect(back.atoms[o as string]?.Z).toBe(8)
    expect(back.atoms[o as string]?.position).toEqual([0, 0, 0])
  })

  it('handles an empty scene', () => {
    const json = serializeScene({ atoms: {}, bonds: {}, molecules: {} })
    const back = deserializeScene(json)
    expect(back).toEqual({ atoms: {}, bonds: {}, molecules: {} })
  })

  it('tolerates missing top-level keys (truncated payload)', () => {
    // Missing `bonds` and `molecules` — should yield empty maps for those.
    const back = deserializeScene('{"atoms":[]}')
    expect(back.atoms).toEqual({})
    expect(back.bonds).toEqual({})
    expect(back.molecules).toEqual({})
  })
})
