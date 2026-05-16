'use client'

import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, type Group } from 'three'
import type { FreeParticle, FreeParticleKind } from '@/src/data/demonstrations'

interface FreeParticleFieldProps {
  /** Free particles to display, as declared on the demo. */
  particles: readonly FreeParticle[]
  /** Radius (units) around the origin where particles are placed. */
  ringRadius?: number
  /** Vertical drift amplitude for the gentle hover animation. */
  hoverAmplitude?: number
}

// Per-particle visual recipe. Tunes color, glow, label, and sprite
// sizes — keep the values in one place so adding a new kind
// (electron / positron / antineutrino…) is a single-line addition.
const RECIPE: Record<
  FreeParticleKind,
  {
    color: string
    label: string
    /** Font size for the label. Word labels need smaller text than
     *  single-glyph labels (γ) to keep the badge proportional. */
    labelSize: number
    sphereRadius: number
    haloRadius: number
    haloOpacity: number
  }
> = {
  // Neutron — uncharged subatomic. Small pale-gray sphere with a soft
  // halo. Sized small enough that 3 of them (fission) don't crowd the
  // products but bright enough to remain noticeable.
  neutron: {
    color: '#dffaff',
    label: 'NEUTRON',
    labelSize: 0.16,
    sphereRadius: 0.13,
    haloRadius: 0.22,
    haloOpacity: 0.4,
  },
  // Photon — quantum of electromagnetic energy. Brilliant yellow with a
  // big additive halo so it reads as "light/heat being radiated".
  photon: {
    color: '#fff5b8',
    label: 'γ',
    labelSize: 0.3,
    sphereRadius: 0.16,
    haloRadius: 0.46,
    haloOpacity: 0.6,
  },
}

/**
 * Render a flat list of FreeParticle entries as 3D sprites arranged on a
 * ring above the product cluster. Each particle gets a glowing core
 * sphere, an additive halo, and a billboarded text label (e.g. "n", "γ")
 * so the user can tell what each one is.
 *
 * The whole field gently bobs in place so the particles read as "alive"
 * rather than static decals.
 */
export function FreeParticleField({
  particles,
  ringRadius = 4.4,
  hoverAmplitude = 0.18,
}: FreeParticleFieldProps) {
  // Flatten the count tuples into individual particle slots so each one
  // gets its own position on the ring.
  const slots = useMemo(() => {
    const out: { kind: FreeParticleKind; idx: number }[] = []
    let idx = 0
    for (const p of particles) {
      for (let i = 0; i < p.count; i++) out.push({ kind: p.kind, idx: idx++ })
    }
    return out
  }, [particles])

  // Pre-compute each slot's position on a ring tilted upward so the
  // particles float above + behind the product cluster (so they don't
  // occlude the headline products from the camera-front view).
  const positions = useMemo<Array<[number, number, number]>>(() => {
    const total = Math.max(1, slots.length)
    return slots.map((_, i) => {
      // Distribute around 75% of a circle (skipping the bottom 25%
      // where they'd hide behind the products). Start at the top-left.
      const angle = Math.PI * 0.75 + (i / total) * Math.PI * 1.5
      const x = Math.cos(angle) * ringRadius
      const y = 1.6 + Math.sin(angle) * ringRadius * 0.6
      const z = 0.4
      return [x, y, z]
    })
  }, [slots, ringRadius])

  const groupRef = useRef<Group>(null)

  // Slow vertical bob so the field reads as buoyant rather than static.
  // Per-slot phase offset prevents the whole ring moving in lockstep.
  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const t = performance.now() / 1000
    for (let i = 0; i < g.children.length; i++) {
      const child = g.children[i]
      const basePos = positions[i]
      if (!child || !basePos) continue
      const phase = i * 0.7
      child.position.y = basePos[1] + Math.sin(t * 1.4 + phase) * hoverAmplitude
    }
  })

  if (slots.length === 0) return null

  return (
    <group ref={groupRef}>
      {slots.map((slot, i) => {
        const recipe = RECIPE[slot.kind]
        const pos = positions[i] ?? [0, 0, 0]
        return (
          <group
            // biome-ignore lint/suspicious/noArrayIndexKey: slot order stable per demo
            key={`particle-${i}`}
            position={pos}
          >
            {/* Bright core — meshBasicMaterial so its color isn't dulled
                by the scene lighting; toneMapped=false keeps it
                eligible for the bloom pass. */}
            <mesh>
              <sphereGeometry args={[recipe.sphereRadius, 16, 12]} />
              <meshBasicMaterial color={recipe.color} toneMapped={false} />
            </mesh>
            {/* Halo — additive, larger, semi-transparent. Sells the
                "glowing particle" feel and feeds the bloom pass. */}
            <mesh>
              <sphereGeometry args={[recipe.haloRadius, 16, 12]} />
              <meshBasicMaterial
                color={recipe.color}
                transparent
                opacity={recipe.haloOpacity}
                blending={AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
            {/* Billboarded label — same vocabulary as the periodic-card
                billboards on atoms so students recognise it as "this is
                what this thing is called". */}
            <Billboard position={[0, recipe.haloRadius + 0.18, 0]}>
              <Text
                fontSize={recipe.labelSize}
                color={recipe.color}
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
                outlineWidth={0.008}
                outlineColor="#0d0a22"
                material-toneMapped={false}
              >
                {recipe.label}
              </Text>
            </Billboard>
          </group>
        )
      })}
    </group>
  )
}
