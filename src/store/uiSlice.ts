import { produce } from 'immer'
import type { StateCreator } from 'zustand'

export interface UiSliceState {
  ui: {
    sidebarOpen: boolean
    inspectorOpen: boolean
    tutorOpen: boolean
    fullTableOpen: boolean
  }
}

export interface UiSliceActions {
  toggleSidebar: () => void
  toggleInspector: () => void
  toggleTutor: () => void
  toggleFullTable: () => void
}

export type UiSlice = UiSliceState & UiSliceActions

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  ui: {
    sidebarOpen: true,
    inspectorOpen: true,
    tutorOpen: false,
    fullTableOpen: false,
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
})
