import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '@/src/store'

describe('lab slice', () => {
  beforeEach(() => useStore.getState().clearReactionLog())

  it('logs a reaction entry', () => {
    useStore.getState().logReaction({
      id: 'water-synthesis',
      equation: '2 H2 + O2 → 2 H2O',
      enthalpy: 'exothermic',
    })
    expect(useStore.getState().lab.reactions.length).toBe(1)
  })

  it('clears the log', () => {
    useStore.getState().logReaction({ id: 'x', equation: 'x', enthalpy: 'exothermic' })
    useStore.getState().clearReactionLog()
    expect(useStore.getState().lab.reactions.length).toBe(0)
  })
})
