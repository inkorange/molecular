import { describe, expect, it } from 'vitest'
import { atomId, bondId, moleculeId } from '@/src/chem/types'
import { sceneToPrompt } from '@/src/lib/sceneToPrompt'

describe('sceneToPrompt', () => {
  it('produces a short text summary for water', () => {
    const oId = atomId()
    const h1 = atomId()
    const h2 = atomId()
    const b1 = bondId()
    const b2 = bondId()
    const mId = moleculeId()
    const scene = {
      atoms: {
        [oId]: {
          id: oId,
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
        [b1]: { id: b1, atomA: oId, atomB: h1, order: 1, type: 'covalent' as const },
        [b2]: { id: b2, atomA: oId, atomB: h2, order: 1, type: 'covalent' as const },
      },
      molecules: { [mId]: { id: mId, atomIds: [oId, h1, h2], bondIds: [b1, b2] } },
    }
    const text = sceneToPrompt(scene as never)
    expect(text).toContain('H2O')
    expect(text).toContain('Water')
    expect(text).toContain('Bonds: 2')
  })

  it('handles an empty scene', () => {
    const empty = { atoms: {}, bonds: {}, molecules: {} }
    expect(sceneToPrompt(empty as never)).toBe('The scene is empty.')
  })
})
