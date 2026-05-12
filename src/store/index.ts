import { create } from 'zustand'
import { createSceneSlice, type SceneSlice } from './sceneSlice'
import { createUiSlice, type UiSlice } from './uiSlice'

export type AppState = SceneSlice & UiSlice

export const useStore = create<AppState>()((...args) => ({
  ...createSceneSlice(...args),
  ...createUiSlice(...args),
}))
