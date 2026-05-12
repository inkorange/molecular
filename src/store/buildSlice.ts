import { type Draft, produce } from 'immer'
import type { StateCreator } from 'zustand'
import type { Vec3 } from '@/src/chem/types'

export interface BuildSliceState {
  build: {
    heldZ: number | null
    pointerWorld: Vec3 | null
    activeSiteId: string | null
  }
}

export interface BuildSliceActions {
  hold: (Z: number) => void
  clearHeld: () => void
  updatePointer: (pos: Vec3 | null) => void
  setActiveSite: (id: string | null) => void
}

export type BuildSlice = BuildSliceState & BuildSliceActions

export const createBuildSlice: StateCreator<BuildSlice> = (set) => ({
  build: { heldZ: null, pointerWorld: null, activeSiteId: null },
  hold: (Z) =>
    set(
      produce<BuildSlice>((s) => {
        s.build.heldZ = Z
      }),
    ),
  clearHeld: () =>
    set(
      produce<BuildSlice>((s) => {
        s.build.heldZ = null
        s.build.pointerWorld = null
        s.build.activeSiteId = null
      }),
    ),
  updatePointer: (pos) =>
    set(
      produce<BuildSlice>((s) => {
        s.build.pointerWorld = pos as Draft<Vec3 | null>
      }),
    ),
  setActiveSite: (id) =>
    set(
      produce<BuildSlice>((s) => {
        s.build.activeSiteId = id
      }),
    ),
})
