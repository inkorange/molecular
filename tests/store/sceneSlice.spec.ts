import { beforeEach, describe, expect, it } from 'vitest'
import { atomId, bondId, moleculeId } from '@/src/chem/types'
import { useStore } from '@/src/store'

describe('scene store', () => {
  beforeEach(() => {
    useStore.getState().resetScene()
  })

  it('starts empty', () => {
    const s = useStore.getState().scene
    expect(Object.keys(s.atoms).length).toBe(0)
  })

  it('adds an atom', () => {
    const id = atomId()
    useStore.getState().addAtom({
      id,
      Z: 8,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: moleculeId(),
    })
    expect(useStore.getState().scene.atoms[id]?.Z).toBe(8)
  })

  it('adds a bond between two atoms', () => {
    const a1 = atomId()
    const a2 = atomId()
    const m = moleculeId()
    useStore.getState().addAtom({
      id: a1,
      Z: 1,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    })
    useStore.getState().addAtom({
      id: a2,
      Z: 8,
      position: [1, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    })
    const bid = bondId()
    useStore.getState().addBond({ id: bid, atomA: a1, atomB: a2, order: 1, type: 'covalent' })
    expect(useStore.getState().scene.bonds[bid]?.order).toBe(1)
  })

  it('removeAtom also removes connected bonds', () => {
    const a1 = atomId()
    const a2 = atomId()
    const m = moleculeId()
    useStore.getState().addAtom({
      id: a1,
      Z: 1,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    })
    useStore.getState().addAtom({
      id: a2,
      Z: 8,
      position: [1, 0, 0],
      velocity: [0, 0, 0],
      charge: 0,
      moleculeId: m,
    })
    const bid = bondId()
    useStore.getState().addBond({ id: bid, atomA: a1, atomB: a2, order: 1, type: 'covalent' })
    useStore.getState().removeAtom(a1)
    expect(useStore.getState().scene.atoms[a1]).toBeUndefined()
    expect(useStore.getState().scene.bonds[bid]).toBeUndefined()
  })

  it('setMode updates the mode', () => {
    useStore.getState().setMode('build')
    expect(useStore.getState().scene.mode).toBe('build')
  })
})
