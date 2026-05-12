'use client'

import { Physics } from '@react-three/rapier'
import type { ReactNode } from 'react'
import { useStore } from '@/src/store'

/**
 * Wraps the scene in a Rapier `<Physics>` world only while the user is in
 * Lab mode. Earlier this used `lazy()` + `Suspense` so the rapier import
 * fired on demand, but that produced a one-frame window where the Suspense
 * fallback rendered LabMolecule (which uses `<RigidBody>`) outside any
 * `<Physics>` context — useRapier throws. Eager import is the safer default;
 * we can revisit code-splitting once Lab is a heavier surface.
 *
 * Gravity is zero — molecules drift in 3D space, only moving when flung.
 */
export function PhysicsWrapper({ children }: { children: ReactNode }) {
  const mode = useStore((s) => s.scene.mode)
  if (mode !== 'lab') return <>{children}</>
  return <Physics gravity={[0, 0, 0]}>{children}</Physics>
}
