'use client'

import type { ThreeEvent } from '@react-three/fiber'
import { type RapierRigidBody, RigidBody } from '@react-three/rapier'
import { useMemo, useRef } from 'react'
import type { Atom as AtomData, Bond as BondData } from '@/src/chem/types'
import { usePointerToWorld } from '@/src/lib/usePointerToWorld'
import { Atom } from './Atom'
import { Bond } from './Bond'

interface LabMoleculeProps {
  moleculeId: string
  atoms: AtomData[]
  bonds: BondData[]
  onCollideWith: (otherMoleculeId: string) => void
}

// Tunables ---------------------------------------------------------------

// Scale applied to drag-velocity → linear velocity on release. Higher = harder fling.
const DRAG_VELOCITY_SCALE = 1.8
// Cap fling speed so users can't accidentally launch atoms across the universe.
const MAX_FLING_SPEED = 12
// Linear damping on each rigid body so flung molecules slow down naturally.
const LINEAR_DAMPING = 0.25
// Sliding window (ms) of pointer-move samples to average for release velocity.
const VELOCITY_WINDOW_MS = 100

/**
 * Physics-enabled molecule used when the user is in Lab mode. The whole
 * molecule is a single dynamic `RigidBody` with ball colliders on each
 * atom — moves and rotates as one rigid unit, collides with other
 * molecules.
 *
 * Drag-to-fling: pointerdown on any atom switches the body to
 * kinematic-position mode and tracks the pointer along a camera-aligned
 * plane through the molecule's centroid. On pointerup the body returns to
 * dynamic and inherits the recent drag velocity. A short trailing-sample
 * window keeps the release velocity from being polluted by a slow finger.
 */
export function LabMolecule({ moleculeId, atoms, bonds, onCollideWith }: LabMoleculeProps) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const screenToWorld = usePointerToWorld()

  // Centroid of the molecule in world space — the RigidBody's initial
  // position. Atoms render at offsets relative to this so the molecule
  // visually matches its store representation.
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

  // Drag-state ref so per-move updates don't trigger re-renders.
  const drag = useRef<{
    pointerId: number
    samples: { t: number; pos: [number, number, number] }[]
  } | null>(null)

  function getBodyPos(): [number, number, number] {
    const body = bodyRef.current
    if (!body) return centroid
    const t = body.translation()
    return [t.x, t.y, t.z]
  }

  function handlePointerDown(e: ThreeEvent<PointerEvent>) {
    const body = bodyRef.current
    if (!body) return
    e.stopPropagation()
    const target = e.target as Element | null
    if (target && 'setPointerCapture' in target) {
      try {
        target.setPointerCapture(e.pointerId)
      } catch {}
    }
    // Switch to kinematic-position so the body follows the pointer exactly
    // while held and doesn't get pushed around by physics impulses mid-drag.
    body.setBodyType(2 /* KinematicPositionBased */, true)
    body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    body.setAngvel({ x: 0, y: 0, z: 0 }, true)
    drag.current = {
      pointerId: e.pointerId,
      samples: [{ t: performance.now(), pos: getBodyPos() }],
    }
  }

  function handlePointerMove(e: ThreeEvent<PointerEvent>) {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    const body = bodyRef.current
    if (!body) return
    const w = screenToWorld(e.clientX, e.clientY, getBodyPos())
    if (!w) return
    body.setNextKinematicTranslation({ x: w[0], y: w[1], z: w[2] })
    const now = performance.now()
    d.samples.push({ t: now, pos: w })
    // Trim samples older than VELOCITY_WINDOW_MS — release velocity comes
    // from this rolling window so a slow re-grip doesn't kill the fling.
    while (d.samples.length > 1 && now - d.samples[0]!.t > VELOCITY_WINDOW_MS) {
      d.samples.shift()
    }
  }

  function handlePointerUp(e: ThreeEvent<PointerEvent>) {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    e.stopPropagation()
    const target = e.target as Element | null
    if (target && 'releasePointerCapture' in target) {
      try {
        target.releasePointerCapture(e.pointerId)
      } catch {}
    }
    const body = bodyRef.current
    drag.current = null
    if (!body) return
    // Compute release velocity from the recent samples.
    let vx = 0
    let vy = 0
    let vz = 0
    if (d.samples.length >= 2) {
      const first = d.samples[0]!
      const last = d.samples[d.samples.length - 1]!
      const dt = Math.max(0.016, (last.t - first.t) / 1000)
      vx = ((last.pos[0] - first.pos[0]) / dt) * DRAG_VELOCITY_SCALE
      vy = ((last.pos[1] - first.pos[1]) / dt) * DRAG_VELOCITY_SCALE
      vz = ((last.pos[2] - first.pos[2]) / dt) * DRAG_VELOCITY_SCALE
      const speed = Math.hypot(vx, vy, vz)
      if (speed > MAX_FLING_SPEED) {
        const k = MAX_FLING_SPEED / speed
        vx *= k
        vy *= k
        vz *= k
      }
    }
    // Hand control back to the physics engine and seed it with our velocity.
    body.setBodyType(0 /* Dynamic */, true)
    body.setLinvel({ x: vx, y: vy, z: vz }, true)
  }

  return (
    <RigidBody
      ref={bodyRef}
      position={centroid}
      colliders="ball"
      linearDamping={LINEAR_DAMPING}
      angularDamping={LINEAR_DAMPING}
      userData={{ moleculeId }}
      onCollisionEnter={(payload) => {
        const otherData = payload.other.rigidBody?.userData as { moleculeId?: string } | undefined
        const otherId = otherData?.moleculeId
        if (otherId && otherId !== moleculeId) onCollideWith(otherId)
      }}
    >
      {/* Wrapper group catches pointer events for the whole molecule so the
          user can grab any atom to drag the body. Atom's own pointer handlers
          are gated by `inBuild` and early-return without stopping propagation
          in Lab mode, so events bubble up here. */}
      <group
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {localAtoms.map((a) => (
          <Atom key={a.id} Z={a.Z} position={a.localPos} />
        ))}
        {bonds.map((b) => {
          const a = localAtoms.find((x) => x.id === b.atomA)
          const c = localAtoms.find((x) => x.id === b.atomB)
          if (!a || !c) return null
          return (
            <Bond key={b.id} start={a.localPos} end={c.localPos} order={b.order} type={b.type} />
          )
        })}
      </group>
    </RigidBody>
  )
}
