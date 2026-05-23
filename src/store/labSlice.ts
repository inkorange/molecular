import { produce } from 'immer'
import type { StateCreator } from 'zustand'

export interface ReactionLogEntry {
  id: string
  equation: string
  enthalpy: 'exothermic' | 'endothermic'
  ts?: number
}

/**
 * Snapshot of an in-flight reaction animation. Drives the
 * `<LabReactionEffects>` overlay inside the AppScene Canvas — same
 * effect vocabulary as the /demo player (ReactionEffect / TransitionFlash
 * / EnergyDisplay), repurposed for the more emergent lab flow.
 */
export interface ActiveReactionAnimation {
  reactionId: string
  /** Chemistry effect kind — matches the engine reaction.type for the
   *  five chemistry-mode kinds. */
  kind: 'synthesis' | 'combustion' | 'decomposition' | 'neutralization' | 'displacement'
  enthalpy: 'exothermic' | 'endothermic'
  /** performance.now() at the moment the animation kicked off. The
   *  effect components compute their per-frame envelope from
   *  `performance.now() - startedAt`. */
  startedAt: number
  /** Duration in ms. After this elapses the AppShell calls
   *  clearReactionAnimation. */
  durationMs: number
  /** Molecule ids being consumed by the reaction. These render with a
   *  shrink-toward-origin transform during the FIRST half of the
   *  animation, then vanish from the store when applyReaction fires
   *  at the flash midpoint. */
  reactantIds: string[]
  /** Molecule ids newly added by applyReaction. Populated at the
   *  midpoint (after applyReaction runs); empty before then. These
   *  render with a grow-from-origin transform during the SECOND half
   *  of the animation. */
  productIds: string[]
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
    /** The currently-playing reaction animation, or null when nothing is
     *  animating. Subscribed by `<LabReactionEffects>` to mount/unmount
     *  the in-scene visuals. */
    activeAnimation: ActiveReactionAnimation | null
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
  startReactionAnimation: (anim: ActiveReactionAnimation) => void
  /** Populate the productIds slot on the current animation. Called by
   *  combineHint right after applyReaction so the just-spawned product
   *  molecules know to play their grow-from-origin entry. */
  setReactionAnimationProducts: (productIds: string[]) => void
  clearReactionAnimation: () => void
}

export type LabSlice = LabSliceState & LabSliceActions

export const createLabSlice: StateCreator<LabSlice> = (set) => ({
  lab: {
    reactions: [],
    pendingReactantIds: [],
    lastAddedLibId: null,
    dismissedHintIds: [],
    activeAnimation: null,
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
  startReactionAnimation: (anim) =>
    set(
      produce<LabSlice>((s) => {
        s.lab.activeAnimation = anim
      }),
    ),
  setReactionAnimationProducts: (productIds) =>
    set(
      produce<LabSlice>((s) => {
        if (s.lab.activeAnimation) s.lab.activeAnimation.productIds = productIds
      }),
    ),
  clearReactionAnimation: () =>
    set(
      produce<LabSlice>((s) => {
        s.lab.activeAnimation = null
      }),
    ),
})
