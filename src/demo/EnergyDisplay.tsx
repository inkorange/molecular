'use client'

import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, type Group, type Mesh } from 'three'
import type { EnergyScale } from '@/src/data/demonstrations'

interface EnergyDisplayProps {
  /** Relative energy magnitude (0–5). 0 hides the display entirely. */
  scale: EnergyScale
  /** Human-readable energy magnitude shown inside the cloud (e.g. "17.6 MeV"). */
  label?: string
}

// Where the cloud sits in scene coordinates. Above and slightly behind
// the product cluster so it reads as energy radiating UP from the
// reaction site without occluding the headline products.
const CLOUD_POSITION: [number, number, number] = [0, 3.4, 0]

// Cloud size scales with energy magnitude. Level 1 = a small wisp, level
// 5 = a dense fireball. Tuned so even at level 5 the cloud doesn't
// overflow the camera frame.
const BASE_RADIUS = 0.6
const RADIUS_PER_LEVEL = 0.28

// Per-layer recipe for the concentric translucent spheres that build
// up the haze. Outer layers are larger + dimmer; inner layers are
// smaller + brighter. Additive blending makes the overlap glow brighter
// where they intersect — the visual sweet spot for "fireball".
const LAYERS: ReadonlyArray<{ scale: number; color: string; opacity: number }> = [
  { scale: 1.4, color: '#ff5a3a', opacity: 0.12 }, // outer haze — orange-red
  { scale: 1.05, color: '#ff9a3a', opacity: 0.22 }, // mid — orange
  { scale: 0.72, color: '#ffd97a', opacity: 0.38 }, // inner — yellow
  { scale: 0.46, color: '#fff5b8', opacity: 0.6 }, // core — near-white
]

/**
 * Single glowing energy cloud that represents the energy released by the
 * reaction. Concentric translucent spheres with additive blending build
 * up a fireball-style haze that's orange at the edge and near-white at
 * the core. The numeric energy magnitude (e.g. "17.6 MeV") floats as
 * billboarded 3D text inside the cloud.
 *
 * Replaces the earlier thermometer-bar gauge + separate photon sprites,
 * which together read as "three separate things going on" rather than
 * "the reaction released this much energy". The cloud is one object.
 *
 * The cloud breathes (slow scale pulse) so it reads as an energy field
 * rather than a static decal. Brighter / larger as `scale` grows.
 */
export function EnergyDisplay({ scale, label }: EnergyDisplayProps) {
  // Endothermic / neutral reactions don't get an energy cloud at all.
  const clamped = Math.max(0, Math.min(5, scale))

  // Per-render base radius — captured in a ref so useFrame can read it
  // without forcing the component to re-render every frame.
  const radius = BASE_RADIUS + clamped * RADIUS_PER_LEVEL

  // Material refs for the breathe + per-layer opacity. We mutate them
  // directly in useFrame rather than driving React state.
  const groupRef = useRef<Group>(null)
  const meshRefs = useRef<Array<Mesh | null>>([])

  // Pre-compute the per-frame target scales / opacities to avoid array
  // allocations inside useFrame.
  const layerBaseOpacities = useMemo(() => LAYERS.map((l) => l.opacity), [])

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const t = performance.now() / 1000
    // Slow breathe: 5% scale modulation over ~2.5s. Fast enough to feel
    // alive, slow enough not to distract from the energy magnitude.
    const breathe = 1 + 0.05 * Math.sin(t * 2.4)
    g.scale.setScalar(breathe)

    // Per-layer brightness flicker — independent phases per layer so the
    // cloud reads as turbulent rather than uniformly pulsing. Small
    // amplitude on top of the base opacity so it stays within visual
    // budget on every frame.
    for (let i = 0; i < meshRefs.current.length; i++) {
      const m = meshRefs.current[i]
      const baseOp = layerBaseOpacities[i]
      if (!m || baseOp === undefined) continue
      const flicker = 0.85 + 0.15 * Math.sin(t * (3.1 + i * 1.3) + i * 0.7)
      const mat = m.material as { opacity?: number }
      if (mat.opacity !== undefined) mat.opacity = baseOp * flicker
    }
  })

  if (clamped === 0) return null

  return (
    <group ref={groupRef} position={CLOUD_POSITION}>
      {/* Concentric translucent spheres, drawn outer→inner. Additive
          blending means the overlap region accumulates brightness,
          producing a soft hot core surrounded by a softer halo. */}
      {LAYERS.map((layer, i) => (
        <mesh
          // biome-ignore lint/suspicious/noArrayIndexKey: layer order is fixed
          key={`layer-${i}`}
          ref={(m) => {
            meshRefs.current[i] = m
          }}
        >
          <sphereGeometry args={[radius * layer.scale, 24, 18]} />
          <meshBasicMaterial
            color={layer.color}
            transparent
            opacity={layer.opacity}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Energy magnitude — billboarded 3D text inside the cloud. White
          on the bright core reads clearly; the toneMapped=false keeps
          it above the bloom threshold so it stays legible even when
          the surrounding cloud is glowing hard. */}
      {label && (
        <Billboard>
          <Text
            fontSize={Math.min(0.42, 0.22 + clamped * 0.05)}
            color="#fff5b8"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
            outlineWidth={0.012}
            outlineColor="#3a1810"
            material-toneMapped={false}
          >
            {label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
