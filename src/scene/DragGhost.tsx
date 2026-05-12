'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { Group } from 'three'
import { usePointerToWorld } from '@/src/lib/usePointerToWorld'
import { useStore } from '@/src/store'
import { Atom } from './Atom'

/**
 * Renders a translucent atom that tracks the user's pointer in world space
 * while `build.heldZ` is non-null. As the user moves the cursor over the canvas,
 * the ghost projects onto the camera-facing plane through the origin and
 * scales up smoothly from 0 → 1 over ~200 ms so the pickup reads as a "hatch".
 */
export function DragGhost() {
  const heldZ = useStore((s) => s.build.heldZ)
  const pointer = useStore((s) => s.build.pointerWorld)
  const updatePointer = useStore((s) => s.updatePointer)
  const groupRef = useRef<Group>(null)
  const tween = useRef({ scale: 0 })
  const { gl } = useThree()
  const screenToWorld = usePointerToWorld()

  // Track pointer movement on the canvas while something is held. Also update
  // on pointerdown so touch taps (which have no preceding move) commit at the
  // correct position.
  useEffect(() => {
    if (heldZ === null) return
    const el = gl.domElement
    function onPointer(e: PointerEvent) {
      const w = screenToWorld(e.clientX, e.clientY)
      if (w) updatePointer(w)
    }
    el.addEventListener('pointermove', onPointer)
    el.addEventListener('pointerdown', onPointer)
    return () => {
      el.removeEventListener('pointermove', onPointer)
      el.removeEventListener('pointerdown', onPointer)
    }
  }, [heldZ, gl, screenToWorld, updatePointer])

  // Reset the scale tween every time a new element is picked up. heldZ is the
  // dependency intentionally — the effect body doesn't read it, but we want to
  // restart the hatch-in animation on each fresh pickup.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run on each pickup
  useEffect(() => {
    tween.current.scale = 0
  }, [heldZ])

  useFrame((_, delta) => {
    if (heldZ === null) return
    if (tween.current.scale < 1) {
      tween.current.scale = Math.min(1, tween.current.scale + delta * 5)
    }
    if (groupRef.current) {
      groupRef.current.scale.setScalar(tween.current.scale)
    }
  })

  if (heldZ === null || !pointer) return null

  return (
    <group ref={groupRef} position={pointer}>
      <Atom Z={heldZ} position={[0, 0, 0]} opacity={0.65} showLabel={false} />
    </group>
  )
}
