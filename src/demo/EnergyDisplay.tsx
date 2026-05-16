'use client'

import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, CanvasTexture, type Sprite, SpriteMaterial } from 'three'
import type { EnergyScale } from '@/src/data/demonstrations'

interface EnergyDisplayProps {
  /** Relative energy magnitude (0–5). 0 hides the display entirely. */
  scale: EnergyScale
  /** Human-readable energy magnitude shown inside the cloud (e.g. "17.6 MeV"). */
  label?: string
}

// Where the cloud sits in scene coordinates. Above the product cluster
// so it reads as energy radiating UP from the reaction site without
// occluding the headline products.
const CLOUD_POSITION: [number, number, number] = [0, 2.4, 0]

// Cloud size scales with energy magnitude. Sprite scale here is the
// approximate world-unit diameter of the visible blob — the soft alpha
// gradient on the edge means the *visible* extent is somewhat smaller
// than this nominal size, which is exactly the fuzzy feel we want.
const BASE_SIZE = 1.0
const SIZE_PER_LEVEL = 0.36

/**
 * Single soft glowing energy blob representing the energy released by
 * the reaction. Implemented as ONE billboarded sprite with a procedural
 * radial-gradient texture — the smooth multi-stop gradient ensures the
 * color blends continuously from a near-white hot core through yellow
 * and orange out to fully transparent at the silhouette, with no
 * visible bands or layer boundaries.
 *
 * Compared to the earlier concentric-spheres treatment, this:
 * - Has zero hard edges (each color blends straight into the next
 *   inside the texture, before it ever hits the rasteriser).
 * - Is camera-facing by virtue of being a sprite, so the blob always
 *   reads as a "puff" from every viewing angle as the camera orbits.
 * - Is cheaper to render — one quad instead of four spheres.
 *
 * A subtle scale-breathe + opacity flicker keeps the blob feeling like
 * a living energy field rather than a static decal.
 */
export function EnergyDisplay({ scale, label }: EnergyDisplayProps) {
  // Endothermic / neutral reactions don't get an energy cloud at all.
  const clamped = Math.max(0, Math.min(5, scale))

  const size = BASE_SIZE + clamped * SIZE_PER_LEVEL

  // Procedural radial-gradient texture. White core → hot yellow → orange
  // → red → transparent edge. The intermediate stops are where the
  // smoothness comes from: many small steps let the gradient interpolate
  // colors continuously instead of jumping. Drawn once and reused.
  const spriteMaterial = useMemo(() => {
    const texSize = 256
    const canvas = document.createElement('canvas')
    canvas.width = texSize
    canvas.height = texSize
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const grad = ctx.createRadialGradient(
        texSize / 2,
        texSize / 2,
        0,
        texSize / 2,
        texSize / 2,
        texSize / 2,
      )
      // Many stops for smooth blending. Alpha tapers smoothly toward
      // the edge so the cloud has a soft fuzzy silhouette (no rim).
      grad.addColorStop(0.0, 'rgba(255, 250, 220, 0.95)') // near-white hot core
      grad.addColorStop(0.12, 'rgba(255, 235, 160, 0.82)') // hot yellow
      grad.addColorStop(0.28, 'rgba(255, 195, 95, 0.55)') // amber
      grad.addColorStop(0.45, 'rgba(255, 140, 55, 0.32)') // orange
      grad.addColorStop(0.65, 'rgba(255, 95, 50, 0.16)') // orange-red
      grad.addColorStop(0.85, 'rgba(220, 70, 40, 0.05)') // dim red wisp
      grad.addColorStop(1.0, 'rgba(220, 70, 40, 0)') // fully transparent
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, texSize, texSize)
    }
    const texture = new CanvasTexture(canvas)
    return new SpriteMaterial({
      map: texture,
      transparent: true,
      // Additive blending lets the bloom pass pick the bright core up
      // and produce a wider halo for free. Tone-mapping disabled so the
      // texture's gradient values aren't crushed.
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      opacity: 1,
    })
  }, [])

  const spriteRef = useRef<Sprite>(null)
  const baseSizeRef = useRef(size)

  useFrame(() => {
    const s = spriteRef.current
    if (!s) return
    const t = performance.now() / 1000
    // Breathe: ±6% size modulation over ~2.5s — alive but never feels
    // like the cloud is "pulsing on cue".
    const breathe = 1 + 0.06 * Math.sin(t * 2.4)
    s.scale.setScalar(baseSizeRef.current * breathe)
    // Subtle opacity flicker. Range 0.88..1.0 — enough to read as a
    // turbulent energy field without strobing.
    const flicker = 0.94 + 0.06 * Math.sin(t * 3.7 + 1.3)
    const mat = s.material as { opacity?: number }
    if (mat.opacity !== undefined) mat.opacity = flicker
  })

  // Re-sync the base size when the energy scale changes (e.g. live
  // tuning during development). useRef so we don't trigger a re-render.
  baseSizeRef.current = size

  if (clamped === 0) return null

  return (
    <group position={CLOUD_POSITION}>
      <sprite ref={spriteRef} material={spriteMaterial} scale={size} />

      {/* Energy magnitude — billboarded 3D text embedded inside the blob.
          Dark fill on a bright outline gives it the strongest possible
          contrast against the luminous additive cloud behind it. White
          fill (the previous choice) lost in the white-hot core. */}
      {label && (
        <Billboard>
          <Text
            fontSize={Math.min(0.32, 0.18 + clamped * 0.035)}
            color="#1a0d2a"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
            outlineWidth={0.02}
            outlineColor="#fff5b8"
            material-toneMapped={false}
          >
            {label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
