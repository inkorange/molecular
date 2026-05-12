'use client'

import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import { getElement } from '@/src/chem/elements'
import { freeCapacity } from '@/src/chem/rules'
import type { AtomId } from '@/src/chem/types'
import { useStore } from '@/src/store'

/**
 * Renders an HTML menu above the currently-selected atom while the user has
 * nothing held in Build mode. Offers two actions: detach all bonds (atom
 * stays, becomes a free-floating singleton in a new molecule) and delete
 * atom (atom + its bonds removed entirely).
 *
 * Lives inside the scene tree so it can anchor to a real 3D position via
 * drei's <Html>. Always faces the viewport (screen-space overlay).
 */
export function SelectionMenu() {
  const scene = useStore((s) => s.scene)
  const heldZ = useStore((s) => s.build.heldZ)
  const connectingFromAtomId = useStore((s) => s.build.connectingFromAtomId)
  const setSelection = useStore((s) => s.setSelection)
  const removeAtom = useStore((s) => s.removeAtom)
  const removeBond = useStore((s) => s.removeBond)
  const startConnecting = useStore((s) => s.startConnecting)

  const selected = scene.selection ? scene.atoms[scene.selection as string] : null

  const connectedBondIds = useMemo(() => {
    if (!selected) return [] as string[]
    return Object.values(scene.bonds)
      .filter((b) => b.atomA === selected.id || b.atomB === selected.id)
      .map((b) => b.id)
  }, [scene.bonds, selected])

  // Only available in Build mode with nothing held, and not while
  // we're already in connecting mode (the source atom's ring is the UI then).
  if (!selected || heldZ !== null || scene.mode !== 'build' || connectingFromAtomId !== null)
    return null

  const el = getElement(selected.Z)
  const labelOffsetY = 0.55
  const selectedFreeCapacity = freeCapacity(selected.id, scene.atoms, scene.bonds)
  // Need at least one free bond slot AND at least one other atom in the scene
  // to offer the connect action.
  const canConnect = selectedFreeCapacity >= 1 && Object.keys(scene.atoms).length > 1

  function detach() {
    for (const id of connectedBondIds) removeBond(id as never)
  }
  function deleteAtom() {
    if (!selected) return
    removeAtom(selected.id as AtomId)
    setSelection(null)
  }
  function connect() {
    if (!selected) return
    startConnecting(selected.id)
  }
  function close() {
    setSelection(null)
  }

  return (
    <Html
      position={[selected.position[0], selected.position[1] + labelOffsetY, selected.position[2]]}
      center
      zIndexRange={[200, 100]}
      style={{ pointerEvents: 'auto' }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation wrapper, not interactive itself */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: wrapper exists only to swallow pointer events */}
      <div
        className="flex flex-col gap-1 rounded-md border border-[#5cc6ff]/40 bg-[#0d0a22]/95 p-2 shadow-lg backdrop-blur"
        style={{ minWidth: 150 }}
        // Stop pointer events from bubbling out of the portal back through the
        // React tree to the canvas, where DropCatcher would clear the selection.
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between px-1 pb-1 text-xs">
          <span className="font-bold text-[#dffaff]">{el.symbol}</span>
          <span className="text-[10px] text-[#9aa0c8]">
            {connectedBondIds.length} bond{connectedBondIds.length === 1 ? '' : 's'}
          </span>
        </div>
        {canConnect && (
          <button
            type="button"
            onClick={connect}
            className="min-h-[32px] rounded-md bg-[#14112e] px-3 py-1 text-left text-xs text-[#dffaff] hover:bg-[#1a163a]"
          >
            Connect to atom…
          </button>
        )}
        {connectedBondIds.length > 0 && (
          <button
            type="button"
            onClick={detach}
            className="min-h-[32px] rounded-md bg-[#14112e] px-3 py-1 text-left text-xs text-[#dffaff] hover:bg-[#1a163a]"
          >
            Detach all bonds
          </button>
        )}
        <button
          type="button"
          onClick={deleteAtom}
          className="min-h-[32px] rounded-md bg-[#5a1f1f] px-3 py-1 text-left text-xs text-[#ffb8b8] hover:bg-[#6f2929]"
        >
          Delete atom
        </button>
        <button
          type="button"
          onClick={close}
          className="min-h-[28px] rounded-md px-3 py-1 text-left text-[10px] text-[#9aa0c8] hover:bg-[#1a163a]"
        >
          Close
        </button>
      </div>
    </Html>
  )
}
