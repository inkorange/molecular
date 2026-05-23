'use client'

import { useFrame } from '@react-three/fiber'
import { BallCollider, RigidBody } from '@react-three/rapier'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import type { Atom as AtomData, Bond as BondData } from '@/src/chem/types'
import { useStore } from '@/src/store'
import { Atom } from './Atom'
import { Bond } from './Bond'

interface LabMoleculeProps {
  moleculeId: string
  atoms: AtomData[]
  bonds: BondData[]
  onCollideWith: (otherMoleculeId: string) => void
}

// Collider radius around each atom nucleus. The visible nucleus is ~0.2 in
// Atom.tsx; the collider is slightly larger so molecules contact when their
// electron shells (not just nuclei) overlap.
const ATOM_COLLIDER_RADIUS = 0.32

/**
 * Lab-mode molecule. Each molecule is one Rapier `RigidBody` so reactions
 * can fire on contact via `onCollisionEnter`. Drag-and-fling input was
 * previously wired on top of this but added noise without purpose — Lab's
 * reaction trigger is the explicit Combine button — so this is now a
 * static, fixed body. Atoms render at local positions inside the body so
 * the visual layout matches Build/Explore exactly.
 */
export function LabMolecule({ moleculeId, atoms, bonds, onCollideWith }: LabMoleculeProps) {
  // Centroid of the molecule in world space — the RigidBody's position.
  // Atoms render at offsets relative to this so the molecule visually
  // matches its store representation.
  const centroid = useMemo<[number, number, number]>(() => {
    let sx = 0
    let sy = 0
    let sz = 0
    for (const a of atoms) {
      sx += a.position[0]
      sy += a.position[1]
      sz += a.position[2]
    }
    const n = atoms.length || 1
    return [sx / n, sy / n, sz / n]
  }, [atoms])

  const localAtoms = useMemo(
    () =>
      atoms.map((a) => ({
        ...a,
        localPos: [
          a.position[0] - centroid[0],
          a.position[1] - centroid[1],
          a.position[2] - centroid[2],
        ] as [number, number, number],
      })),
    [atoms, centroid],
  )

  return (
    <RigidBody
      position={centroid}
      // Fixed body type: molecules stay where they spawn. The collision
      // detection still fires because rapier checks intersections regardless
      // of body type — and that's the whole point of using RigidBody here.
      type="fixed"
      // Explicit colliders below — relying on `colliders="ball"` would auto-
      // generate ball colliders from every child mesh (label cards, electron
      // sprites, trails, …) producing oversized/incorrect bounding spheres.
      colliders={false}
      userData={{ moleculeId }}
      onCollisionEnter={(payload) => {
        const otherData = payload.other.rigidBody?.userData as { moleculeId?: string } | undefined
        const otherId = otherData?.moleculeId
        if (otherId && otherId !== moleculeId) onCollideWith(otherId)
      }}
    >
      {/* One ball collider per atom nucleus at the atom's local offset. */}
      {localAtoms.map((a) => (
        <BallCollider
          key={`c-${a.id}`}
          args={[ATOM_COLLIDER_RADIUS]}
          position={a.localPos}
          restitution={0}
        />
      ))}
      {/* Animated inner group. RigidBody stays put for physics + collision;
          this child group is what visually shrinks-to-origin (reactants)
          or grows-from-origin (products) during a Combine reaction.
          Outside an active animation it sits at identity so the molecule
          renders at its real centroid. */}
      <AnimatedInnerGroup moleculeId={moleculeId} centroid={centroid}>
        {localAtoms.map((a) => (
          // Pass atomId so the element-detail popup (rendered above the
          // periodic card billboard inside <Atom>) is enabled in lab
          // mode too — without it, the card's onClick is gated off and
          // tapping the card silently does nothing.
          <Atom key={a.id} atomId={a.id} Z={a.Z} position={a.localPos} />
        ))}
        {bonds.map((b) => {
          const a = localAtoms.find((x) => x.id === b.atomA)
          const c = localAtoms.find((x) => x.id === b.atomB)
          if (!a || !c) return null
          return (
            <Bond key={b.id} start={a.localPos} end={c.localPos} order={b.order} type={b.type} />
          )
        })}
      </AnimatedInnerGroup>
    </RigidBody>
  )
}

/**
 * Inner group that animates the molecule's visual position and scale
 * during a Combine reaction.
 *
 * The outer RigidBody is fixed at the molecule's world centroid and
 * carries the collider — those stay put. Inside, this group's
 * transform animates to produce two visual effects:
 *
 *   - REACTANT (first half of animation): translate from local origin
 *     toward `-centroid` so the molecule visually slides to the world
 *     origin while shrinking to 0 scale. By the midpoint it's a
 *     vanished point at (0,0,0) — exactly when applyReaction removes
 *     it from the store.
 *
 *   - PRODUCT (second half): translate from `-centroid` back to the
 *     local origin while growing from 0 to full scale. The molecule
 *     visually emerges from (0,0,0) and expands out to its real spawn
 *     position around the origin ring chosen by applyReaction.
 *
 * Driven by useFrame so the transform updates every frame without
 * extra React state churn. Outside an active animation the group sits
 * at identity transform.
 */
function AnimatedInnerGroup({
  moleculeId,
  centroid,
  children,
}: {
  moleculeId: string
  centroid: [number, number, number]
  children: React.ReactNode
}) {
  const ref = useRef<Group>(null)
  const activeAnimation = useStore((s) => s.lab.activeAnimation)
  // Per-frame transform driver. Read the animation state through a ref
  // pattern (closure captures the current value) — the useFrame
  // dependency is empty so the function is stable, but it re-reads
  // animation state via useStore.getState() each frame so it stays
  // up to date without subscribing to a Zustand selector every frame.
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const anim = useStore.getState().lab.activeAnimation
    if (!anim) {
      // No active animation: reset to identity.
      g.position.set(0, 0, 0)
      g.scale.setScalar(1)
      return
    }
    const elapsed = performance.now() - anim.startedAt
    const half = anim.durationMs * 0.5
    const isReactant = anim.reactantIds.includes(moleculeId)
    const isProduct = anim.productIds.includes(moleculeId)

    if (isReactant && elapsed < half) {
      // Phase 1: shrink to origin. u: 0 → 1 over first half.
      const u = Math.min(1, elapsed / half)
      // Cubic ease-in so the molecule accelerates as it crunches toward
      // the center — feels like the reaction is pulling it in.
      const eased = u * u * u
      g.position.set(-centroid[0] * eased, -centroid[1] * eased, -centroid[2] * eased)
      g.scale.setScalar(Math.max(0, 1 - eased))
      return
    }
    if (isProduct && elapsed >= half) {
      // Phase 2: grow from origin. v: 0 → 1 over second half.
      const v = Math.min(1, (elapsed - half) / half)
      // Cubic ease-out so the product expands quickly then settles —
      // matches the "burst outward" feel of the reaction effect.
      const eased = 1 - (1 - v) ** 3
      g.position.set(
        -centroid[0] * (1 - eased),
        -centroid[1] * (1 - eased),
        -centroid[2] * (1 - eased),
      )
      g.scale.setScalar(eased)
      return
    }
    // Non-participant in this animation (or wrong phase): identity.
    g.position.set(0, 0, 0)
    g.scale.setScalar(1)
  })
  // The activeAnimation selector value is intentionally unused inside
  // useFrame (we read fresh via getState there), but subscribing makes
  // sure the component re-renders when an animation starts/ends, which
  // is when we want useFrame's identity check to kick in.
  void activeAnimation
  return <group ref={ref}>{children}</group>
}
