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

const NUCLEUS_RADIUS = 0.2
const SHELL_RADIUS_BASE = 0.4
const SHELL_RADIUS_STEP = 0.18
const MAX_ELECTRONS_VISIBLE = 8
// Each electron renders as a trailing arc of sprites to give the impression
// of speed + motion blur. TRAIL_LENGTH includes the head sprite at full opacity.
const TRAIL_LENGTH = 8
const TRAIL_ARC = Math.PI / 3 // span of the trail in radians (60°)

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
        // Super-fast orbits; inner shells fastest, outer slower but still rapid.
        speed: 9 - index * 1.2,
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

      {/* Electron shells — each electron is a trail of fading, slightly-blurred
          sprites along an arc behind its head position, suggesting motion. */}
      {shells.map((plan, shellIndex) => {
        const baseScale = plan.isValence ? 0.11 : 0.08
        const color = plan.isValence ? '#fff5b8' : '#ffd97a'
        const trailSprites: Array<{
          id: string
          position: Vector3Tuple
          scale: number
          opacity: number
        }> = []
        for (let i = 0; i < plan.electrons; i++) {
          const headAngle = (i / plan.electrons) * Math.PI * 2
          for (let k = 0; k < TRAIL_LENGTH; k++) {
            // k=0 is the head (full opacity); higher k = further behind & dimmer.
            const angle = headAngle - (k / TRAIL_LENGTH) * TRAIL_ARC
            const fade = 1 - k / TRAIL_LENGTH
            trailSprites.push({
              id: `${plan.id}-e${i}-t${k}`,
              position: [Math.cos(angle) * plan.radius, 0, Math.sin(angle) * plan.radius],
              // Trail sprites grow slightly to read as motion blur.
              scale: baseScale * (1 + k * 0.18),
              // Opacity tapers exponentially toward the tail.
              opacity: 0.18 + 0.82 * fade ** 1.6,
            })
          }
        }
        return (
          <group
            key={plan.id}
            ref={(g) => {
              if (g) shellRefs.current[shellIndex] = g
            }}
            rotation={plan.tilt}
          >
            {trailSprites.map((s) => (
              <ElectronSprite
                key={s.id}
                position={s.position}
                scale={s.scale}
                color={color}
                opacity={s.opacity}
              />
            ))}
          </group>
        )
      })}
    </group>
  )
}
