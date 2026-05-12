'use client'

import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import type { PerspectiveCamera, Vector3 } from 'three'
import { useStore } from '@/src/store'

interface OrbitLike {
  target: Vector3
  update: () => void
}

/**
 * Watches the scene's atom set and, whenever it changes, refits the camera
 * so the molecule's bounding sphere fits the viewport. Preserves the user's
 * current viewing angle — only resets distance and target.
 */
export function CameraFit() {
  const atoms = useStore((s) => s.scene.atoms)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null

  useEffect(() => {
    if (!controls) return
    const atomList = Object.values(atoms)
    if (atomList.length === 0) return

    // Axis-aligned bounding box across atom centers.
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    let minZ = Infinity
    let maxZ = -Infinity
    for (const a of atomList) {
      const [x, y, z] = a.position
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      if (z < minZ) minZ = z
      if (z > maxZ) maxZ = z
    }
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const cz = (minZ + maxZ) / 2
    const sx = maxX - minX
    const sy = maxY - minY
    const sz = maxZ - minZ
    const halfDiag = Math.sqrt(sx * sx + sy * sy + sz * sz) / 2
    // +1.5 pads for atom visual radii + breathing room; max(_,2) keeps a single atom framed.
    const sphereRadius = Math.max(halfDiag + 1.5, 2)

    // Distance to fit the sphere in BOTH vertical and horizontal FOV.
    const fovV = (camera.fov * Math.PI) / 180
    const aspect = camera.aspect || 1
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspect)
    const distV = sphereRadius / Math.sin(fovV / 2)
    const distH = sphereRadius / Math.sin(fovH / 2)
    const distance = Math.max(distV, distH) * 1.15

    // Preserve current viewing direction; only reset distance and target.
    const target = controls.target.clone()
    const dir = camera.position.clone().sub(target)
    if (dir.lengthSq() < 0.0001) dir.set(0, 0, 1)
    dir.normalize()

    controls.target.set(cx, cy, cz)
    camera.position.set(cx + dir.x * distance, cy + dir.y * distance, cz + dir.z * distance)
    controls.update()
  }, [atoms, camera, controls])

  return null
}
