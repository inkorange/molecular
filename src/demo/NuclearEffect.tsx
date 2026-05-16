'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { type Group, Vector3 } from 'three'
import { ElectronSprite } from '@/src/scene/ElectronSprite'

interface NuclearEffectProps {
  /** Which kind of nuclear event to render. */
  kind: 'fusion' | 'fission'
  /** When did the current transition phase begin (performance.now). */
  phaseStartedAt: number
  /** Total transition duration in ms. */
  durationMs: number
}

// === Fusion recipe ===
// Particles stream INWARD from the ingredient atom positions (two opposed
// sides of the x axis), converge at the origin around the visual peak,
// and a single neutron is ejected after the merge.
const FUSION = {
  plasmaCount: 70,
  // Atoms in the demo player's Ingredients layout sit at roughly ±3.5
  // on x for a 2-unit demo with the default spacing (2.6). Starting the
  // streaks from there sells the "the atoms slammed into each other".
  plasmaStartX: 3.5,
  plasmaSpread: 1.4,
  palette: ['#5cc6ff', '#a4d8ff', '#dffaff', '#fff5b8', '#ffd97a'],
  // Bright moment lands at t=0.5 — middle of the combine transition,
  // matching the TransitionFlash peak so the two effects punctuate
  // each other.
  peakAt: 0.5,
  spriteScale: 0.2,
  // The single neutron emitted after the merge. Travels ~6 units in
  // a random direction after t > peakAt.
  neutronTravel: 6.5,
  neutronScale: 0.16,
}

// === Fission recipe ===
// One central atom explodes — particles + shrapnel radiate outward,
// and three neutrons fly off in different directions a beat after the
// initial burst. Mimics the canonical U-235 chain-reaction signature.
const FISSION = {
  shrapnelCount: 100,
  shrapnelTravel: 3.5,
  // Three neutrons — the classic uranium-235 product count, and what
  // makes a chain reaction physically possible (each emitted neutron
  // can trigger another fission event).
  neutronCount: 3,
  neutronTravel: 6.5,
  palette: ['#ff5a3a', '#ff7a8c', '#ffd97a', '#fff5b8', '#ec59b6'],
  // Earlier peak than fusion — fission feels more like a sudden burst
  // than a gradual squeeze.
  peakAt: 0.4,
  spriteScale: 0.22,
  neutronScale: 0.16,
}

interface PlasmaParticle {
  start: Vector3
  color: string
  /** Phase offset 0..1 — staggers particles so the burst feels organic. */
  offset: number
}

interface ShrapnelParticle {
  dir: Vector3
  color: string
  offset: number
}

interface Neutron {
  dir: Vector3
}

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
 * Dramatic VFX overlay for nuclear demos. Two distinct visual recipes:
 *
 * **Fusion** — plasma streaks stream inward from both ingredient atom
 * positions, converging at the origin in time with the central flash.
 * After the merge, a single high-energy neutron shoots off in a random
 * direction. Reads as "two nuclei slamming together and fusing".
 *
 * **Fission** — shrapnel particles radiate outward from a single central
 * atom and three neutrons are ejected a beat later. Reads as a runaway
 * chain reaction initiating.
 *
 * Distinct from `<ReactionEffect>` (which handles the five chemistry
 * effect kinds) because the motion vocabulary differs enough that
 * shoehorning it into the same RECIPES table would have meant either
 * a bunch of conditional branches or a generic "particles" recipe that
 * felt the same as combustion.
 */
export function NuclearEffect({ kind, phaseStartedAt, durationMs }: NuclearEffectProps) {
  const groupRef = useRef<Group>(null)

  // Pre-compute particle plans once per kind. The deterministic PRNG seeds
  // off the kind so the same demo always gets the same particle layout —
  // useful when iterating on the visual without reloading the page.
  const plan = useMemo(() => {
    if (kind === 'fusion') {
      const rand = rng(0xfa50)
      const plasma: PlasmaParticle[] = []
      for (let i = 0; i < FUSION.plasmaCount; i++) {
        // Alternate which side this streak originates from so the two
        // ingredient atoms each contribute roughly half the plasma.
        const onLeft = i % 2 === 0
        const sideX = onLeft ? -FUSION.plasmaStartX : FUSION.plasmaStartX
        const sx = sideX + (rand() - 0.5) * FUSION.plasmaSpread
        const sy = (rand() - 0.5) * FUSION.plasmaSpread
        const sz = (rand() - 0.5) * FUSION.plasmaSpread
        plasma.push({
          start: new Vector3(sx, sy, sz),
          color: FUSION.palette[i % FUSION.palette.length] ?? '#dffaff',
          offset: rand() * 0.18,
        })
      }
      // One neutron, random direction off-axis.
      const theta = rand() * Math.PI * 2
      const phi = Math.acos(2 * rand() - 1)
      const dx = Math.cos(theta) * Math.sin(phi)
      const dy = Math.sin(theta) * Math.sin(phi)
      const dz = Math.cos(phi)
      const neutrons: Neutron[] = [{ dir: new Vector3(dx, dy, dz) }]
      return { kind: 'fusion' as const, plasma, neutrons }
    }
    // fission
    const rand = rng(0xf155)
    const shrapnel: ShrapnelParticle[] = []
    for (let i = 0; i < FISSION.shrapnelCount; i++) {
      const theta = rand() * Math.PI * 2
      const phi = Math.acos(2 * rand() - 1)
      const dx = Math.cos(theta) * Math.sin(phi)
      const dy = Math.sin(theta) * Math.sin(phi)
      const dz = Math.cos(phi)
      shrapnel.push({
        dir: new Vector3(dx, dy, dz),
        color: FISSION.palette[i % FISSION.palette.length] ?? '#ff7a8c',
        offset: rand() * 0.18,
      })
    }
    // Three neutrons evenly spaced around the equator, with small
    // randomised jitter so they don't read as a perfect tripod.
    const neutrons: Neutron[] = []
    for (let i = 0; i < FISSION.neutronCount; i++) {
      const theta = (i / FISSION.neutronCount) * Math.PI * 2 + (rand() - 0.5) * 0.4
      const phi = Math.PI / 2 + (rand() - 0.5) * 0.6
      const dx = Math.cos(theta) * Math.sin(phi)
      const dy = Math.sin(theta) * Math.sin(phi)
      const dz = Math.cos(phi)
      neutrons.push({ dir: new Vector3(dx, dy, dz) })
    }
    return { kind: 'fission' as const, shrapnel, neutrons }
  }, [kind])

  // Each frame we walk the group's children in JSX render order:
  // primary-particles first, neutrons after. This index-based walk is
  // brittle if the JSX ordering changes — keep them aligned.
  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const t = Math.min(1, Math.max(0, (performance.now() - phaseStartedAt) / durationMs))
    const children = g.children

    if (plan.kind === 'fusion') {
      let idx = 0
      // Plasma streaks: linear interpolate from start position toward
      // origin as t advances. Opacity rides a triangle envelope around
      // the recipe peak.
      for (let i = 0; i < plan.plasma.length; i++) {
        const child = children[idx++]
        const p = plan.plasma[i]
        if (!child || !p) continue
        const tt = Math.max(0, Math.min(1, t + p.offset - 0.05))
        const k = tt
        child.position.set(p.start.x * (1 - k), p.start.y * (1 - k), p.start.z * (1 - k))
        const env =
          tt < FUSION.peakAt ? tt / FUSION.peakAt : 1 - (tt - FUSION.peakAt) / (1 - FUSION.peakAt)
        setOpacity(child, Math.max(0, env))
      }
      // Neutron: only emerges after the merge peak. tt = 0 until peak,
      // then ramps to 1 by t=1.
      for (let i = 0; i < plan.neutrons.length; i++) {
        const child = children[idx++]
        const n = plan.neutrons[i]
        if (!child || !n) continue
        const tt = Math.max(0, (t - FUSION.peakAt) / (1 - FUSION.peakAt))
        const dist = tt * FUSION.neutronTravel
        child.position.set(n.dir.x * dist, n.dir.y * dist, n.dir.z * dist)
        // Fade in then trail off.
        setOpacity(child, tt > 0 ? Math.max(0, 1 - tt * 0.6) : 0)
      }
      return
    }

    // fission
    let idx = 0
    for (let i = 0; i < plan.shrapnel.length; i++) {
      const child = children[idx++]
      const s = plan.shrapnel[i]
      if (!child || !s) continue
      const tt = Math.max(0, Math.min(1, t + s.offset - 0.05))
      const dist = FISSION.shrapnelTravel * tt
      child.position.set(s.dir.x * dist, s.dir.y * dist, s.dir.z * dist)
      const env =
        tt < FISSION.peakAt ? tt / FISSION.peakAt : 1 - (tt - FISSION.peakAt) / (1 - FISSION.peakAt)
      setOpacity(child, Math.max(0, env))
    }
    // Neutrons emerge slightly after the initial burst — sells the
    // "chain-reaction trigger" payoff.
    const NEUTRON_DELAY = 0.25
    for (let i = 0; i < plan.neutrons.length; i++) {
      const child = children[idx++]
      const n = plan.neutrons[i]
      if (!child || !n) continue
      const tt = Math.max(0, t - NEUTRON_DELAY)
      const dist = tt * FISSION.neutronTravel
      child.position.set(n.dir.x * dist, n.dir.y * dist, n.dir.z * dist)
      setOpacity(child, tt > 0 ? Math.max(0, 1 - tt * 0.55) : 0)
    }
  })

  return (
    <group ref={groupRef}>
      {plan.kind === 'fusion' &&
        plan.plasma.map((p, i) => (
          <ElectronSprite
            // biome-ignore lint/suspicious/noArrayIndexKey: stable layout per kind
            key={`fus-p-${i}`}
            position={[p.start.x, p.start.y, p.start.z]}
            scale={FUSION.spriteScale}
            color={p.color}
            opacity={0}
          />
        ))}
      {plan.kind === 'fusion' &&
        plan.neutrons.map((_, i) => (
          <ElectronSprite
            // biome-ignore lint/suspicious/noArrayIndexKey: stable layout per kind
            key={`fus-n-${i}`}
            position={[0, 0, 0]}
            scale={FUSION.neutronScale}
            color="#dffaff"
            opacity={0}
          />
        ))}
      {plan.kind === 'fission' &&
        plan.shrapnel.map((s, i) => (
          <ElectronSprite
            // biome-ignore lint/suspicious/noArrayIndexKey: stable layout per kind
            key={`fis-s-${i}`}
            position={[0, 0, 0]}
            scale={FISSION.spriteScale}
            color={s.color}
            opacity={0}
          />
        ))}
      {plan.kind === 'fission' &&
        plan.neutrons.map((_, i) => (
          <ElectronSprite
            // biome-ignore lint/suspicious/noArrayIndexKey: stable layout per kind
            key={`fis-n-${i}`}
            position={[0, 0, 0]}
            scale={FISSION.neutronScale}
            color="#a4ff8c"
            opacity={0}
          />
        ))}
    </group>
  )
}

/**
 * Set a sprite's material opacity. ElectronSprite renders as a single
 * mesh with an `opacity`-bearing material; we cast through `unknown`
 * because Object3D's typed children don't expose `material`, but every
 * child we put under this group is a mesh that does.
 */
function setOpacity(child: unknown, opacity: number) {
  const m = (child as { material?: { opacity?: number } }).material
  if (m) m.opacity = opacity
}
