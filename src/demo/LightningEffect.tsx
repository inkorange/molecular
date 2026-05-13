'use client'

import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'

interface LightningEffectProps {
  /** When did the current transition phase begin (performance.now). */
  phaseStartedAt: number
  /** Total transition duration in ms. */
  durationMs: number
}

// Number of bolts to fire across the transition window.
const BOLT_COUNT = 7
// Each segment in a bolt is a control point along its jagged path.
const BOLT_SEGMENTS = 14
// How long an individual bolt stays visible (ms).
const BOLT_LIFE_MS = 220
// World distance from origin at which bolts originate. Slightly outside
// the camera frame at z=8 fov=45 (visible halfwidth ≈ 3.3).
const BOLT_LENGTH_MIN = 4.5
const BOLT_LENGTH_MAX = 6.5
// Perpendicular jaggedness — how far each segment can wobble off the
// bolt's straight line. Larger = wilder.
const JAGGEDNESS = 0.55

const COLOR = '#8de1ff'

interface Bolt {
  points: [number, number, number][]
  /** Spawn time offset from phaseStartedAt, in ms. */
  spawnDelayMs: number
}

// Tiny deterministic xorshift32 so the same demo+transition gets the same
// bolts on each replay rather than re-randomising every frame.
function rng(seed: number) {
  let s = seed | 0 || 0xc01dface
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 0x10000) / 0x10000
  }
}

/**
 * Build one jagged bolt: a polyline from a point on the edge ring toward
 * world origin, with the intermediate segments offset perpendicularly by
 * random amounts so the line zig-zags like a real lightning strike. The
 * endpoints stay clean (no offset) so the bolt clearly starts off-screen
 * and ends at the action.
 */
function makeBolt(rand: () => number, durationMs: number): Bolt {
  const angle = rand() * Math.PI * 2
  const length = BOLT_LENGTH_MIN + rand() * (BOLT_LENGTH_MAX - BOLT_LENGTH_MIN)
  const dirX = Math.cos(angle)
  const dirY = Math.sin(angle)
  // Perpendicular axis in 2D — 90° counter-clockwise from the bolt's
  // direction. Used to offset segment points sideways.
  const perpX = -dirY
  const perpY = dirX

  const points: [number, number, number][] = []
  for (let i = 0; i <= BOLT_SEGMENTS; i++) {
    const t = i / BOLT_SEGMENTS
    // Distance along the bolt: t=0 is far (length), t=1 is at origin.
    const distance = length * (1 - t)
    // Don't jiggle the endpoints — keeps the bolt visibly anchored.
    const isEnd = i === 0 || i === BOLT_SEGMENTS
    const offset = isEnd ? 0 : (rand() - 0.5) * JAGGEDNESS
    // A small z wobble too so the bolt isn't perfectly flat.
    const zOffset = isEnd ? 0 : (rand() - 0.5) * 0.3
    points.push([dirX * distance + perpX * offset, dirY * distance + perpY * offset, zOffset])
  }

  // Spread spawn times across the first ~80% of the transition so every
  // bolt has time to fade before the products fully appear.
  const spawnDelayMs = rand() * durationMs * 0.8
  return { points, spawnDelayMs }
}

/**
 * Lightning overlay for demos with `energySource: 'electricity'` (e.g.
 * water electrolysis). Fires a handful of jagged bolts striking inward
 * from outside the camera frame during the combine transition, each
 * flashing bright cyan then fading. Layered ON TOP of the regular
 * ReactionEffect — the particle burst conveys the bonds breaking, the
 * lightning conveys why.
 */
export function LightningEffect({ phaseStartedAt, durationMs }: LightningEffectProps) {
  const groupRef = useRef<Group>(null)

  const bolts = useMemo<Bolt[]>(() => {
    // Seed by the integer ms phase-start time so every replay of the same
    // demo at the same start time gets the same bolts — but different
    // demos / different transitions get different layouts.
    const rand = rng(Math.floor(phaseStartedAt))
    return Array.from({ length: BOLT_COUNT }, () => makeBolt(rand, durationMs))
  }, [phaseStartedAt, durationMs])

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const elapsed = performance.now() - phaseStartedAt
    g.children.forEach((child, i) => {
      const bolt = bolts[i]
      if (!bolt) return
      const localElapsed = elapsed - bolt.spawnDelayMs
      let opacity = 0
      if (localElapsed >= 0 && localElapsed <= BOLT_LIFE_MS) {
        // Sharp attack, fade trail. Squared decay so the bolt feels like a
        // genuine flash rather than a slow ramp.
        const k = localElapsed / BOLT_LIFE_MS
        opacity = (1 - k) ** 2
      }
      // drei Line wraps Line2 — its material is .material (LineMaterial).
      // Mutating opacity directly avoids re-rendering the whole React
      // subtree every frame.
      const line = child as { material?: { opacity?: number; transparent?: boolean } }
      if (line.material) {
        line.material.opacity = opacity
        line.material.transparent = true
      }
    })
  })

  return (
    <group ref={groupRef}>
      {bolts.map((bolt, i) => (
        <Line
          // biome-ignore lint/suspicious/noArrayIndexKey: bolt order stable across frames
          key={`b-${i}`}
          points={bolt.points}
          color={COLOR}
          lineWidth={3}
          transparent
          opacity={0}
        />
      ))}
    </group>
  )
}
