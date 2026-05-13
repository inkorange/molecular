'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  CanvasTexture,
  type PointLight,
  type Sprite,
  SpriteMaterial,
} from 'three'
import type { Demonstration } from '@/src/data/demonstrations'

interface TransitionFlashProps {
  /** When did the current transition phase begin (performance.now). */
  phaseStartedAt: number
  /** Total transition duration in ms. */
  durationMs: number
  /** Drives the flash tint — matches the per-reaction-type palette so the
   *  cover-up flash feels keyed to the chemistry instead of generic white. */
  kind: Demonstration['effectKind']
}

// Color per reaction kind — same vocabulary as ReactionEffect so the flash
// reads as the same "energy event" rather than a separate VFX layer.
const FLASH_COLOR: Record<Demonstration['effectKind'], string> = {
  synthesis: '#dffaff',
  combustion: '#ffd97a',
  decomposition: '#c89eff',
  neutralization: '#a4ff8c',
  displacement: '#ffd97a',
}

// Where in (0..1) the flash peaks. Slightly before the visual midpoint so
// the brightest moment hits while the products are mid-growth, masking
// the in-between geometry.
const PEAK_AT = 0.45
// Peak intensity for the point light. Cranked high enough that nearby
// atoms get blown out at the peak — the Scene's bloom pass then turns
// the overbright pixels into a halo for free.
const LIGHT_INTENSITY_MAX = 220
// Point light decay distance. Generous so the wash reaches remainder
// atoms on the ring, not just the central cluster.
const LIGHT_DISTANCE = 18
// Peak scale for the bright additive sprite at origin. Bigger than the
// previous pass so the bloom mipmap chain has more pixels to expand.
const SPRITE_SCALE_MAX = 3.4
// HDR multiplier baked into the sprite color. Three accepts color
// components > 1 with toneMapped=false — the bloom pass picks them up
// and produces a much stronger halo than a 0..1 clamped white.
const SPRITE_HDR_GAIN = 4

/**
 * Bright transition flash. Two complementary layers:
 *   - A `pointLight` at origin whose intensity swells then fades. Because
 *     the molecule materials are PBR (`meshStandardMaterial`), the light
 *     actually illuminates the surrounding atoms — giving the flash real
 *     bounce instead of a flat overlay.
 *   - A small additive sprite at origin that drives the bloom pass. The
 *     Scene's bloom (luminanceThreshold=0.2, mipmapBlur) turns this tiny
 *     bright point into a wide soft halo, which reads as the visible
 *     "burst of energy" at the reaction site.
 *
 * Together they produce a realistic "flashbulb at the reaction" look:
 * the source emits light that lights up the surroundings, and the source
 * itself blooms into a halo through the bloom postprocessing — no fake
 * giant overlay sphere needed.
 */
export function TransitionFlash({ phaseStartedAt, durationMs, kind }: TransitionFlashProps) {
  const lightRef = useRef<PointLight>(null)
  const spriteRef = useRef<Sprite>(null)
  const color = FLASH_COLOR[kind]

  // Procedural radial gradient texture for the sprite — fully white at
  // the center, fully transparent at the edge. Drawn once with a 2D
  // canvas so we don't ship a PNG and so we control falloff exactly.
  const spriteMaterial = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
      grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.7)')
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, size, size)
    }
    const texture = new CanvasTexture(canvas)
    const mat = new SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    // Push color components above 1 for HDR — bloom amplifies these
    // overbright pixels into a much wider, brighter halo than a clamped
    // colour would produce.
    mat.color.set(color).multiplyScalar(SPRITE_HDR_GAIN)
    return mat
  }, [color])

  // Triangle envelope around PEAK_AT — rise from 0 → 1 over the first
  // PEAK_AT slice of the transition, then fall 1 → 0 over the remainder.
  const envelope = useMemo(
    () => (t: number) => {
      if (t < 0 || t > 1) return 0
      if (t < PEAK_AT) return t / PEAK_AT
      return 1 - (t - PEAK_AT) / (1 - PEAK_AT)
    },
    [],
  )

  useFrame(() => {
    const t = Math.min(1, Math.max(0, (performance.now() - phaseStartedAt) / durationMs))
    const env = envelope(t)

    if (lightRef.current) {
      lightRef.current.intensity = LIGHT_INTENSITY_MAX * env
    }

    if (spriteRef.current) {
      const s = 0.2 + SPRITE_SCALE_MAX * env
      spriteRef.current.scale.setScalar(s)
      const mat = spriteRef.current.material as { opacity?: number }
      // Sprite peaks fully opaque; bloom does the rest of the work.
      if (mat.opacity !== undefined) mat.opacity = env
    }
  })

  return (
    <group>
      {/* PBR illumination of the surrounding atoms — this is what makes
          the flash feel "real" instead of pasted on. */}
      <pointLight ref={lightRef} color={color} intensity={0} distance={LIGHT_DISTANCE} decay={2} />
      {/* Bright point-source for bloom. Sprite billboards toward the
          camera so the halo always faces the viewer cleanly. */}
      <sprite ref={spriteRef} material={spriteMaterial} scale={0.2} />
    </group>
  )
}
