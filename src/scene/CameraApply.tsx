'use client'

import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import type { Vector3 } from 'three'
import { useStore } from '@/src/store'

/**
 * Consumes view.pendingView (set when loading a shared scene URL) and
 * applies it to the live camera + OrbitControls target imperatively.
 * Clears the pending state after applying so it's strictly a one-shot.
 *
 * Runs INSIDE the R3F canvas so we have direct access to camera + controls.
 */
export function CameraApply() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as { target: Vector3; update?: () => void } | null
  const pendingView = useStore((s) => s.view.pendingView)
  const setPendingView = useStore((s) => s.setPendingView)

  useEffect(() => {
    if (!pendingView) return
    camera.position.set(...pendingView.position)
    if (controls) {
      controls.target.set(...pendingView.target)
      controls.update?.()
    }
    camera.lookAt(...pendingView.target)
    setPendingView(null)
  }, [pendingView, camera, controls, setPendingView])

  return null
}
