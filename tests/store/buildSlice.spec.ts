import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '@/src/store'

describe('build slice', () => {
  beforeEach(() => {
    useStore.getState().clearHeld()
  })

  it('starts with nothing held', () => {
    expect(useStore.getState().build.heldZ).toBeNull()
  })

  it('hold(Z) sets heldZ', () => {
    useStore.getState().hold(8)
    expect(useStore.getState().build.heldZ).toBe(8)
  })

  it('updatePointer sets pointer world position', () => {
    useStore.getState().updatePointer([1, 2, 3])
    expect(useStore.getState().build.pointerWorld).toEqual([1, 2, 3])
  })

  it('setActiveSite stores an id', () => {
    useStore.getState().setActiveSite('atom-1::0')
    expect(useStore.getState().build.activeSiteId).toBe('atom-1::0')
  })

  it('clearHeld resets heldZ, pointerWorld, activeSiteId', () => {
    useStore.getState().hold(8)
    useStore.getState().updatePointer([1, 1, 1])
    useStore.getState().setActiveSite('atom-1::0')
    useStore.getState().clearHeld()
    expect(useStore.getState().build.heldZ).toBeNull()
    expect(useStore.getState().build.pointerWorld).toBeNull()
    expect(useStore.getState().build.activeSiteId).toBeNull()
  })
})
