import { create } from 'zustand'
import { type BuildSlice, createBuildSlice } from './buildSlice'
import { createLabSlice, type LabSlice } from './labSlice'
import { createSceneSlice, type SceneSlice } from './sceneSlice'
import { createTutorSlice, type TutorSlice } from './tutorSlice'
import { createUiSlice, type UiSlice } from './uiSlice'
import { createViewSlice, type ViewSlice } from './viewSlice'

export type AppState = SceneSlice & UiSlice & BuildSlice & LabSlice & TutorSlice & ViewSlice

export const useStore = create<AppState>()((...args) => ({
  ...createSceneSlice(...args),
  ...createUiSlice(...args),
  ...createBuildSlice(...args),
  ...createLabSlice(...args),
  ...createTutorSlice(...args),
  ...createViewSlice(...args),
}))
