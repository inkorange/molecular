'use client'

import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  type Group,
  NormalBlending,
  type Sprite,
  SpriteMaterial,
} from 'three'
import type { EnergyScale } from '@/src/data/demonstrations'

interface EnergyDisplayProps {
  /** Relative energy magnitude (0–5). 0 hides the display entirely. */
  scale: EnergyScale
  /**
   * Direction of energy flow:
   *  - 'released' (exothermic): flame licks rise outward from the blob
   *  - 'absorbed' (endothermic): particles stream INTO the blob from
   *    the surrounding area, getting consumed at the center
   * Defaults to 'released' since most chemistry demos are exothermic.
   */
  direction?: 'released' | 'absorbed'
  /** Human-readable energy magnitude shown inside the cloud (e.g. "17.6 MeV"). */
  label?: string
}

// Where the cloud sits in scene coordinates. Just above + behind the
// product cluster so it can't overlap wide product layouts from the
// default front view.
const CLOUD_POSITION: [number, number, number] = [0, 1.5, -2.5]

// Cloud size scales with energy magnitude. Sprite scale here is the
// approximate world-unit diameter of the visible blob.
const BASE_SIZE = 1.0
const SIZE_PER_LEVEL = 0.36

// Particle system tuning. 108 particles distributed on a Fibonacci
// sphere — at lower counts (≤60) the visible "live" subset at any
// frame still had perceptible gaps. Doubling density makes the
// starburst feel continuous from every angle. Sprite count is still
// well within mobile-GPU comfort: each sprite is a tiny single-
// textured quad, and the low per-particle opacity (max 0.25) means
// fillrate stays reasonable even with the overlap.
const PARTICLE_COUNT = 108

/**
 * Build the warm cloud body texture used for "energy released" demos.
 * White core → hot yellow → orange → red → fade. Same recipe used to
 * exist inline; pulled out as a function so the cool variant below
 * can mirror the structure.
 */
function buildWarmCloudTexture(): CanvasTexture {
  return buildRadialGradient([
    [0.0, 'rgba(255, 250, 220, 0.95)'],
    [0.12, 'rgba(255, 235, 160, 0.82)'],
    [0.28, 'rgba(255, 195, 95, 0.55)'],
    [0.45, 'rgba(255, 140, 55, 0.32)'],
    [0.65, 'rgba(255, 95, 50, 0.16)'],
    [0.85, 'rgba(220, 70, 40, 0.05)'],
    [1.0, 'rgba(220, 70, 40, 0)'],
  ])
}

/**
 * Cool variant for "energy absorbed" demos. Same smooth gradient
 * shape, but the palette runs through blue-cyan tones so the blob
 * reads as a cold sink that's drinking energy in rather than a hot
 * source releasing it.
 */
function buildCoolCloudTexture(): CanvasTexture {
  return buildRadialGradient([
    [0.0, 'rgba(220, 245, 255, 0.92)'],
    [0.12, 'rgba(160, 220, 255, 0.78)'],
    [0.28, 'rgba(100, 180, 255, 0.5)'],
    [0.45, 'rgba(70, 130, 235, 0.3)'],
    [0.65, 'rgba(60, 95, 210, 0.16)'],
    [0.85, 'rgba(70, 80, 180, 0.05)'],
    [1.0, 'rgba(70, 80, 180, 0)'],
  ])
}

/** Procedural radial-gradient texture builder shared by warm/cool
 *  cloud variants and the per-direction particle materials. */
function buildRadialGradient(stops: ReadonlyArray<readonly [number, string]>): CanvasTexture {
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
    for (const [offset, color] of stops) {
      grad.addColorStop(offset, color)
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, texSize, texSize)
  }
  return new CanvasTexture(canvas)
}

// (xorshift32 rng helper removed — particle plan now uses Math.random,
// which has better distribution. Kept the comment as a breadcrumb in
// case a future variant wants determinism back.)

// Color stops mirroring the cloud's gradient — each (t, [r,g,b]) pair
// says "at this fraction of the cloud's radius, the cloud reads as
// this color". Particles sample this gradient based on their current
// radial position so a particle near the center is the same warm
// near-white as the cloud's hot core, and a particle near the edge
// matches the cloud's outer red glow. Same idea for the cool variant.
// rgb values are 0..1 (Three.Color space).
type ColorStop = readonly [t: number, r: number, g: number, b: number]
const WARM_STOPS: readonly ColorStop[] = [
  [0.0, 1.0, 0.98, 0.86], // near-white core
  [0.18, 1.0, 0.92, 0.63], // hot yellow
  [0.4, 1.0, 0.76, 0.37], // amber
  [0.6, 1.0, 0.55, 0.21], // orange
  [0.8, 1.0, 0.37, 0.2], // orange-red
  [1.0, 0.86, 0.27, 0.16], // dim red
]
const COOL_STOPS: readonly ColorStop[] = [
  [0.0, 0.86, 0.96, 1.0],
  [0.18, 0.63, 0.86, 1.0],
  [0.4, 0.39, 0.7, 1.0],
  [0.6, 0.27, 0.51, 0.92],
  [0.8, 0.24, 0.37, 0.82],
  [1.0, 0.27, 0.31, 0.71],
]

/** Linear-interpolated colour at position t (0..1) through a stop
 *  list. Writes into the passed-in Color to avoid allocating a fresh
 *  one every frame per particle. */
function sampleColor(stops: readonly ColorStop[], t: number, out: Color): void {
  const clamped = Math.max(0, Math.min(1, t))
  // Find the segment.
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (!a || !b) continue
    if (clamped <= b[0]) {
      const span = b[0] - a[0]
      const localT = span > 0 ? (clamped - a[0]) / span : 0
      out.setRGB(
        a[1] + (b[1] - a[1]) * localT,
        a[2] + (b[2] - a[2]) * localT,
        a[3] + (b[3] - a[3]) * localT,
      )
      return
    }
  }
  const last = stops[stops.length - 1]
  if (last) out.setRGB(last[1], last[2], last[3])
}

/** Build a soft white-alpha radial gradient texture used as the
 *  per-particle sprite map. The texture is pure white throughout with
 *  only the ALPHA tapering off — particles get their color from the
 *  material's `color` (tint), which we update per-frame from the
 *  warm/cool gradient stops above. */
function buildParticleAlphaTexture(): CanvasTexture {
  return buildRadialGradient([
    [0.0, 'rgba(255, 255, 255, 0.55)'],
    [0.25, 'rgba(255, 255, 255, 0.32)'],
    [0.6, 'rgba(255, 255, 255, 0.09)'],
    [1.0, 'rgba(255, 255, 255, 0)'],
  ])
}

interface ParticlePlan {
  /** Unit-vector direction in 3D from cloud center. Distributed
   *  uniformly on the surface of a sphere so the starburst looks
   *  identical from any camera angle (not collapsed into a line
   *  when the camera sees the previously-flat xy distribution
   *  edge-on). */
  dir: [number, number, number]
  /** Unit-vector perpendicular to dir, used for sway displacement.
   *  Pre-computed so we don't need a cross-product every frame. */
  perp: [number, number, number]
  /** Loop period in seconds. */
  period: number
  /** Phase offset in 0..1 so particles aren't synced. */
  phase: number
  /** Per-particle visible scale (world units). */
  scale: number
  /** Sway amplitude (world units). */
  sway: number
  /** Sway frequency in Hz, per-particle. */
  swayFreq: number
  /** Travel-distance multiplier (0.4..1.0). */
  reach: number
  /** Exponential decay rate. Higher = faster fade. */
  decayRate: number
  /** Peak opacity this particle ever reaches (0.5..1.0). */
  peakOpacity: number
  /** Flicker frequency in Hz, per-particle. */
  flickerFreq: number
}

/**
 * Single soft glowing energy blob plus a directional particle effect.
 *
 * Exothermic ('released'): flame licks rise outward from the blob in
 * a fan toward the upper hemisphere, biased upward with horizontal
 * sway. Reads as fire venting energy out of the reaction site.
 *
 * Endothermic ('absorbed'): particles stream INWARD from a ring
 * around the blob, fading out as they reach the center. Reads as the
 * reaction site drinking ambient energy.
 *
 * The blob itself swaps to a cool blue-cyan palette in the absorbed
 * variant so the cold/source duality is also encoded in color.
 */
export function EnergyDisplay({ scale, direction = 'released', label }: EnergyDisplayProps) {
  // Endothermic / neutral reactions don't get an energy cloud at all.
  const clamped = Math.max(0, Math.min(5, scale))
  const size = BASE_SIZE + clamped * SIZE_PER_LEVEL

  // Cloud body — warm orange for released, cool blue for absorbed.
  // Material is mounted once per `direction` value via useMemo so we
  // don't rebuild the canvas texture on every render.
  const cloudMaterial = useMemo(() => {
    const texture = direction === 'released' ? buildWarmCloudTexture() : buildCoolCloudTexture()
    return new SpriteMaterial({
      map: texture,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      opacity: 1,
    })
  }, [direction])

  // Shadow plate behind the text. Procedural radial gradient with
  // NORMAL alpha blending so it darkens the bright additive cloud and
  // gives the dark label something to contrast against. Same recipe
  // regardless of direction — the text color is the same either way.
  const shadowMaterial = useMemo(() => {
    const texture = buildRadialGradient([
      [0.0, 'rgba(15, 5, 8, 0.78)'],
      [0.4, 'rgba(15, 5, 8, 0.55)'],
      [0.75, 'rgba(15, 5, 8, 0.15)'],
      [1.0, 'rgba(15, 5, 8, 0)'],
    ])
    return new SpriteMaterial({
      map: texture,
      transparent: true,
      blending: NormalBlending,
      depthWrite: false,
      toneMapped: false,
    })
  }, [])

  // Particle materials — ONE per particle so each can be tinted
  // independently each frame. The map is a shared white-alpha
  // texture (the same soft round dot for every particle); the
  // material's `color` provides the per-particle tint that we sample
  // from the warm/cool gradient based on each particle's current
  // radial position.
  //
  // useEffect cleanup disposes the texture + materials on unmount so
  // we don't leak GPU buffers across demos.
  const { particleMaterials, particleTexture } = useMemo(() => {
    const tex = buildParticleAlphaTexture()
    const mats: SpriteMaterial[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      mats.push(
        new SpriteMaterial({
          map: tex,
          transparent: true,
          blending: AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
      )
    }
    return { particleMaterials: mats, particleTexture: tex }
  }, [])
  useEffect(() => {
    return () => {
      particleTexture.dispose()
      for (const m of particleMaterials) m.dispose()
    }
  }, [particleTexture, particleMaterials])

  // Pick the active gradient based on direction. Each frame we sample
  // these stops at the particle's current radial fraction.
  const colorStops = direction === 'released' ? WARM_STOPS : COOL_STOPS

  // Pre-plan particle parameters. The plan stays stable across frames;
  // useFrame just reads it and computes each particle's transient
  // position/opacity from t.
  const particles = useMemo<ParticlePlan[]>(() => {
    // Math.random instead of the seeded xorshift32 — the deterministic
    // PRNG was producing correlated values (especially in lower bits,
    // which xorshift32 is weak on) that left the particle population
    // looking like it was breathing in sync. Plain Math.random has
    // strong distribution and the lack of frame-to-frame determinism
    // doesn't matter for a one-shot setup like this.
    const rand = Math.random
    const out: ParticlePlan[] = []
    // Fibonacci-sphere distribution gives ~even point coverage on
    // a unit sphere — particles emit in all 3D directions, not just
    // within a single plane. With the previous xy-plane (z=0)
    // distribution, orbit auto-rotation made the camera see the
    // plane edge-on at certain angles, collapsing the visible
    // particles into a line through the center.
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Very wide period range (0.4 – 4.8s, 12× ratio). The wider
      // this is, the more impossible it becomes for any subset of
      // particles to share a "spawn moment", because their cycle
      // boundaries land at radically different times. Anything
      // narrower (e.g. 0.7–2.9) was still letting groups of
      // particles wrap their cycles in close succession, which read
      // as the population blinking.
      const period = 0.4 + rand() * 4.4
      const phase = rand()
      const reach = 0.45 + rand() * 0.55
      const decayRate = 1.0 + rand() * 2.0
      // Capped at 0.25 per the design — the energy blob behind is
      // already bright; we want the particles to feel like wispy
      // overlays, not solid sprites.
      const peakOpacity = 0.1 + rand() * 0.15
      const flickerFreq = 4 + rand() * 4
      const swayFreq = 1.2 + rand() * 1.6

      // Fibonacci sphere point — y descends linearly from 1 to -1,
      // azimuth advances by the golden angle each step. Adding a small
      // amount of per-particle jitter on both axes keeps the pattern
      // from looking like a perfect spiral.
      const ySphere = 1 - (i / Math.max(1, PARTICLE_COUNT - 1)) * 2
      const yJitter = (rand() - 0.5) * 0.08
      const dirYRaw = Math.max(-1, Math.min(1, ySphere + yJitter))
      const ringRadius = Math.sqrt(Math.max(0, 1 - dirYRaw * dirYRaw))
      const azimuth = goldenAngle * i + (rand() - 0.5) * 0.3
      const dx = Math.cos(azimuth) * ringRadius
      const dz = Math.sin(azimuth) * ringRadius
      const dir: [number, number, number] = [dx, dirYRaw, dz]

      // Perpendicular for sway — any vector that's perpendicular to
      // dir. Use the cross product with the world-y axis, falling
      // back to world-x if dir IS world-y (would give zero vector).
      let perpX = -dz
      let perpY = 0
      let perpZ = dx
      let perpLen = Math.hypot(perpX, perpY, perpZ)
      if (perpLen < 1e-4) {
        // dir was ~vertical; use world-x as the cross-product input.
        perpX = 0
        perpY = -dz
        perpZ = dirYRaw
        perpLen = Math.hypot(perpX, perpY, perpZ) || 1
      }
      const perp: [number, number, number] = [perpX / perpLen, perpY / perpLen, perpZ / perpLen]

      if (direction === 'released') {
        out.push({
          dir,
          perp,
          period,
          phase,
          scale: 0.32 + rand() * 0.32,
          sway: 0.12 + rand() * 0.14,
          swayFreq,
          reach,
          decayRate,
          peakOpacity,
          flickerFreq,
        })
      } else {
        out.push({
          dir,
          perp,
          period,
          phase,
          scale: 0.26 + rand() * 0.24,
          sway: 0.05 + rand() * 0.08,
          swayFreq,
          reach,
          decayRate,
          peakOpacity,
          flickerFreq,
        })
      }
    }
    return out
  }, [direction])

  const cloudSpriteRef = useRef<Sprite>(null)
  const particleGroupRef = useRef<Group>(null)
  const baseSizeRef = useRef(size)
  // Reusable scratch Color so we don't allocate one per-particle-per-
  // frame just to compute the sampled gradient colour.
  const scratchColor = useRef(new Color())

  useFrame(() => {
    const t = performance.now() / 1000

    // Cloud breathe + opacity flicker (same as before).
    const cloud = cloudSpriteRef.current
    if (cloud) {
      const breathe = 1 + 0.06 * Math.sin(t * 2.4)
      cloud.scale.setScalar(baseSizeRef.current * breathe)
      const flicker = 0.94 + 0.06 * Math.sin(t * 3.7 + 1.3)
      const mat = cloud.material as { opacity?: number }
      if (mat.opacity !== undefined) mat.opacity = flicker
    }

    // Particle update. For each particle compute its current u in
    // 0..1 based on time + phase + period. Map u to position:
    //   released: rise from cloud edge (u=0) out to ~1.6× cloud
    //             radius (u=1), then loop.
    //   absorbed: fall from outer ring (u=0) inward to center
    //             (u=1), then loop.
    // Opacity rides a soft envelope so particles fade in at spawn
    // and out at the end of their travel.
    const group = particleGroupRef.current
    if (!group) return
    const cloudRadius = baseSizeRef.current * 0.5
    // Particles peak somewhere between innerR (inside the cloud) and
    // outerR (just barely past the cloud's visible edge). Was
    // 1.0×–1.25× cloudRadius which let plenty of particles travel
    // well past the blob — visually the sparks looked detached.
    // Tightening to 0.55× – 1.05× keeps the entire effect hugging
    // the blob.
    const innerR = cloudRadius * 0.55
    const outerR = cloudRadius * 1.05
    for (let i = 0; i < group.children.length; i++) {
      const child = group.children[i]
      const p = particles[i]
      if (!child || !p) continue
      const u = (((t / p.period + p.phase) % 1) + 1) % 1
      const peakR = innerR + (outerR - innerR) * p.reach
      // BRIGHT at spawn, exponential decay as the particle travels.
      // This fixes the "ring at the cloud's edge" — the previous
      // ramp-up-then-fade envelope meant particles were invisible at
      // the center (where they spawn) and most visible after they'd
      // already travelled some distance. Now they're at full brightness
      // right when they emerge AND they FADE as they fly outward.
      //
      // Per-particle decayRate (1.8–7.3) means some particles barely
      // make it out of the cloud before vanishing while others smoulder
      // all the way to peakR — wildly different visible lifetimes.
      const envelope = Math.exp(-u * p.decayRate)
      let opacity = envelope * p.peakOpacity
      let r: number
      if (direction === 'released') {
        // Burst OUT from the blob center.
        r = peakR * u
        opacity *= 0.75 + 0.25 * Math.sin(t * p.flickerFreq + i * 1.3)
      } else {
        // Stream INTO the blob center. Particle starts at peakR
        // (outer ring) and approaches center as u increases.
        r = peakR * (1 - u)
        opacity *= 0.85
      }
      const swayAmount = p.sway * Math.sin(t * p.swayFreq + i * 0.7)
      const [dx, dy, dz] = p.dir
      const [px, py, pz] = p.perp
      child.position.set(
        dx * r + px * swayAmount,
        dy * r + py * swayAmount,
        dz * r + pz * swayAmount,
      )
      const sizeBoost = direction === 'released' ? 1 + 0.35 * (1 - Math.abs(u - 0.3) / 0.7) : 1
      child.scale.setScalar(p.scale * sizeBoost)
      // Tint each particle from the cloud's gradient based on its
      // current radial position. r / cloudRadius gives a fraction of
      // the cloud's radius (0 = center, 1 = edge, >1 = past edge).
      // Particles near the center get the bright near-white core
      // color; particles near the edge get the dim outer red (warm)
      // or dim blue (cool). Result: particles look like they're
      // "inheriting" the cloud's color where they are.
      const mat = particleMaterials[i]
      if (mat) {
        sampleColor(colorStops, r / cloudRadius, scratchColor.current)
        mat.color.copy(scratchColor.current)
        mat.opacity = Math.max(0, opacity)
      }
    }
  })

  baseSizeRef.current = size

  if (clamped === 0) return null

  return (
    <group position={CLOUD_POSITION}>
      {/* Particles render BEFORE the cloud so the cloud (additive)
          blends on top, which gives the flames a "they're coming
          out of the cloud" feel for released and lets the cloud
          consume incoming particles for absorbed. */}
      <group ref={particleGroupRef}>
        {particles.map((_, i) => (
          <sprite
            // biome-ignore lint/suspicious/noArrayIndexKey: particle order stable per direction
            key={`p-${i}`}
            material={particleMaterials[i]}
            scale={0.01}
          />
        ))}
      </group>
      <sprite ref={cloudSpriteRef} material={cloudMaterial} scale={size} />

      {/* Energy magnitude — billboarded 3D text embedded inside the
          blob with a soft shadow plate underneath for contrast.
          The dark fill alone is readable when the text sits over the
          bright cloud center, but long labels (e.g. "−411 kJ/mol per
          NaCl") extend past the cloud's bright zone onto the dark
          space background where dark-red letters vanish. A warm-white
          outline gives every letter a halo that reads against BOTH
          backgrounds. */}
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
            outlineWidth={0.018}
            outlineColor="#fff5b8"
            outlineOpacity={0.85}
          >
            {label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
