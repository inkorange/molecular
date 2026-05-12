'use client'

import { useThree } from '@react-three/fiber'
import { useCallback } from 'react'
import { Plane, Raycaster, Vector2, Vector3 } from 'three'

/**
 * Returns a function that takes a screen-space (clientX, clientY) pointer
 * position and projects it onto a plane facing the camera. By default the
 * plane passes through the world origin; pass an `anchor` to project through
 * a specific world point instead (used when dragging an existing atom at its
 * current depth).
 *
 * The plane is recomputed each call from the camera's current direction —
 * so as the user orbits, the placement plane reorients to face them.
 */
export function usePointerToWorld() {
  const { camera, gl } = useThree()

  return useCallback(
    (
      clientX: number,
      clientY: number,
      anchor?: readonly [number, number, number],
    ): [number, number, number] | null => {
      const rect = gl.domElement.getBoundingClientRect()
      const ndc = new Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      )
      const raycaster = new Raycaster()
      raycaster.setFromCamera(ndc, camera)
      const camForward = new Vector3()
      camera.getWorldDirection(camForward)
      // Plane normal points back toward the camera; constant placed so the
      // plane passes through `anchor` (or origin when omitted).
      const normal = camForward.clone().multiplyScalar(-1)
      const anchorVec = anchor ? new Vector3(anchor[0], anchor[1], anchor[2]) : new Vector3()
      const constant = -normal.dot(anchorVec)
      const plane = new Plane(normal, constant)
      const hit = new Vector3()
      const ok = raycaster.ray.intersectPlane(plane, hit)
      if (!ok) return null
      return [hit.x, hit.y, hit.z]
    },
    [camera, gl],
  )
}
