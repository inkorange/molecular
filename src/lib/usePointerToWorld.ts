'use client'

import { useThree } from '@react-three/fiber'
import { useCallback } from 'react'
import { Plane, Raycaster, Vector2, Vector3 } from 'three'

/**
 * Returns a function that takes a screen-space (clientX, clientY) pointer
 * position and projects it onto a plane through the world origin facing the
 * camera. Used by drag tools to keep ghost atoms / cursors anchored to
 * meaningful 3D coordinates as the user moves their pointer.
 *
 * The plane is recomputed each call from the camera's current direction —
 * so as the user orbits, the placement plane reorients to face them.
 */
export function usePointerToWorld() {
  const { camera, gl } = useThree()

  return useCallback(
    (clientX: number, clientY: number): [number, number, number] | null => {
      const rect = gl.domElement.getBoundingClientRect()
      const ndc = new Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      )
      const raycaster = new Raycaster()
      raycaster.setFromCamera(ndc, camera)
      const camForward = new Vector3()
      camera.getWorldDirection(camForward)
      const plane = new Plane(camForward.clone().multiplyScalar(-1), 0)
      const hit = new Vector3()
      const ok = raycaster.ray.intersectPlane(plane, hit)
      if (!ok) return null
      return [hit.x, hit.y, hit.z]
    },
    [camera, gl],
  )
}
