'use client'

import { useMemo } from 'react'
import { Quaternion, Vector3, type Vector3Tuple } from 'three'

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
  const { center, length, quaternion, perpendicular } = useMemo(() => {
    const s = new Vector3(...start)
    const e = new Vector3(...end)
    const dir = e.clone().sub(s)
    const len = dir.length()
    const midpoint = s.clone().add(e).multiplyScalar(0.5)

    // Quaternion that rotates the cylinder's +Y axis to point along the bond direction.
    // setFromUnitVectors handles the degenerate (parallel / anti-parallel) cases.
    const up = new Vector3(0, 1, 0)
    const dirNorm = dir.clone().normalize()
    const quat = new Quaternion().setFromUnitVectors(up, dirNorm)

    // Perpendicular vector in a plane orthogonal to the bond, used to offset double/triple bonds.
    // Cross of Y with dirNorm; if degenerate (bond runs along Y), fall back to X.
    const axisCross = new Vector3().crossVectors(up, dirNorm)
    const perp = axisCross.lengthSq() > 0.001 ? axisCross.clone().normalize() : new Vector3(1, 0, 0)

    return {
      center: midpoint.toArray() as Vector3Tuple,
      length: len,
      quaternion: [quat.x, quat.y, quat.z, quat.w] as [number, number, number, number],
      perpendicular: perp.toArray() as Vector3Tuple,
    }
  }, [start, end])

  const offsets = order === 1 ? [0] : order === 2 ? [-GAP, GAP] : [-GAP * 1.4, 0, GAP * 1.4]

  if (type === 'ionic') {
    return (
      <mesh position={center} quaternion={quaternion}>
        <cylinderGeometry args={[RADIUS * 0.5, RADIUS * 0.5, length, 24]} />
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
          quaternion={quaternion}
        >
          <cylinderGeometry args={[RADIUS, RADIUS, length, 32]} />
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
