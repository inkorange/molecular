'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { Vector3 } from 'three'
import { useStore } from '@/src/store'

const tmpPos = new Vector3()
const tmpTarget = new Vector3()
// Throttle camera-sync writes to ~10Hz so we don't churn store every frame.
const SYNC_INTERVAL_MS = 100
// Skip the write entirely if neither vector moved more than this much
// in world units since last sync. Cuts noise from sub-pixel float drift.
const SYNC_EPS = 0.0005

/**
 * Reads camera position + OrbitControls target each frame and (throttled,
 * change-gated) writes them into the view slice. The Share button reads
 * `view.currentView` to capture exactly where the user is looking.
 */
export function CameraSync() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as { target?: Vector3 } | null
  const setCurrentView = useStore((s) => s.setCurrentView)
  const lastWriteAt = useRef(0)
  const lastPos = useRef<[number, number, number] | null>(null)
  const lastTarget = useRef<[number, number, number] | null>(null)

  useFrame(() => {
    const now = performance.now()
    if (now - lastWriteAt.current < SYNC_INTERVAL_MS) return
    camera.getWorldPosition(tmpPos)
    const target = controls?.target ?? tmpTarget.set(0, 0, 0)
    const pos: [number, number, number] = [tmpPos.x, tmpPos.y, tmpPos.z]
    const tgt: [number, number, number] = [target.x, target.y, target.z]
    if (
      lastPos.current &&
      lastTarget.current &&
      Math.abs(pos[0] - lastPos.current[0]) < SYNC_EPS &&
      Math.abs(pos[1] - lastPos.current[1]) < SYNC_EPS &&
      Math.abs(pos[2] - lastPos.current[2]) < SYNC_EPS &&
      Math.abs(tgt[0] - lastTarget.current[0]) < SYNC_EPS &&
      Math.abs(tgt[1] - lastTarget.current[1]) < SYNC_EPS &&
      Math.abs(tgt[2] - lastTarget.current[2]) < SYNC_EPS
    ) {
      return
    }
    lastWriteAt.current = now
    lastPos.current = pos
    lastTarget.current = tgt
    setCurrentView({ position: pos, target: tgt })
  })

  return null
}
