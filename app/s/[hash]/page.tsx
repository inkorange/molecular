'use client'

import { use, useEffect } from 'react'
import { deserializeScene } from '@/src/lib/serializeScene'
import { decodeFromHash } from '@/src/lib/shareUrl'
import { useStore } from '@/src/store'
import type { CameraView } from '@/src/store/viewSlice'
import { AppShell } from '../../app/AppShell'

interface SharePayload {
  /** Serialized scene JSON (output of serializeScene). */
  scene: string
  /** Camera position + OrbitControls target captured at share time. */
  view: CameraView | null
}

/**
 * Decode a share-URL payload. Accepts two shapes for backwards-compat:
 *   1. Envelope `{ scene: "<json>", view: {...} | null }` — current format
 *      that pairs the scene with the sender's camera angle.
 *   2. Bare serialized-scene JSON — the original Phase 8 format, before
 *      we started capturing camera state. Identifiable by the top-level
 *      `atoms` key.
 */
function parsePayload(raw: string): SharePayload {
  const parsed = JSON.parse(raw) as Partial<SharePayload> & { atoms?: unknown }
  if (typeof parsed.scene === 'string') {
    return { scene: parsed.scene, view: parsed.view ?? null }
  }
  // Legacy: the whole `raw` was the serialized scene.
  return { scene: raw, view: null }
}

/**
 * Shared-scene route. The `[hash]` segment is base64url(pako-deflate(JSON)).
 * On mount we decode the payload, hydrate the store, and stamp a pending
 * camera view (consumed by CameraApply inside the R3F canvas) so the
 * recipient lands at the sender's exact angle and zoom. A decode failure
 * logs and falls through to AppShell's own first-mount spawn.
 */
export default function SharedScenePage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params)
  const resetScene = useStore((s) => s.resetScene)
  const addAtom = useStore((s) => s.addAtom)
  const addBond = useStore((s) => s.addBond)
  const addMolecule = useStore((s) => s.addMolecule)
  const setPendingView = useStore((s) => s.setPendingView)

  useEffect(() => {
    try {
      const raw = decodeFromHash(hash)
      const { scene: sceneJson, view } = parsePayload(raw)
      const scene = deserializeScene(sceneJson)
      // Reset wipes whatever might be in-memory from a stale visit. Order
      // matters: molecules first so atom.moleculeId references land in an
      // existing molecule entry; atoms next; bonds last (need both atoms).
      resetScene()
      for (const m of Object.values(scene.molecules)) addMolecule(m)
      for (const a of Object.values(scene.atoms)) addAtom(a)
      for (const b of Object.values(scene.bonds)) addBond(b)
      if (view) setPendingView(view)
    } catch (err) {
      console.error('Failed to decode shared scene', err)
    }
  }, [hash, resetScene, addAtom, addBond, addMolecule, setPendingView])

  return <AppShell />
}
