'use client'

import { BackSide } from 'three'
import { atomId as makeAtomId, moleculeId as makeMoleculeId } from '@/src/chem/types'
import { useStore } from '@/src/store'

/**
 * Background click catcher for the 3D scene.
 *
 * Handles three background-click behaviors in priority order:
 *
 *   1. Held element in Build mode → drop a free-floating atom at the pointer's
 *      projected world position. The atom becomes its own molecule (no bond).
 *   2. Connecting-mode in Build mode → cancel the pending connection.
 *   3. An atom is selected (Build mode) → clear the selection.
 *
 * Renders a huge invisible sphere centered at the origin. Closer meshes (atom
 * nuclei, attach-point dots) intercept clicks first and call `stopPropagation`,
 * so this only fires for clicks that land on genuinely empty space.
 */
export function DropCatcher() {
  const heldZ = useStore((s) => s.build.heldZ)
  const selection = useStore((s) => s.scene.selection)
  const connectingFromAtomId = useStore((s) => s.build.connectingFromAtomId)
  const mode = useStore((s) => s.scene.mode)
  const addAtom = useStore((s) => s.addAtom)
  const addMolecule = useStore((s) => s.addMolecule)
  const clearHeld = useStore((s) => s.clearHeld)
  const cancelConnecting = useStore((s) => s.cancelConnecting)
  const setSelection = useStore((s) => s.setSelection)

  const heldActive = heldZ !== null
  const connectingActive = mode === 'build' && connectingFromAtomId !== null
  const selectionActive = mode === 'build' && selection !== null

  if (!heldActive && !connectingActive && !selectionActive) return null

  function handleClick() {
    const state = useStore.getState()
    if (state.build.heldZ !== null) {
      const Z = state.build.heldZ
      const pos = state.build.pointerWorld
      if (!pos) return
      const newMolId = makeMoleculeId()
      const newAtomId = makeAtomId()
      addMolecule({ id: newMolId, atomIds: [newAtomId], bondIds: [] })
      addAtom({
        id: newAtomId,
        Z,
        position: pos,
        velocity: [0, 0, 0],
        charge: 0,
        moleculeId: newMolId,
      })
      clearHeld()
      return
    }
    if (state.build.connectingFromAtomId !== null) {
      cancelConnecting()
      return
    }
    if (state.scene.selection) {
      setSelection(null)
    }
  }

  // `onClick` (not `onPointerDown`) so closer atom meshes that call
  // stopPropagation on their own onClick suppress this fallback cleanly.
  // pointerdown would fire on EVERY intersected mesh, prematurely cancelling
  // connecting state before the actual atom click had a chance to handle it.
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: <mesh> is a Three.js scene element, not a DOM element
    <mesh onClick={handleClick}>
      <sphereGeometry args={[500, 8, 8]} />
      <meshBasicMaterial transparent opacity={0} side={BackSide} depthWrite={false} />
    </mesh>
  )
}
