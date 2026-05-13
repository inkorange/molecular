'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import type { Atom as AtomData, Bond as BondData } from '@/src/chem/types'
import { Molecule } from '@/src/scene/Molecule'

export type AnimPhase = 'idle' | 'exiting' | 'entering'

interface AnimatedMoleculeProps {
  atoms: AtomData[]
  bonds: BondData[]
  phase: AnimPhase
  /** performance.now() at which the current phase began. Resetting this
   *  restarts the tween clock. */
  phaseStartedAt: number
  /** Phase duration in ms. */
  durationMs: number
  /**
   * Target transform for the `entering` phase. The unit grows from
   * (origin, scale 0) to (targetPosition, targetScale). When undefined,
   * the unit grows into its atoms' natural centroid at scale 1 (legacy
   * behaviour used by demos with no explicit product layout).
   *
   * Only consulted in the `entering` phase. Exit + idle phases continue
   * to operate on the atoms' absolute world positions.
   */
  targetPosition?: [number, number, number]
  targetScale?: number
}

function easeInCubic(t: number) {
  return t ** 3
}
function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

/**
 * Wraps a Molecule in a tweening group keyed to (phase, phaseStartedAt).
 *
 * - `exiting`: the wrapper's centroid drifts toward world origin while
 *   the group scales from 1 → 0 over durationMs (easeIn). Communicates
 *   "this unit merged in".
 * - `entering`: starts at scale 0 at origin and grows to scale 1 at the
 *   atoms' world centroid (easeOut). Communicates "this unit was born".
 * - `idle`: scale 1, no offset.
 *
 * Operates on the group's transform — we don't touch individual atom
 * positions, so the molecule's internal geometry stays correct.
 */
export function AnimatedMolecule({
  atoms,
  bonds,
  phase,
  phaseStartedAt,
  durationMs,
  targetPosition,
  targetScale,
}: AnimatedMoleculeProps) {
  const groupRef = useRef<Group>(null)

  // Centroid of this unit in world space — computed once from atom
  // positions. The wrapper's natural translation is [0,0,0] and atoms
  // render at their absolute positions, so during exit we drift the group
  // by NEGATIVE of the centroid to pull the unit toward origin.
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

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const t = Math.min(1, (performance.now() - phaseStartedAt) / durationMs)
    if (phase === 'idle') {
      g.scale.setScalar(1)
      g.position.set(0, 0, 0)
      return
    }
    if (phase === 'exiting') {
      const k = easeInCubic(t)
      // Scale toward 0; never quite 0 to avoid Three's degenerate matrix.
      g.scale.setScalar(Math.max(0.001, 1 - k))
      // Drift toward origin: translate the group by -centroid * progress.
      // Atoms render at world centroid + their local offsets; subtracting
      // k * centroid pulls the whole unit toward [0,0,0].
      g.position.set(-centroid[0] * k, -centroid[1] * k, -centroid[2] * k)
      return
    }
    // entering
    const k = easeOutCubic(t)
    if (targetPosition !== undefined && targetScale !== undefined) {
      // Atoms are LOCAL (pre-translated around 0,0,0). Group tweens from
      // (origin, scale 0) to (targetPosition, targetScale) so the unit
      // grows in place AT its final layout slot — no jump on transition end.
      const s = Math.max(0.001, targetScale * k)
      g.scale.setScalar(s)
      g.position.set(targetPosition[0] * k, targetPosition[1] * k, targetPosition[2] * k)
      return
    }
    // Legacy: atoms are WORLD (at their natural row positions). Group
    // tweens from -centroid (atoms at origin) to 0 (atoms at natural
    // positions), scaling 0 → 1.
    g.scale.setScalar(Math.max(0.001, k))
    g.position.set(-centroid[0] * (1 - k), -centroid[1] * (1 - k), -centroid[2] * (1 - k))
  })

  return (
    <group ref={groupRef}>
      <Molecule atoms={atoms} bonds={bonds} />
    </group>
  )
}
