'use client'

import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  type Group,
  LineBasicMaterial,
  Line as ThreeLine,
  type Vector3Tuple,
} from 'three'
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
// The tail is drawn as a single continuous THREE.Line — TAIL_POINTS samples along the arc.
const TAIL_POINTS = 32
const TAIL_ARC = Math.PI / 3 // 60° behind the head

function buildTrailLine(plan: ElectronPlan): ThreeLine {
  const trailDir = plan.speed >= 0 ? 1 : -1
  const positions = new Float32Array(TAIL_POINTS * 3)
  const colors = new Float32Array(TAIL_POINTS * 3)
  for (let k = 0; k < TAIL_POINTS; k++) {
    const angle = trailDir * (k / (TAIL_POINTS - 1)) * TAIL_ARC
    positions[k * 3] = Math.cos(angle) * plan.radius
    positions[k * 3 + 1] = 0
    positions[k * 3 + 2] = Math.sin(angle) * plan.radius
    // Brightness fades from head (~0.7) to tail (~0). Stored as RGB; additive
    // blending below means "near-black" rows contribute nothing to the framebuffer
    // — so the tail effectively vanishes over both atoms and the space background.
    const fade = 1 - k / (TAIL_POINTS - 1)
    const intensity = 0.7 * fade ** 1.4
    colors[k * 3] = intensity
    colors[k * 3 + 1] = intensity * 0.92
    colors[k * 3 + 2] = intensity * 0.55
  }
  const geom = new BufferGeometry()
  geom.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geom.setAttribute('color', new Float32BufferAttribute(colors, 3))
  const mat = new LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  return new ThreeLine(geom, mat)
}

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

  // Build one THREE.Line per electron up front so we don't re-allocate on every render.
  const trailLines = useMemo(() => electronPlans.map((p) => buildTrailLine(p)), [electronPlans])

  // Dispose geometries and materials when this Atom unmounts.
  useEffect(() => {
    return () => {
      for (const line of trailLines) {
        line.geometry.dispose()
        if (Array.isArray(line.material)) {
          for (const m of line.material) m.dispose()
        } else {
          line.material.dispose()
        }
      }
    }
  }, [trailLines])

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
          roughness={0.28}
          metalness={0.35}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Label */}
      {showLabel && (
        // Float the label well outside the atom sphere so the nucleus and bloom
        // don't swallow it. Billboard keeps the text facing the camera as you orbit.
        <Billboard position={[0, NUCLEUS_RADIUS + 0.32, 0]} renderOrder={3}>
          <Text
            fontSize={0.3}
            color="#dffaff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.04}
            outlineColor="#000000"
            outlineBlur={0.01}
            material-depthTest={false}
            material-depthWrite={false}
            material-transparent
            material-toneMapped={false}
          >
            {el.symbol}
          </Text>
        </Billboard>
      )}

      {/* Per-electron orbits: each electron has its own tilted group with a
          pre-built THREE.Line trail (additive-blended, so the tail glows over
          dark and disappears over bright). The head is a single bright sprite. */}
      {electronPlans.map((plan, idx) => {
        const headScale = plan.isValence ? 0.06 : 0.045
        const colorHex = plan.isValence ? '#fff5b8' : '#ffd97a'
        const headPos: Vector3Tuple = [plan.radius, 0, 0]
        const trailLine = trailLines[idx]

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
              {trailLine && <primitive object={trailLine} />}
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
