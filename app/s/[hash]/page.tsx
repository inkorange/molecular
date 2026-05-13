'use client'

import { use, useEffect } from 'react'
import { deserializeScene } from '@/src/lib/serializeScene'
import { decodeFromHash } from '@/src/lib/shareUrl'
import { useStore } from '@/src/store'
import { AppShell } from '../../app/AppShell'

/**
 * Shared-scene route. The `[hash]` segment is base64url(pako-deflate(JSON)).
 * On mount we decode it back into a SceneSnapshot and hydrate the store
 * before AppShell mounts the canvas. A decode failure logs and falls
 * through to AppShell's own first-mount spawn (water default).
 */
export default function SharedScenePage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params)
  const resetScene = useStore((s) => s.resetScene)
  const addAtom = useStore((s) => s.addAtom)
  const addBond = useStore((s) => s.addBond)
  const addMolecule = useStore((s) => s.addMolecule)

  useEffect(() => {
    try {
      const json = decodeFromHash(hash)
      const scene = deserializeScene(json)
      // Reset wipes whatever might be in-memory from a stale visit. Order
      // matters: molecules first so atom.moleculeId references land in an
      // existing molecule entry; atoms next; bonds last (need both atoms).
      resetScene()
      for (const m of Object.values(scene.molecules)) addMolecule(m)
      for (const a of Object.values(scene.atoms)) addAtom(a)
      for (const b of Object.values(scene.bonds)) addBond(b)
    } catch (err) {
      console.error('Failed to decode shared scene', err)
    }
  }, [hash, resetScene, addAtom, addBond, addMolecule])

  return <AppShell />
}
