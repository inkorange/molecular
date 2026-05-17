'use client'

import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, CanvasTexture, NormalBlending, type Sprite, SpriteMaterial } from 'three'
import type { EnergyScale } from '@/src/data/demonstrations'

interface EnergyDisplayProps {
  /** Relative energy magnitude (0–5). 0 hides the display entirely. */
  scale: EnergyScale
  /** Human-readable energy magnitude shown inside the cloud (e.g. "17.6 MeV"). */
  label?: string
}

// Where the cloud sits in scene coordinates. Just above + behind the
// product cluster. The negative z pushes it back along the camera
// look-axis so it can't overlap product molecules from the default
// front view — propane combustion has a wide product layout that the
// cloud would otherwise sit on top of when both share z=0. Auto-rotate
// will eventually swing the cloud around in front of the products, but
// that movement is gradual and reads as the cloud "circling" rather
// than punching through them.
const CLOUD_POSITION: [number, number, number] = [0, 1.5, -2.5]

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

  // Soft dark "shadow" sprite that sits in front of the cloud and
  // behind the text. Procedural radial gradient — dark in the middle,
  // fading to transparent at the edges so the cloud's color seeps
  // back in around the text and the dimming doesn't read as a hard
  // dark plate. Normal alpha blending: this sprite SUBTRACTS brightness
  // (alpha-mixes a dark color over the bright additive cloud below).
  const shadowMaterial = useMemo(() => {
    const texSize = 128
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
      grad.addColorStop(0.0, 'rgba(15, 5, 8, 0.78)')
      grad.addColorStop(0.4, 'rgba(15, 5, 8, 0.55)')
      grad.addColorStop(0.75, 'rgba(15, 5, 8, 0.15)')
      grad.addColorStop(1.0, 'rgba(15, 5, 8, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, texSize, texSize)
    }
    const texture = new CanvasTexture(canvas)
    return new SpriteMaterial({
      map: texture,
      transparent: true,
      blending: NormalBlending,
      depthWrite: false,
      toneMapped: false,
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

      {/* Energy magnitude — billboarded 3D text embedded inside the
          blob. The label sits on top of a soft dark "shadow" sprite
          which DIMS the bright additive cloud behind it — without that
          dimming, bloom bleed from the cloud washes out the dark text
          and the label becomes invisible. The shadow sprite uses
          normal alpha blending (NOT additive) so it actually subtracts
          brightness rather than adding to it. */}
      {label && (
        <Billboard>
          <sprite material={shadowMaterial} scale={size * 0.45} />
          <Text
            position={[0, 0, 0.01]}
            fontSize={Math.min(0.36, 0.2 + clamped * 0.04)}
            color="#2a0808"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
