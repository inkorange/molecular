import { produce } from 'immer'
import type { StateCreator } from 'zustand'

export interface CameraView {
  /** Camera world-space position. */
  position: [number, number, number]
  /** OrbitControls target — the world-space point the camera looks at. */
  target: [number, number, number]
}

export interface ViewSliceState {
  view: {
    /** Live camera state, written each time OrbitControls / the camera changes.
     *  The Share button reads this to capture exactly where the user is
     *  looking. Null until CameraSync has observed at least one frame. */
    currentView: CameraView | null
    /** One-shot view to apply on next render. The /s/[hash] page decode
     *  sets this; CameraApply reads it, sets the camera + OrbitControls
     *  target imperatively, then clears it. */
    pendingView: CameraView | null
  }
}

export interface ViewSliceActions {
  setCurrentView: (v: CameraView) => void
  setPendingView: (v: CameraView | null) => void
}

export type ViewSlice = ViewSliceState & ViewSliceActions

export const createViewSlice: StateCreator<ViewSlice> = (set) => ({
  view: { currentView: null, pendingView: null },
  setCurrentView: (v) =>
    set(
      produce<ViewSlice>((s) => {
        s.view.currentView = v
      }),
    ),
  setPendingView: (v) =>
    set(
      produce<ViewSlice>((s) => {
        s.view.pendingView = v
      }),
    ),
})
