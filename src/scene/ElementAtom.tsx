'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  type Group,
  type InstancedMesh,
  LineBasicMaterial,
  Object3D,
  Line as ThreeLine,
} from 'three'
import { useReducedMotion } from '@/src/lib/useReducedMotion'
import { ElectronSprite } from './ElectronSprite'

// === Nucleus + particle sizing ===
// Base nucleus volume — scales mildly with mass so heavy elements read
// bigger without uranium being 5× the size of hydrogen.
const NUCLEUS_BASE = 0.55
const NUCLEUS_MASS_FACTOR = 0.14
// Sub-atomic particle radius — protons and neutrons share the same
// size so what differs between them is colour, not scale.
const PARTICLE_RADIUS = 0.05
// How far inside the nucleus surface particles sit (fraction of
// nucleus radius). A bit under 1.0 so they don't poke through the
// outer translucent shell at rest.
const PARTICLE_FILL_FRACTION = 0.78
// Per-frame jitter amplitude (in nucleus-radius units). Particles
// oscillate around their base position to read as "swarming".
const PARTICLE_JITTER = 0.18
// Hard cap on rendered particles per type (protons / neutrons). The
// actual count is `min(real, cap)` — beyond ~40 the visual density
// reads the same and the GPU cost (60+60 spheres × bloom × emissive
// material) starts crashing low-tier GPUs on heavy elements. The data
// is unchanged; we just sample a subset for the viz.
const PARTICLE_CAP = 40

// === Electron shells ===
const SHELL_RADIUS_BASE = 1.05
const SHELL_RADIUS_STEP = 0.28
// Per-shell max visible electrons. Beyond this, we stop adding sprites
// — the periodic-table viz is an "impression of the shell structure",
// not an attempt to render 32 distinct electrons on shell 4.
const MAX_ELECTRONS_PER_SHELL = 8

// === Electron trails ===
// Sample count along each electron's tail arc. Higher = smoother but
// every electron sprite ships its own Float32Array of this size, so we
// stay modest.
const TAIL_POINTS = 24
// How far behind the head the trail extends, in radians along the orbit.
const TAIL_ARC = Math.PI / 3 // 60°

/**
 * Build a Three.js Line for an electron's tail. The line is drawn as a
 * continuous additive-blended polyline along the shell radius, with
 * vertex colors fading head → tail. Built once per electron and re-used
 * across frames — the rotation comes from the parent group's `rotation.y`.
 */
function buildElectronTrail(radius: number, speed: number): ThreeLine {
  // Tail extends BEHIND the head — the direction depends on the sign
  // of the electron's angular speed.
  const trailDir = speed >= 0 ? 1 : -1
  const positions = new Float32Array(TAIL_POINTS * 3)
  const colors = new Float32Array(TAIL_POINTS * 3)
  for (let k = 0; k < TAIL_POINTS; k++) {
    const angle = trailDir * (k / (TAIL_POINTS - 1)) * TAIL_ARC
    positions[k * 3] = Math.cos(angle) * radius
    positions[k * 3 + 1] = 0
    positions[k * 3 + 2] = Math.sin(angle) * radius
    // Brightness fades quickly from head; squared falloff so the tail
    // tapers off rather than reading as a uniform stripe.
    const fade = 1 - k / (TAIL_POINTS - 1)
    const intensity = 0.7 * fade ** 1.4
    colors[k * 3] = intensity
    colors[k * 3 + 1] = intensity * 0.92
    colors[k * 3 + 2] = intensity * 0.55
  }
  const geom = new BufferGeometry()
  geom.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geom.setAttribute('color', new Float32BufferAttribute(colors, 3))
  const mat = new LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  return new ThreeLine(geom, mat)
}

const COLOR_PROTON = '#ff7a8c'
const COLOR_NEUTRON = '#9aa0c8'
const COLOR_NUCLEUS_SHELL = '#5cc6ff'

// Layered translucent spheres approximate a soft-edge fade ~10% beyond
// the nucleus radius. The trick: when a transparent sphere is drawn,
// the silhouette is fully opaque (light path through that pixel grazes
// the surface tangent and accumulates the most material). For a hard
// edge to feel fuzzy we render successively larger spheres at
// successively lower opacity — the silhouette of each one fades to
// nothing by the time you reach the outermost shell.
const NUCLEUS_LAYERS: ReadonlyArray<{ scale: number; opacity: number }> = [
  { scale: 1.0, opacity: 0.32 },
  { scale: 1.04, opacity: 0.18 },
  { scale: 1.08, opacity: 0.08 },
  { scale: 1.11, opacity: 0.035 },
]

interface ElectronPlan {
  /** Shell index (0-based). */
  shellIdx: number
  /** Position around the orbit in radians at t=0. */
  phaseOffset: number
  /** Signed angular speed (rad/s). */
  speed: number
  /** Pitch + roll tilt for this electron's orbital plane. */
  tilt: [number, number, number]
}

interface ParticlePlan {
  /** Position inside the nucleus, in unit-sphere coords (0–1 of nucleus radius). */
  base: [number, number, number]
  /** Per-axis jitter phase offsets so particles don't sync up. */
  phase: [number, number, number]
  /** Per-axis jitter frequency. */
  frequency: number
}

/**
 * Fibonacci sphere — gives an even-ish distribution of N points on a
 * sphere. Used to spread particles inside the nucleus without obvious
 * clustering even for high-Z atoms.
 */
function fibonacciSphere(n: number): Array<[number, number, number]> {
  const points: Array<[number, number, number]> = []
  const phi = Math.PI * (Math.sqrt(5) - 1) // golden angle
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2 // -1..1
    const radius = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = phi * i
    points.push([Math.cos(theta) * radius, y, Math.sin(theta) * radius])
  }
  return points
}

/** Plan a list of particles distributed inside a sphere. */
function planParticles(count: number, capacity: number): ParticlePlan[] {
  const visible = Math.min(count, capacity)
  const surface = fibonacciSphere(visible)
  // Pull each point inward proportional to its index so the inner
  // particles fill the volume rather than crowding the surface only.
  return surface.map((dir, i) => {
    const r = PARTICLE_FILL_FRACTION * (0.4 + 0.6 * Math.sqrt((i + 1) / visible))
    return {
      base: [dir[0] * r, dir[1] * r, dir[2] * r] as [number, number, number],
      phase: [
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      ],
      frequency: 1.2 + Math.random() * 1.6,
    }
  })
}

interface ElementAtomProps {
  /** Atomic number. */
  Z: number
  /** Atomic mass (used to compute neutron count and nucleus size). */
  mass: number
  /** Ground-state shell occupancies — [shell1, shell2, …]. */
  shells: readonly number[]
  /** Override nucleus size. Defaults to base + log10(mass) factor. */
  scale?: number
}

/**
 * Atom visualization tuned for the /elements explorer surface. Renders
 * a translucent nucleus filled with red protons and grey neutrons that
 * gently swarm in place, plus electrons orbiting on concentric shells.
 *
 * Independent from `<Atom>` (molecule rendering keeps the solid-nucleus
 * look). Reused by the homepage `<ElementsShowcase>` and the element
 * detail page.
 */
export function ElementAtom({ Z, mass, shells, scale = 1 }: ElementAtomProps) {
  const reducedMotion = useReducedMotion()

  const nucleusRadius = useMemo(
    () => (NUCLEUS_BASE + Math.log10(Math.max(1, mass)) * NUCLEUS_MASS_FACTOR) * scale,
    [mass, scale],
  )

  const protonCount = Z
  const neutronCount = Math.max(0, Math.round(mass) - Z)

  const protonPlans = useMemo(() => planParticles(protonCount, PARTICLE_CAP), [protonCount])
  const neutronPlans = useMemo(() => planParticles(neutronCount, PARTICLE_CAP), [neutronCount])

  // One ShellPlan per shell — used to render exactly ONE torus ring
  // per shell (not one per electron, which was 44 rings for Mendelevium
  // and tipping the WebGL frame budget).
  const shellPlans = useMemo(() => {
    return shells.map((_, shellIdx) => ({
      shellIdx,
      radius: SHELL_RADIUS_BASE + shellIdx * SHELL_RADIUS_STEP,
      tilt: [
        shellIdx % 2 === 0 ? 0 : Math.PI / 3,
        shellIdx * 0.4,
        shellIdx % 2 === 0 ? 0 : Math.PI / 6,
      ] as [number, number, number],
    }))
  }, [shells])

  const electronPlans = useMemo<ElectronPlan[]>(() => {
    const out: ElectronPlan[] = []
    shells.forEach((occupancy, shellIdx) => {
      const visible = Math.min(occupancy, MAX_ELECTRONS_PER_SHELL)
      const speedBase = 1.4 - shellIdx * 0.18
      const tilt = shellPlans[shellIdx]?.tilt ?? [0, 0, 0]
      for (let i = 0; i < visible; i++) {
        out.push({
          shellIdx,
          phaseOffset: (i / Math.max(1, visible)) * Math.PI * 2,
          speed: speedBase * (i % 2 === 0 ? 1 : -1),
          tilt,
        })
      }
    })
    return out
  }, [shells, shellPlans])

  // Pre-build each electron's trail line once per (Z, shell config).
  // Lines are real Three.js objects; we dispose their geom + material
  // on unmount to keep GPU memory tidy across element switches.
  const trailLines = useMemo(() => {
    return electronPlans.map((plan) => {
      const radius = SHELL_RADIUS_BASE + plan.shellIdx * SHELL_RADIUS_STEP
      return buildElectronTrail(radius, plan.speed)
    })
  }, [electronPlans])
  useEffect(() => {
    return () => {
      for (const line of trailLines) {
        line.geometry.dispose()
        if (Array.isArray(line.material)) {
          for (const m of line.material) m.dispose()
        } else {
          line.material.dispose()
        }
      }
    }
  }, [trailLines])

  // === Refs for the per-frame jitter + electron orbit drivers ===
  const protonRef = useRef<InstancedMesh>(null)
  const neutronRef = useRef<InstancedMesh>(null)
  const electronRefs = useRef<Group[]>([])
  const dummy = useMemo(() => new Object3D(), [])
  const startTime = useRef(performance.now())

  useFrame(() => {
    const t = (performance.now() - startTime.current) / 1000
    const jitter = reducedMotion ? 0 : PARTICLE_JITTER
    // Drive the proton instances.
    if (protonRef.current) {
      for (let i = 0; i < protonPlans.length; i++) {
        const p = protonPlans[i]
        if (!p) continue
        const ox = jitter * Math.sin(t * p.frequency + p.phase[0])
        const oy = jitter * Math.sin(t * p.frequency + p.phase[1])
        const oz = jitter * Math.sin(t * p.frequency + p.phase[2])
        dummy.position.set(
          (p.base[0] + ox) * nucleusRadius,
          (p.base[1] + oy) * nucleusRadius,
          (p.base[2] + oz) * nucleusRadius,
        )
        dummy.updateMatrix()
        protonRef.current.setMatrixAt(i, dummy.matrix)
      }
      protonRef.current.instanceMatrix.needsUpdate = true
    }
    if (neutronRef.current) {
      for (let i = 0; i < neutronPlans.length; i++) {
        const p = neutronPlans[i]
        if (!p) continue
        const ox = jitter * Math.sin(t * p.frequency + p.phase[0])
        const oy = jitter * Math.sin(t * p.frequency + p.phase[1])
        const oz = jitter * Math.sin(t * p.frequency + p.phase[2])
        dummy.position.set(
          (p.base[0] + ox) * nucleusRadius,
          (p.base[1] + oy) * nucleusRadius,
          (p.base[2] + oz) * nucleusRadius,
        )
        dummy.updateMatrix()
        neutronRef.current.setMatrixAt(i, dummy.matrix)
      }
      neutronRef.current.instanceMatrix.needsUpdate = true
    }
    // Electrons — advance each one's own rotating group by its own
    // angular speed. Bails when reduced motion is requested; the
    // refs stay at their initial phase offsets so the orbits don't
    // visually disappear, they just hold position.
    if (!reducedMotion) {
      for (let i = 0; i < electronRefs.current.length; i++) {
        const g = electronRefs.current[i]
        const plan = electronPlans[i]
        if (!g || !plan) continue
        g.rotation.y = plan.phaseOffset + t * plan.speed
      }
    }
  })

  return (
    <group>
      {/* Nucleus — layered translucent spheres at progressively larger
          radii with falling opacity. Reads as a soft, fuzzy core whose
          edge fades smoothly over the outer ~10% of the radius without
          needing a custom shader (which was causing crashes under
          React 19 + R3F reconciliation). */}
      {NUCLEUS_LAYERS.map((layer, i) => (
        <mesh
          // biome-ignore lint/suspicious/noArrayIndexKey: layer set is static
          key={`nucleus-layer-${i}`}
        >
          <sphereGeometry args={[nucleusRadius * layer.scale, 32, 24]} />
          <meshBasicMaterial
            color={COLOR_NUCLEUS_SHELL}
            transparent
            opacity={layer.opacity}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Protons — instanced. meshBasicMaterial (not Standard) keeps
          the fragment shader trivial: no lighting math, no PBR. With
          40 instances each for protons + neutrons that adds up. Skip
          the mesh entirely when count is 0 to avoid a zero-length
          InstancedBufferAttribute. Geometry lowered to 8×6 segments
          (was 16×12) — at PARTICLE_RADIUS=0.05 the difference is
          invisible. */}
      {protonPlans.length > 0 && (
        <instancedMesh
          ref={protonRef}
          args={[undefined, undefined, protonPlans.length]}
          frustumCulled={false}
        >
          <sphereGeometry args={[PARTICLE_RADIUS, 8, 6]} />
          <meshBasicMaterial color={COLOR_PROTON} toneMapped={false} />
        </instancedMesh>
      )}
      {/* Neutrons — same geometry, different colour. Hydrogen has 0
          neutrons; skipping the mesh avoids the same zero-length pitfall. */}
      {neutronPlans.length > 0 && (
        <instancedMesh
          ref={neutronRef}
          args={[undefined, undefined, neutronPlans.length]}
          frustumCulled={false}
        >
          <sphereGeometry args={[PARTICLE_RADIUS, 8, 6]} />
          <meshBasicMaterial color={COLOR_NEUTRON} toneMapped={false} />
        </instancedMesh>
      )}

      {/* Electron shells — each electron sits inside its own rotating
          group with a trail line behind it. Same pattern as `<Atom>`'s
          per-electron orbit so the visual matches the molecule scenes. */}
      {/* Ghosted shell rings — ONE torus per shell, not per electron.
          The previous implementation rendered a torus inside every
          electron's group (44 tori for Mendelevium) which was tipping
          the WebGL frame budget and crashing the tab on refresh. */}
      {shellPlans.map((shell) => (
        <group key={`shell-${shell.shellIdx}`} rotation={shell.tilt}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[shell.radius, 0.004, 6, 40]} />
            <meshBasicMaterial
              color={COLOR_NUCLEUS_SHELL}
              transparent
              opacity={0.18}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Electrons — each in its own rotating group inside its shell's
          tilt frame. The trail line + sprite orbit together. */}
      {electronPlans.map((plan, i) => {
        const radius = SHELL_RADIUS_BASE + plan.shellIdx * SHELL_RADIUS_STEP
        const trail = trailLines[i]
        return (
          <group
            // biome-ignore lint/suspicious/noArrayIndexKey: plan order stable per Z
            key={`e-${i}`}
            rotation={plan.tilt}
          >
            <group
              ref={(g) => {
                if (g) {
                  electronRefs.current[i] = g
                  // Initial phase keeps electrons on the same shell
                  // spaced around the orbit.
                  g.rotation.y = plan.phaseOffset
                }
              }}
            >
              {trail && <primitive object={trail} />}
              <ElectronSprite position={[radius, 0, 0]} />
            </group>
          </group>
        )
      })}
    </group>
  )
}

export const ELEMENT_ATOM_SHELL_BASE = SHELL_RADIUS_BASE
export const ELEMENT_ATOM_SHELL_STEP = SHELL_RADIUS_STEP

/**
 * Radius of the bounding sphere that contains the entire rendered atom
 * — the outermost electron shell plus the electron sprite's visual
 * footprint. Used to set the camera distance so heavy atoms (uranium
 * has 7 shells → ~2.7 unit outer radius) fit entirely in frame.
 */
export function computeAtomBoundingRadius(numShells: number): number {
  const ELECTRON_SPRITE_MARGIN = 0.25
  const shells = Math.max(1, numShells)
  return SHELL_RADIUS_BASE + (shells - 1) * SHELL_RADIUS_STEP + ELECTRON_SPRITE_MARGIN
}

/**
 * Camera distance required to fit the whole atom in a `fov`-degree
 * perspective frame, with `padding` (1.0 = exact fit, >1.0 leaves
 * margin). Used by both ElementDetail and ElementsShowcase so the
 * 3D scene auto-zooms to whichever element is in view.
 */
export function computeCameraDistance(numShells: number, fovDeg = 45, padding = 1.18): number {
  const radius = computeAtomBoundingRadius(numShells)
  const halfFov = (fovDeg * Math.PI) / 360
  return (radius / Math.tan(halfFov)) * padding
}
