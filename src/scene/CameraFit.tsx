'use client'

import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import type { PerspectiveCamera, Vector3 } from 'three'
import { useStore } from '@/src/store'

interface OrbitLike {
  target: Vector3
  update: () => void
  minDistance: number
  maxDistance: number
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
    // Effective radius is half the LONGEST axis of the AABB plus a pad for atom
    // visual radii. Using the space-diagonal here would over-inflate elongated
    // molecules (e.g. glucose) and push the camera unnecessarily far away.
    const maxAxis = Math.max(sx, sy, sz)
    const sphereRadius = Math.max(maxAxis / 2 + 1.0, 1.5)

    const fovV = (camera.fov * Math.PI) / 180
    const aspect = camera.aspect || 1
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspect)
    // Default framing: molecule diameter as a fraction of viewport WIDTH.
    //   2R = ratio * (2 * D * tan(hFov/2))  →  D = R / (ratio * tan(hFov/2))
    // Portrait viewports (mobile) zoom tighter — molecule fills 88% of the width.
    // Landscape viewports use 75% so there's room for the toolbar / drawer overlays.
    const widthRatio = aspect < 1 ? 0.88 : 0.75
    const distance = sphereRadius / (widthRatio * Math.tan(fovH / 2))

    // Preserve current viewing direction; only reset distance and target.
    const target = controls.target.clone()
    const dir = camera.position.clone().sub(target)
    if (dir.lengthSq() < 0.0001) dir.set(0, 0, 1)
    dir.normalize()

    controls.target.set(cx, cy, cz)
    camera.position.set(cx + dir.x * distance, cy + dir.y * distance, cz + dir.z * distance)

    // Max zoom-out: distance at which the molecule's bounding-sphere DIAMETER
    // fills half the screen width. Beyond this, the user would see < 50% of
    // their viewport occupied by the molecule.
    //   screenWidth(D) = 2 * D * tan(hFov/2)
    //   want 2R >= 0.5 * screenWidth → D <= 2R / tan(hFov/2)
    const maxZoomOut = (2 * sphereRadius) / Math.tan(fovH / 2)
    // Allow a hair past the auto-fit so the initial frame isn't pinned to the wall.
    controls.maxDistance = Math.max(maxZoomOut, distance + 1)
    controls.update()
  }, [atoms, camera, controls])

  return null
}
