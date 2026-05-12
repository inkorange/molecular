'use client'

import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group, Vector3Tuple } from 'three'
import { getElement } from '@/src/chem/elements'
import { ElectronSprite } from './ElectronSprite'

interface AtomProps {
  Z: number
  position: Vector3Tuple
  showLabel?: boolean
  scale?: number
  /** For drag preview: 0..1 opacity multiplier on the nucleus. */
  opacity?: number
}

interface ShellPlan {
  id: string
  radius: number
  tilt: [number, number, number]
  speed: number
  electrons: number
  isValence: boolean
}

const NUCLEUS_RADIUS = 0.3
const SHELL_RADIUS_BASE = 0.5
const SHELL_RADIUS_STEP = 0.18
const MAX_ELECTRONS_VISIBLE = 8

export function Atom({ Z, position, showLabel = true, scale = 1, opacity = 1 }: AtomProps) {
  const el = getElement(Z)
  const groupRef = useRef<Group>(null)
  const shellRefs = useRef<Group[]>([])

  const shells: ShellPlan[] = useMemo(() => {
    return el.shells.map((electronCount, index) => {
      const tiltX = ((index * 37) % 60) - 30
      const tiltZ = ((index * 53) % 60) - 30
      return {
        id: `shell-${index}`,
        radius: SHELL_RADIUS_BASE + index * SHELL_RADIUS_STEP,
        tilt: [(tiltX * Math.PI) / 180, 0, (tiltZ * Math.PI) / 180],
        speed: 1.5 - index * 0.2,
        electrons: Math.min(electronCount, MAX_ELECTRONS_VISIBLE),
        isValence: index === el.shells.length - 1,
      }
    })
  }, [el.shells])

  useFrame((_, delta) => {
    for (let i = 0; i < shellRefs.current.length; i++) {
      const ref = shellRefs.current[i]
      const plan = shells[i]
      if (!ref || !plan) continue
      ref.rotation.y += delta * plan.speed
    }
  })

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[NUCLEUS_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color={el.cpkColor}
          emissive={el.cpkColor}
          emissiveIntensity={0.4}
          roughness={0.35}
          metalness={0.1}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Label */}
      {showLabel && (
        <Billboard>
          <Text
            fontSize={0.22}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            {el.symbol}
          </Text>
        </Billboard>
      )}

      {/* Electron shells */}
      {shells.map((plan, shellIndex) => {
        const electronPositions = Array.from({ length: plan.electrons }, (_, i) => {
          const angle = (i / plan.electrons) * Math.PI * 2
          return {
            id: `${plan.id}-e${i}`,
            position: [
              Math.cos(angle) * plan.radius,
              0,
              Math.sin(angle) * plan.radius,
            ] as Vector3Tuple,
          }
        })
        return (
          <group
            key={plan.id}
            ref={(g) => {
              if (g) shellRefs.current[shellIndex] = g
            }}
            rotation={plan.tilt}
          >
            {electronPositions.map((e) => (
              <ElectronSprite
                key={e.id}
                position={e.position}
                scale={plan.isValence ? 0.1 : 0.07}
                color={plan.isValence ? '#fff5b8' : '#ffd97a'}
              />
            ))}
          </group>
        )
      })}
    </group>
  )
}
