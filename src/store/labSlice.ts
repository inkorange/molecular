import { produce } from 'immer'
import type { StateCreator } from 'zustand'

export interface ReactionLogEntry {
  id: string
  equation: string
  enthalpy: 'exothermic' | 'endothermic'
  ts?: number
}

export interface LabSliceState {
  lab: {
    reactions: ReactionLogEntry[]
  }
}

export interface LabSliceActions {
  logReaction: (entry: ReactionLogEntry) => void
  clearReactionLog: () => void
}

export type LabSlice = LabSliceState & LabSliceActions

export const createLabSlice: StateCreator<LabSlice> = (set) => ({
  lab: { reactions: [] },
  logReaction: (entry) =>
    set(
      produce<LabSlice>((s) => {
        s.lab.reactions.push({ ...entry, ts: entry.ts ?? Date.now() })
      }),
    ),
  clearReactionLog: () =>
    set(
      produce<LabSlice>((s) => {
        s.lab.reactions = []
      }),
    ),
})
