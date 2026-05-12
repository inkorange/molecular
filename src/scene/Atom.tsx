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

interface ElectronPlan {
  id: string
  radius: number
  tilt: [number, number, number]
  phaseOffset: number
  // Signed rotation speed in rad/s. Sign controls direction (cw / ccw).
  speed: number
  isValence: boolean
}

const NUCLEUS_RADIUS = 0.2
const SHELL_RADIUS_BASE = 0.32
const SHELL_RADIUS_STEP = 0.16
const MAX_ELECTRONS_VISIBLE = 8
// Each electron renders as a trailing arc of sprites to give the impression
// of speed + motion blur. TRAIL_LENGTH includes the head sprite at full opacity.
const TRAIL_LENGTH = 10
const TRAIL_ARC = Math.PI / 2.5 // span of the trail in radians (72°)

export function Atom({ Z, position, showLabel = true, scale = 1, opacity = 1 }: AtomProps) {
  const el = getElement(Z)
  const groupRef = useRef<Group>(null)
  const electronRefs = useRef<Group[]>([])

  const electronPlans: ElectronPlan[] = useMemo(() => {
    const plans: ElectronPlan[] = []
    let globalIdx = 0
    for (let shellIdx = 0; shellIdx < el.shells.length; shellIdx++) {
      const shellSize = el.shells[shellIdx] ?? 0
      const electronsInShell = Math.min(shellSize, MAX_ELECTRONS_VISIBLE)
      const radius = SHELL_RADIUS_BASE + shellIdx * SHELL_RADIUS_STEP
      const isValence = shellIdx === el.shells.length - 1
      for (let i = 0; i < electronsInShell; i++) {
        // Deterministic per-electron variation via prime-product hashing:
        // each electron gets its own tilt, starting phase, and signed speed.
        const tiltXDeg = ((globalIdx * 47 + 17) % 180) - 90
        const tiltZDeg = ((globalIdx * 73 + 31) % 180) - 90
        const phaseOffset = (((globalIdx * 137) % 360) * Math.PI) / 180
        const direction = globalIdx % 2 === 0 ? 1 : -1
        // Speeds range ~5..11 rad/s, signed.
        const speed = (5 + ((globalIdx * 13) % 60) / 10) * direction
        plans.push({
          id: `e-${globalIdx}`,
          radius,
          tilt: [(tiltXDeg * Math.PI) / 180, 0, (tiltZDeg * Math.PI) / 180],
          phaseOffset,
          speed,
          isValence,
        })
        globalIdx++
      }
    }
    return plans
  }, [el.shells])

  useFrame((_, delta) => {
    for (let i = 0; i < electronRefs.current.length; i++) {
      const ref = electronRefs.current[i]
      const plan = electronPlans[i]
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

      {/* Per-electron orbits: each electron has its own group with its own tilt,
          starting phase, and signed rotation speed. The trail of fading sprites
          rides with the electron's group. */}
      {electronPlans.map((plan, idx) => {
        const baseScale = plan.isValence ? 0.04 : 0.03
        const color = plan.isValence ? '#fff5b8' : '#ffd97a'
        const trailSprites = Array.from({ length: TRAIL_LENGTH }, (_, k) => {
          // k=0 is the head at +X on the orbital ring; higher k = behind the head.
          const angle = -(k / TRAIL_LENGTH) * TRAIL_ARC
          const fade = 1 - k / TRAIL_LENGTH
          return {
            id: `${plan.id}-t${k}`,
            position: [
              Math.cos(angle) * plan.radius,
              0,
              Math.sin(angle) * plan.radius,
            ] as Vector3Tuple,
            // Trail sprites grow very slightly to read as motion blur.
            scale: baseScale * (1 + k * 0.1),
            // Cap head opacity at 50% and taper exponentially toward the tail.
            opacity: (0.18 + 0.82 * fade ** 1.6) * 0.5,
          }
        })
        return (
          // Outer group sets the orbital plane via the tilt.
          <group key={plan.id} rotation={plan.tilt}>
            {/* Inner group spins around its local +Y; we mutate rotation.y in useFrame. */}
            <group
              ref={(g) => {
                if (g) {
                  electronRefs.current[idx] = g
                  // Seed initial phase so all electrons aren't aligned at t=0.
                  g.rotation.y = plan.phaseOffset
                }
              }}
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
          </group>
        )
      })}
    </group>
  )
}
