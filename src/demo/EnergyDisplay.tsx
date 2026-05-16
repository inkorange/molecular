'use client'

import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, type Group, Vector3 } from 'three'
import type { EnergyScale } from '@/src/data/demonstrations'
import { ElectronSprite } from '@/src/scene/ElectronSprite'

interface EnergyDisplayProps {
  /** Relative energy magnitude (0–5). 0 hides the display entirely. */
  scale: EnergyScale
  /** Human-readable energy magnitude shown beside the bar (e.g. "17.6 MeV"). */
  label?: string
}

// Segments + spacing for the 3D energy bar. The bar reads as a
// thermometer: a column of cells stacked vertically, where the cells up
// to `scale` are lit and the rest are inert. Five cells matches the
// EnergyScale value range so each level maps to exactly one cell.
const SEGMENTS = 5
const SEGMENT_HEIGHT = 0.42
const SEGMENT_GAP = 0.06
const SEGMENT_WIDTH = 0.5
const SEGMENT_DEPTH = 0.18
// Where the bar sits in world coords. Down + right of the product
// cluster so it doesn't crowd the products. The +z pulls it slightly
// toward the camera so it reads as a foreground UI element.
const BAR_POSITION: [number, number, number] = [4.6, -2.0, 0.5]

// Number of ambient energy "quanta" (small additive sprites) released
// per energy-scale level. Scales linearly so a level-5 reaction gets a
// thick swarm and a level-1 reaction emits a few wisps.
const QUANTA_PER_LEVEL = 8

// Cell color per scale level — runs cool→hot so the bar reads as a
// temperature gauge. Level 0 is unlit; levels 1–5 ramp through the
// reaction-type palette already used elsewhere in the app.
const CELL_PALETTE: readonly string[] = [
  '#5cc6ff', // 1 — cool cyan
  '#a4ff8c', // 2 — green
  '#ffd97a', // 3 — yellow
  '#ff7a8c', // 4 — pink
  '#ff5a3a', // 5 — orange-red (nuclear)
]

function rng(seed: number) {
  let s = seed | 0 || 0xb01dface
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 0x10000) / 0x10000
  }
}

/**
 * 3D readout for the reaction's energy release.
 *
 * Two layers:
 * 1. A vertical "thermometer" bar to the right of the products. Five
 *    cells stacked bottom-to-top — cells lit up to `scale`, the rest
 *    rendered as inert dark cells. Top cell glows brightest. A small
 *    pulsing animation rides the topmost lit cell so the eye is drawn
 *    to it.
 * 2. A swarm of ambient energy quanta (additive sprite particles) that
 *    drift upward around the bar. Count grows with `scale` so a strong
 *    reaction visibly radiates more energy than a mild one.
 *
 * A floating text label ("17.6 MeV") sits to the right of the bar so
 * students get both the qualitative magnitude and the numeric value.
 */
export function EnergyDisplay({ scale, label }: EnergyDisplayProps) {
  // Clamp to the valid range. scale=0 hides the bar entirely — early
  // return at the JSX level rather than trying to render an empty bar.
  const clamped = Math.max(0, Math.min(SEGMENTS, scale)) as EnergyScale

  // Particle slots — generate once per scale value.
  type Quantum = { base: Vector3; speed: number; phase: number; color: string; offset: number }
  const quanta = useMemo<Quantum[]>(() => {
    if (clamped === 0) return []
    const count = clamped * QUANTA_PER_LEVEL
    const rand = rng(clamped * 9173 + 17)
    const out: Quantum[] = []
    // Color of each quantum varies through the lit portion of the
    // palette — a level-5 reaction draws on all 5 colors; a level-2
    // reaction only uses the bottom two.
    const litColors = CELL_PALETTE.slice(0, clamped)
    for (let i = 0; i < count; i++) {
      // Spawn in a column around the bar position, slightly randomized.
      const sx = BAR_POSITION[0] + (rand() - 0.5) * (SEGMENT_WIDTH + 0.2)
      const sy =
        BAR_POSITION[1] - SEGMENT_HEIGHT * 0.5 + rand() * SEGMENTS * (SEGMENT_HEIGHT + SEGMENT_GAP)
      const sz = BAR_POSITION[2] + (rand() - 0.5) * 0.5
      out.push({
        base: new Vector3(sx, sy, sz),
        speed: 0.4 + rand() * 0.5,
        phase: rand() * Math.PI * 2,
        color: litColors[i % litColors.length] ?? '#fff5b8',
        offset: rand(),
      })
    }
    return out
  }, [clamped])

  const quantaGroupRef = useRef<Group>(null)
  // Pulse on the topmost lit cell — a value in 0..1 that ramps up and
  // down on a sine. Recomputed each frame, applied to the cell material.
  const pulseRef = useRef<number>(0)

  useFrame(() => {
    const t = performance.now() / 1000
    pulseRef.current = 0.6 + 0.4 * Math.sin(t * 2.2)
    const g = quantaGroupRef.current
    if (!g) return
    // Drift quanta upward, looping back to the base when they exit
    // the top of the bar. Opacity tapers near the top so they fade
    // out rather than clipping.
    const barTop =
      BAR_POSITION[1] + SEGMENTS * (SEGMENT_HEIGHT + SEGMENT_GAP) - SEGMENT_HEIGHT * 0.5
    const barBottom = BAR_POSITION[1] - SEGMENT_HEIGHT * 0.5
    const span = barTop - barBottom
    for (let i = 0; i < g.children.length; i++) {
      const child = g.children[i]
      const q = quanta[i]
      if (!child || !q) continue
      // Phase that loops 0..1, offset per quantum so they don't move
      // in lockstep.
      const u = (((t * q.speed + q.offset) % 1) + 1) % 1
      const y = barBottom + u * span * 1.4 // overshoot the top so they fade out off-bar
      const sway = Math.sin(t * 1.1 + q.phase) * 0.15
      child.position.set(q.base.x + sway, y, q.base.z)
      // Opacity envelope — full opacity for 0.1 < u < 0.7, then fade out.
      const opacity = u < 0.1 ? u * 10 : u > 0.7 ? Math.max(0, 1 - (u - 0.7) / 0.3) : 1
      const sprite = child as unknown as { material?: { opacity?: number } }
      if (sprite.material) sprite.material.opacity = opacity * 0.9
    }
  })

  // Hide entirely when no energy is released. Cleaner than rendering an
  // all-dark bar for endothermic / neutral reactions — those demos
  // don't need a measurement gauge at all.
  if (clamped === 0) return null

  return (
    <group>
      {/* Static label centered above the bar — "ENERGY" cap. Billboards
          face camera so the text stays readable as the scene rotates. */}
      <Billboard
        position={[
          BAR_POSITION[0],
          BAR_POSITION[1] + SEGMENTS * (SEGMENT_HEIGHT + SEGMENT_GAP) + 0.2,
          BAR_POSITION[2],
        ]}
      >
        <Text
          fontSize={0.22}
          color="#9aa0c8"
          anchorX="center"
          anchorY="bottom"
          fontWeight="bold"
          material-toneMapped={false}
        >
          ENERGY
        </Text>
      </Billboard>

      {/* The thermometer bar — N cells stacked bottom-to-top. */}
      {Array.from({ length: SEGMENTS }).map((_, i) => {
        const lit = i < clamped
        const cellY =
          BAR_POSITION[1] +
          i * (SEGMENT_HEIGHT + SEGMENT_GAP) -
          (SEGMENTS * (SEGMENT_HEIGHT + SEGMENT_GAP)) / 2 +
          SEGMENT_HEIGHT / 2
        const color = lit ? (CELL_PALETTE[i] ?? '#fff5b8') : '#1a1735'
        // Each lit cell glows; the brightest is the topmost lit cell
        // (i === clamped - 1) so the bar reads as "filled to here".
        const isTopLit = i === clamped - 1
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: cell index is the position
          <group key={`cell-${i}`} position={[BAR_POSITION[0], cellY, BAR_POSITION[2]]}>
            <mesh>
              <boxGeometry args={[SEGMENT_WIDTH, SEGMENT_HEIGHT, SEGMENT_DEPTH]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            {/* Glow halo around lit cells only — additive sprite-ish
                pass that bloom can pick up. Slightly larger than the
                cell so the edges feel lit-from-within. */}
            {lit && (
              <mesh>
                <boxGeometry
                  args={[SEGMENT_WIDTH * 1.25, SEGMENT_HEIGHT * 1.1, SEGMENT_DEPTH * 1.4]}
                />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={isTopLit ? 0.55 : 0.25}
                  blending={AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
            )}
            {/* Pulsing top cap on the topmost lit cell so the eye is
                drawn to where the bar "ends" — same role as the bright
                tip of a thermometer reading. */}
            {isTopLit && <PulsingCap color={color} pulseRef={pulseRef} />}
          </group>
        )
      })}

      {/* Numeric label — the exact magnitude beside the bar. Optional
          per demo; omitted demos still get the visual gauge. */}
      {label && (
        <Billboard
          position={[
            BAR_POSITION[0] + SEGMENT_WIDTH + 0.6,
            BAR_POSITION[1] +
              (clamped - SEGMENTS / 2) * (SEGMENT_HEIGHT + SEGMENT_GAP) -
              SEGMENT_HEIGHT / 2,
            BAR_POSITION[2],
          ]}
        >
          <Text
            fontSize={0.28}
            color={CELL_PALETTE[clamped - 1] ?? '#fff5b8'}
            anchorX="left"
            anchorY="middle"
            fontWeight="bold"
            material-toneMapped={false}
          >
            {label}
          </Text>
        </Billboard>
      )}

      {/* Ambient energy quanta — small additive sprites drifting upward
          around the bar. Count scales with energy magnitude. */}
      <group ref={quantaGroupRef}>
        {quanta.map((q, i) => (
          <ElectronSprite
            // biome-ignore lint/suspicious/noArrayIndexKey: quanta order stable per scale
            key={`q-${i}`}
            position={[q.base.x, q.base.y, q.base.z]}
            scale={0.14}
            color={q.color}
            opacity={0}
          />
        ))}
      </group>
    </group>
  )
}

/**
 * Bright pulsing cap on the topmost lit cell of the energy bar. Reads
 * as the "active reading" of the gauge — drives student attention to
 * where the bar terminates.
 */
function PulsingCap({ color, pulseRef }: { color: string; pulseRef: { current: number } }) {
  const capRef = useRef<{ material?: { opacity?: number } }>(null)

  useFrame(() => {
    const c = capRef.current
    if (!c || !c.material) return
    c.material.opacity = pulseRef.current
  })

  return (
    <mesh ref={capRef as never} position={[0, SEGMENT_HEIGHT / 2 + 0.08, 0]}>
      <sphereGeometry args={[0.16, 16, 12]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={1}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
