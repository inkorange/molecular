'use client'

import { BallCollider, RigidBody } from '@react-three/rapier'
import { useMemo } from 'react'
import type { Atom as AtomData, Bond as BondData } from '@/src/chem/types'
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
      {localAtoms.map((a) => (
        <Atom key={a.id} Z={a.Z} position={a.localPos} />
      ))}
      {bonds.map((b) => {
        const a = localAtoms.find((x) => x.id === b.atomA)
        const c = localAtoms.find((x) => x.id === b.atomB)
        if (!a || !c) return null
        return <Bond key={b.id} start={a.localPos} end={c.localPos} order={b.order} type={b.type} />
      })}
    </RigidBody>
  )
}
