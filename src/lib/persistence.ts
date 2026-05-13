import type { SceneSnapshot } from '@/src/chem/types'
import { deserializeScene, serializeScene } from './serializeScene'

const KEY_CURRENT = 'molecular:current-scene'
const KEY_CREATIONS = 'molecular:my-creations'

/**
 * Auto-save the current scene to localStorage. Failures (full quota,
 * private-mode browsers that throw on setItem, etc.) are swallowed —
 * the in-memory scene is the source of truth, persistence is best-effort.
 */
export function saveCurrent(scene: SceneSnapshot): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY_CURRENT, serializeScene(scene))
  } catch {
    // ignore
  }
}

export function loadCurrent(): SceneSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(KEY_CURRENT)
    if (!v) return null
    return deserializeScene(v)
  } catch {
    return null
  }
}

export interface SavedCreation {
  name: string
  ts: number
  /** Serialized scene JSON. Kept as a string so the index payload stays
   *  compact and we don't pay decode cost for entries we never load. */
  scene: string
}

export function listCreations(): SavedCreation[] {
  if (typeof window === 'undefined') return []
  try {
    const v = window.localStorage.getItem(KEY_CREATIONS)
    return v ? (JSON.parse(v) as SavedCreation[]) : []
  } catch {
    return []
  }
}

export function saveCreation(name: string, scene: SceneSnapshot): void {
  if (typeof window === 'undefined') return
  const list = listCreations()
  list.push({ name, ts: Date.now(), scene: serializeScene(scene) })
  try {
    window.localStorage.setItem(KEY_CREATIONS, JSON.stringify(list))
  } catch {
    // ignore
  }
}
