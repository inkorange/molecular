'use client'

import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, CanvasTexture, type Group, SpriteMaterial } from 'three'
import type { FreeParticle, FreeParticleKind } from '@/src/data/demonstrations'

interface FreeParticleFieldProps {
  /** Free particles to display, as declared on the demo. */
  particles: readonly FreeParticle[]
  /** Radius (units) for the orbit ring around the products. */
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
    coreRadius: number
    /** World-unit diameter of the sprite-based glow drawn behind the
     *  core. Sized larger than coreRadius so the glow extends past the
     *  particle's silhouette and feels like radiated light. */
    glowSize: number
    /** Rendered geometry shape. Neutrons get a hexagonal prism (reads
     *  as a "crystalline particle" rather than a generic dot); photons
     *  stay spheres because they're meant to feel like soft light. */
    shape: 'hex' | 'sphere'
  }
> = {
  // Neutron — uncharged subatomic. Tiny pale-gray hexagonal prism with
  // a soft sprite-based glow (NOT a wrapping halo sphere — that read
  // as a discrete circle around the particle). Oscillates in useFrame.
  // The hex core stays small; the glow does the "noticeable" work.
  neutron: {
    color: '#dffaff',
    label: 'NEUTRON',
    labelSize: 0.13,
    coreRadius: 0.04,
    /** World-unit diameter of the sprite glow drawn behind the core.
     *  Sized just larger than the hex so the glow accents the particle
     *  without dominating it. */
    glowSize: 0.25,
    shape: 'hex',
  },
  // Photon — quantum of electromagnetic energy. Brilliant yellow sphere
  // with a big additive halo so it reads as "light/heat being radiated".
  // Currently unused (energy is handled by EnergyDisplay) but retained
  // for forward compatibility if a demo later needs explicit photons.
  photon: {
    color: '#fff5b8',
    label: 'γ',
    labelSize: 0.3,
    coreRadius: 0.16,
    glowSize: 1.2,
    shape: 'sphere',
  },
}

// Vertical center of the particle ring. Slightly above the products so
// they read as "emerging from the reaction" but low enough that the
// auto-fit camera keeps the whole scene framed without going off-screen.
const RING_CENTER_Y = 0.4
// How "tilted" the ring is. Multiplier on sin(angle) — 1.0 = full circle
// in XY plane (lots of vertical span), <1 = flattened ellipse.
const RING_VERTICAL_FLATTEN = 0.45

/**
 * Build a sprite material with a procedural radial-gradient texture for
 * a soft additive glow. The previous halo treatment was a translucent
 * sphere drawn around the core — but a sphere has a hard silhouette
 * (you can see "the circle"), even at low opacity. A camera-facing
 * sprite with a smoothly tapered alpha gradient reads as pure glow
 * with no edge, exactly what the user asked for.
 */
function buildGlowMaterial(centerColor: string): SpriteMaterial {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    // Bright at center, smoothly tapered to zero alpha at the edge.
    // Many stops keeps the gradient continuous — there's no
    // discernible boundary or "rim".
    grad.addColorStop(0.0, hexWithAlpha(centerColor, 0.85))
    grad.addColorStop(0.18, hexWithAlpha(centerColor, 0.55))
    grad.addColorStop(0.4, hexWithAlpha(centerColor, 0.22))
    grad.addColorStop(0.7, hexWithAlpha(centerColor, 0.06))
    grad.addColorStop(1.0, hexWithAlpha(centerColor, 0))
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
  }
  const texture = new CanvasTexture(canvas)
  return new SpriteMaterial({
    map: texture,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  })
}

/** Concatenate a 6-digit hex like "#dffaff" with a 0..1 alpha into an
 *  rgba() string for a canvas gradient stop. */
function hexWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Render a flat list of FreeParticle entries as 3D particles arranged
 * on a tilted ring around the product cluster. Each particle gets a
 * core mesh (hex prism for neutrons, sphere for photons), an additive
 * halo, and a billboarded text label.
 *
 * Animation:
 * - Whole group hovers (y bob) with a per-slot phase offset
 * - Neutrons additionally oscillate (small z-axis rotation wobble) so
 *   their hex face wags back and forth — reads as "energetic particle"
 *   rather than "static decal"
 */
export function FreeParticleField({
  particles,
  ringRadius = 3.6,
  hoverAmplitude = 0.16,
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

  // One sprite material per kind — shared across every particle of
  // that kind. Built once on mount via a procedural canvas texture so
  // we don't ship a PNG asset.
  const glowMaterials = useMemo(() => {
    const map: Partial<Record<FreeParticleKind, SpriteMaterial>> = {}
    for (const kind of Object.keys(RECIPE) as FreeParticleKind[]) {
      map[kind] = buildGlowMaterial(RECIPE[kind].color)
    }
    return map as Record<FreeParticleKind, SpriteMaterial>
  }, [])

  // Pre-compute each slot's position. Distributed around 75% of a circle
  // starting at upper-left, so particles ring above + around the
  // products without occluding them. Use a flattened ellipse so the
  // ring doesn't span an excessive vertical extent.
  const positions = useMemo<Array<[number, number, number]>>(() => {
    const total = Math.max(1, slots.length)
    return slots.map((_, i) => {
      const angle = Math.PI * 0.75 + (i / total) * Math.PI * 1.5
      const x = Math.cos(angle) * ringRadius
      const y = RING_CENTER_Y + Math.sin(angle) * ringRadius * RING_VERTICAL_FLATTEN
      // Slight forward-z bias so the particles sit in front of the
      // product cluster from the default camera angle.
      const z = 0.3
      return [x, y, z]
    })
  }, [slots, ringRadius])

  const slotRefs = useRef<Array<Group | null>>([])

  // Per-frame animation: vertical bob for all particles + hex-face
  // oscillation (small rotation wobble) for hex-shaped particles. The
  // refs array is sized lazily via callback refs in the JSX below.
  useFrame(() => {
    const t = performance.now() / 1000
    for (let i = 0; i < slotRefs.current.length; i++) {
      const node = slotRefs.current[i]
      const basePos = positions[i]
      const slot = slots[i]
      if (!node || !basePos || !slot) continue
      const phase = i * 0.7
      node.position.y = basePos[1] + Math.sin(t * 1.4 + phase) * hoverAmplitude
      // Hex prisms wobble on the camera-facing axis so the hex face
      // tilts gently back and forth. Sphere particles get no rotation —
      // spinning a sphere is invisible anyway.
      if (slot.kind === 'neutron') {
        node.rotation.z = Math.sin(t * 1.9 + i * 0.85) * 0.4
        // Subtle pitch wobble too so it doesn't feel locked to one axis.
        node.rotation.x = Math.sin(t * 1.3 + i * 0.5) * 0.18
      }
    }
  })

  if (slots.length === 0) return null

  return (
    <group>
      {slots.map((slot, i) => {
        const recipe = RECIPE[slot.kind]
        const pos = positions[i] ?? [0, 0, 0]
        return (
          <group
            // biome-ignore lint/suspicious/noArrayIndexKey: slot order stable per demo
            key={`particle-${i}`}
            position={pos}
            ref={(node) => {
              slotRefs.current[i] = node
            }}
          >
            {/* Core mesh — hex prism for neutrons, sphere otherwise.
                Hex prism's flat face is rotated to point toward camera
                via [PI/2, 0, 0] so the hexagonal silhouette reads from
                the default forward view. */}
            {recipe.shape === 'hex' ? (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry
                  args={[recipe.coreRadius, recipe.coreRadius, recipe.coreRadius * 0.7, 6]}
                />
                <meshBasicMaterial color={recipe.color} toneMapped={false} />
              </mesh>
            ) : (
              <mesh>
                <sphereGeometry args={[recipe.coreRadius, 16, 12]} />
                <meshBasicMaterial color={recipe.color} toneMapped={false} />
              </mesh>
            )}
            {/* Sprite-based glow — a camera-facing radial-gradient
                sprite that fades smoothly to transparent. Replaces the
                old halo sphere whose hard silhouette read as a discrete
                "circle around the particle". Always faces camera so
                the glow reads as soft light from every orbit angle. */}
            <sprite material={glowMaterials[slot.kind]} scale={recipe.glowSize} />
            {/* Billboarded label — always faces camera even as the
                particle wobbles, so the badge stays readable. */}
            <Billboard position={[0, recipe.glowSize * 0.5 + 0.08, 0]}>
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
