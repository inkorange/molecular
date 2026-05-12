'use client'

import { useMemo } from 'react'
import { Vector3, type Vector3Tuple } from 'three'

interface BondProps {
  start: Vector3Tuple
  end: Vector3Tuple
  order: 1 | 2 | 3
  color?: string
  type?: 'covalent' | 'ionic'
}

const RADIUS = 0.06
const GAP = 0.08

export function Bond({ start, end, order, color = '#bfeaff', type = 'covalent' }: BondProps) {
  const { center, length, rotation, perpendicular } = useMemo(() => {
    const s = new Vector3(...start)
    const e = new Vector3(...end)
    const dir = e.clone().sub(s)
    const len = dir.length()
    const midpoint = s.clone().add(e).multiplyScalar(0.5)
    // Cylinder default axis is Y; rotate to align with dir.
    const up = new Vector3(0, 1, 0)
    const dirNorm = dir.clone().normalize()
    const axis = new Vector3().crossVectors(up, dirNorm)
    const angle = Math.acos(up.dot(dirNorm))
    const rot: Vector3Tuple = [axis.x * angle, axis.y * angle, axis.z * angle]

    // Perpendicular vector in the plane (used to offset double/triple bonds).
    const perp = axis.lengthSq() > 0.001 ? axis.clone().normalize() : new Vector3(1, 0, 0)

    return {
      center: midpoint.toArray() as Vector3Tuple,
      length: len,
      rotation: rot,
      perpendicular: perp.toArray() as Vector3Tuple,
    }
  }, [start, end])

  const offsets = order === 1 ? [0] : order === 2 ? [-GAP, GAP] : [-GAP * 1.4, 0, GAP * 1.4]

  if (type === 'ionic') {
    // Slimmer, greenish line for ionic — single cylinder placeholder.
    return (
      <mesh position={center} rotation={rotation}>
        <cylinderGeometry args={[RADIUS * 0.5, RADIUS * 0.5, length, 8]} />
        <meshBasicMaterial color="#a4ff8c" transparent opacity={0.35} />
      </mesh>
    )
  }

  return (
    <>
      {offsets.map((offset) => (
        <mesh
          key={`offset-${offset}`}
          position={[
            center[0] + perpendicular[0] * offset,
            center[1] + perpendicular[1] * offset,
            center[2] + perpendicular[2] * offset,
          ]}
          rotation={rotation}
        >
          <cylinderGeometry args={[RADIUS, RADIUS, length, 12]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            roughness={0.4}
          />
        </mesh>
      ))}
    </>
  )
}
