'use client'

import { Billboard, Line, Text } from '@react-three/drei'
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
const SHELL_RADIUS_STEP = 0.09
const MAX_ELECTRONS_VISIBLE = 8
// The tail is drawn as a single continuous Line — TAIL_POINTS samples along the arc.
// More points = smoother curve. 32 keeps it cheap and visually smooth at scene scale.
const TAIL_POINTS = 32
const TAIL_ARC = Math.PI / 3 // 60° behind the head

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
        // Speeds range ~9..15 rad/s, signed — ~1.5..2.4 revolutions per second.
        const speed = (9 + ((globalIdx * 13) % 60) / 10) * direction
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
          starting phase, and signed rotation speed. The trail is a single Line
          with per-vertex alpha — guarantees a smooth continuous streak with no
          visible "string of beads" artifact. The head is one bright sprite. */}
      {electronPlans.map((plan, idx) => {
        const headScale = plan.isValence ? 0.04 : 0.03
        const colorHex = plan.isValence ? '#fff5b8' : '#ffd97a'
        const headPos: Vector3Tuple = [plan.radius, 0, 0]

        // Sample TAIL_POINTS positions along the arc behind the head.
        const tailPoints: Vector3Tuple[] = []
        const tailColors: Array<[number, number, number]> = []
        for (let k = 0; k < TAIL_POINTS; k++) {
          const angle = -(k / (TAIL_POINTS - 1)) * TAIL_ARC
          tailPoints.push([Math.cos(angle) * plan.radius, 0, Math.sin(angle) * plan.radius])
          // Color fades from bright at the head to dark at the tail. Stored
          // pre-multiplied so the additive Line material reads as gradient brightness.
          const fade = 1 - k / (TAIL_POINTS - 1)
          const intensity = 0.18 * fade ** 1.2
          tailColors.push([intensity, intensity * 0.92, intensity * 0.55])
        }

        return (
          <group key={plan.id} rotation={plan.tilt}>
            <group
              ref={(g) => {
                if (g) {
                  electronRefs.current[idx] = g
                  g.rotation.y = plan.phaseOffset
                }
              }}
            >
              {/* The trail line — continuous, no dot artifacts. */}
              <Line
                points={tailPoints}
                vertexColors={tailColors}
                lineWidth={2.2}
                transparent
                opacity={1}
              />
              {/* The head — a single bright sprite at the leading position. */}
              <ElectronSprite
                position={headPos}
                scale={headScale}
                color={colorHex}
                opacity={0.85}
              />
            </group>
          </group>
        )
      })}
    </group>
  )
}
