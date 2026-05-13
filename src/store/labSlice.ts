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
    /** Molecule ids the user has explicitly added via the Lab toolbar since
     *  the last reaction or reset. The "Combine reactants" button is bounded
     *  to this pool so it won't keep flipping background-scene molecules
     *  through reverse reactions (e.g. water → H2 + O2). */
    pendingReactantIds: string[]
    /** Library id of the most recently added reactant. Used by Reset so the
     *  scene resets back to whatever the user was just working with instead
     *  of the default water. Null on first lab visit. */
    lastAddedLibId: string | null
    /** Reaction ids the user has explicitly dismissed from the Hints panel.
     *  Filtered out of the displayed hints. Cleared on Reset. Stored as an
     *  array (not Set) so it serialises cleanly for future persistence. */
    dismissedHintIds: string[]
  }
}

export interface LabSliceActions {
  logReaction: (entry: ReactionLogEntry) => void
  clearReactionLog: () => void
  addPendingReactant: (id: string) => void
  consumePendingReactants: (ids: string[]) => void
  clearPendingReactants: () => void
  setLastAddedLibId: (id: string) => void
  dismissHint: (reactionId: string) => void
  clearDismissedHints: () => void
}

export type LabSlice = LabSliceState & LabSliceActions

export const createLabSlice: StateCreator<LabSlice> = (set) => ({
  lab: {
    reactions: [],
    pendingReactantIds: [],
    lastAddedLibId: null,
    dismissedHintIds: [],
  },
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
  addPendingReactant: (id) =>
    set(
      produce<LabSlice>((s) => {
        if (!s.lab.pendingReactantIds.includes(id)) s.lab.pendingReactantIds.push(id)
      }),
    ),
  consumePendingReactants: (ids) =>
    set(
      produce<LabSlice>((s) => {
        const removed = new Set(ids)
        s.lab.pendingReactantIds = s.lab.pendingReactantIds.filter((id) => !removed.has(id))
      }),
    ),
  clearPendingReactants: () =>
    set(
      produce<LabSlice>((s) => {
        s.lab.pendingReactantIds = []
      }),
    ),
  setLastAddedLibId: (id) =>
    set(
      produce<LabSlice>((s) => {
        s.lab.lastAddedLibId = id
      }),
    ),
  dismissHint: (reactionId) =>
    set(
      produce<LabSlice>((s) => {
        if (!s.lab.dismissedHintIds.includes(reactionId)) {
          s.lab.dismissedHintIds.push(reactionId)
        }
      }),
    ),
  clearDismissedHints: () =>
    set(
      produce<LabSlice>((s) => {
        s.lab.dismissedHintIds = []
      }),
    ),
})
