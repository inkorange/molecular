import { produce } from 'immer'
import type { StateCreator } from 'zustand'

export interface UiSliceState {
  ui: {
    sidebarOpen: boolean
    inspectorOpen: boolean
    tutorOpen: boolean
    fullTableOpen: boolean
    /** Atom whose element-detail prompt popup is currently open above
     *  its periodic-card label. Null when no popup is showing. */
    elementPopupAtomId: string | null
  }
}

export interface UiSliceActions {
  toggleSidebar: () => void
  toggleInspector: () => void
  toggleTutor: () => void
  toggleFullTable: () => void
  openElementPopup: (atomId: string) => void
  closeElementPopup: () => void
}

export type UiSlice = UiSliceState & UiSliceActions

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  ui: {
    sidebarOpen: true,
    inspectorOpen: true,
    tutorOpen: false,
    fullTableOpen: false,
    elementPopupAtomId: null,
  },
  toggleSidebar: () =>
    set(
      produce<UiSlice>((s) => {
        s.ui.sidebarOpen = !s.ui.sidebarOpen
      }),
    ),
  toggleInspector: () =>
    set(
      produce<UiSlice>((s) => {
        s.ui.inspectorOpen = !s.ui.inspectorOpen
      }),
    ),
  toggleTutor: () =>
    set(
      produce<UiSlice>((s) => {
        s.ui.tutorOpen = !s.ui.tutorOpen
      }),
    ),
  toggleFullTable: () =>
    set(
      produce<UiSlice>((s) => {
        s.ui.fullTableOpen = !s.ui.fullTableOpen
      }),
    ),
  openElementPopup: (atomId) =>
    set(
      produce<UiSlice>((s) => {
        s.ui.elementPopupAtomId = atomId
      }),
    ),
  closeElementPopup: () =>
    set(
      produce<UiSlice>((s) => {
        s.ui.elementPopupAtomId = null
      }),
    ),
})
