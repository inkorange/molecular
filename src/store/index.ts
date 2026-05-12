import { create } from 'zustand'
import { type BuildSlice, createBuildSlice } from './buildSlice'
import { createLabSlice, type LabSlice } from './labSlice'
import { createSceneSlice, type SceneSlice } from './sceneSlice'
import { createUiSlice, type UiSlice } from './uiSlice'

export type AppState = SceneSlice & UiSlice & BuildSlice & LabSlice

export const useStore = create<AppState>()((...args) => ({
  ...createSceneSlice(...args),
  ...createUiSlice(...args),
  ...createBuildSlice(...args),
  ...createLabSlice(...args),
}))
