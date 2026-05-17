'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { type Group, Vector3 } from 'three'
import type { Demonstration } from '@/src/data/demonstrations'
import { ElectronSprite } from '@/src/scene/ElectronSprite'

// ReactionEffect only handles chemistry effect kinds. Nuclear kinds
// (fusion / fission) get their own dramatic VFX path via NuclearEffect,
// so excluding them here keeps the recipe table small and forces
// DemoPlayer to route nuclear demos correctly.
type ChemEffectKind = Exclude<Demonstration['effectKind'], 'fusion' | 'fission' | 'decay'>

interface ReactionEffectProps {
  /** Tags the visual vocabulary — synthesis/combustion/decomposition/
   *  neutralization/displacement. */
  kind: ChemEffectKind
  /** When did the current transition phase begin (performance.now). */
  phaseStartedAt: number
  /** Total transition duration in ms. The effect peaks around t≈0.6 and
   *  fades by t=1.0. */
  durationMs: number
}

// Per-kind tuning. Particle count, base color, motion vocabulary, and the
// peak time within the transition window where the burst is loudest.
const RECIPES: Record<
  ChemEffectKind,
  {
    /** How many particles to spawn. Capped for perf. */
    count: number
    /** Base spawn radius (units). */
    spawnRadius: number
    /** How far each particle travels by the end (units). */
    travel: number
    /** Hex colors cycled through per-particle. */
    palette: readonly string[]
    /** Where in (0..1) the burst peaks. Earlier = punchier. */
    peakAt: number
    /** 'outward' = exothermic (radiates from center).
     *  'inward' = endothermic (collapses toward center). */
    motion: 'outward' | 'inward'
    /** Per-particle sprite scale (world units). */
    spriteScale: number
  }
> = {
  synthesis: {
    count: 60,
    spawnRadius: 0.4,
    travel: 2.2,
    palette: ['#5cc6ff', '#ec59b6', '#ffd97a', '#dffaff'],
    peakAt: 0.55,
    motion: 'outward',
    spriteScale: 0.18,
  },
  combustion: {
    count: 110,
    spawnRadius: 0.3,
    travel: 3.2,
    palette: ['#ff7a8c', '#ffd97a', '#ff5a3a', '#fff5b8'],
    peakAt: 0.5,
    motion: 'outward',
    spriteScale: 0.24,
  },
  decomposition: {
    count: 80,
    spawnRadius: 2.5,
    travel: 2.5,
    palette: ['#c89eff', '#5cc6ff', '#dffaff'],
    peakAt: 0.6,
    motion: 'inward',
    spriteScale: 0.18,
  },
  neutralization: {
    count: 45,
    spawnRadius: 0.3,
    travel: 1.6,
    palette: ['#a4ff8c', '#dffaff', '#7ad6ff'],
    peakAt: 0.6,
    motion: 'outward',
    spriteScale: 0.16,
  },
  displacement: {
    count: 50,
    spawnRadius: 0.4,
    travel: 2.6,
    palette: ['#ffd97a', '#ff7a8c', '#dffaff'],
    peakAt: 0.5,
    motion: 'outward',
    spriteScale: 0.2,
  },
}

interface Particle {
  base: Vector3
  dir: Vector3
  color: string
  /** Phase offset 0..1 — staggers individual particles around peakAt so
   *  the burst feels organic rather than hitting all at once. */
  offset: number
}

function rng(seed: number) {
  // Tiny deterministic PRNG so the same demo gets the same particle layout
  // every run. xorshift32, seeded by `seed`.
  let s = seed | 0 || 0xb01dface
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    // Map to [0, 1)
    return ((s >>> 0) % 0x10000) / 0x10000
  }
}

/**
 * Burst of sprite particles overlaid during the combine transition. The
 * vocabulary (count, color, motion direction, scale) is keyed off the
 * demo's effectKind so synthesis feels different from combustion etc.
 *
 * Outward bursts (synthesis / combustion / neutralization / displacement)
 * read as "energy released" — exothermic. Inward sweep (decomposition)
 * reads as "energy absorbed" — endothermic, matching electrolysis.
 */
export function ReactionEffect({ kind, phaseStartedAt, durationMs }: ReactionEffectProps) {
  const recipe = RECIPES[kind]
  const groupRef = useRef<Group>(null)

  // Generate particle directions + colors once. We re-randomise when the
  // recipe changes (i.e. switching demos), but not on each frame.
  const particles = useMemo<Particle[]>(() => {
    const rand = rng(kind.charCodeAt(0) * 7919 + recipe.count)
    const out: Particle[] = []
    for (let i = 0; i < recipe.count; i++) {
      // Uniform direction on the unit sphere via two random angles.
      const theta = rand() * Math.PI * 2
      const phi = Math.acos(2 * rand() - 1)
      const sinPhi = Math.sin(phi)
      const dx = Math.cos(theta) * sinPhi
      const dy = Math.sin(theta) * sinPhi
      const dz = Math.cos(phi)
      // Spawn point ON a small sphere of spawnRadius for outward kinds; ON
      // the larger ring of `spawnRadius` for inward (so they sweep IN).
      const r = recipe.spawnRadius
      out.push({
        base: new Vector3(dx * r, dy * r, dz * r),
        dir: new Vector3(dx, dy, dz),
        color: recipe.palette[i % recipe.palette.length] ?? '#dffaff',
        offset: rand() * 0.25,
      })
    }
    return out
  }, [kind, recipe])

  // Each frame, walk children and update sprite position + opacity. We
  // mutate the underlying primitive's transform directly via the
  // sprite-mesh ref array. (Storing per-child refs would be more React-y;
  // a single ref array keeps the allocation count low.)
  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const t = Math.min(1, (performance.now() - phaseStartedAt) / durationMs)
    const children = g.children
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      const particle = particles[i]
      if (!child || !particle) continue
      // Particle progresses through 0..1 with its own staggered offset.
      const tt = Math.max(0, Math.min(1, t + particle.offset - 0.1))
      // Triangle envelope around peakAt — particles ramp up to peak then fade.
      const env =
        tt < recipe.peakAt ? tt / recipe.peakAt : 1 - (tt - recipe.peakAt) / (1 - recipe.peakAt)
      const opacity = Math.max(0, env)
      // Motion: outward = base + dir*travel*tt; inward = base + dir*travel*(1-tt) toward origin
      const k = recipe.motion === 'outward' ? tt : 1 - tt
      const r = recipe.spawnRadius + (recipe.travel - recipe.spawnRadius) * k
      child.position.set(particle.dir.x * r, particle.dir.y * r, particle.dir.z * r)
      // Opacity is on the sprite material. We set it via the child's
      // userData so we don't reach into the material every frame — actually
      // we DO need to reach in. Sprites store material on .material.
      const sprite = child as unknown as { material?: { opacity?: number } }
      if (sprite.material) sprite.material.opacity = opacity
    }
  })

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <ElectronSprite
          // biome-ignore lint/suspicious/noArrayIndexKey: particle order is stable per kind
          key={`p-${i}`}
          position={[p.base.x, p.base.y, p.base.z]}
          scale={recipe.spriteScale}
          color={p.color}
          opacity={0}
        />
      ))}
    </group>
  )
}
