'use client'

import { lazy, type ReactNode, Suspense } from 'react'
import { useStore } from '@/src/store'

const Physics = lazy(() => import('@react-three/rapier').then((m) => ({ default: m.Physics })))

/**
 * Lazy-loads @react-three/rapier and wraps the scene in a `<Physics>` world
 * only while the user is in Lab mode. In Explore / Build the import never
 * fires, keeping the page's initial JS budget tight.
 *
 * Gravity is zero — atoms in Lab mode drift in 3D space, only moving when
 * the user flings them.
 */
export function PhysicsWrapper({ children }: { children: ReactNode }) {
  const mode = useStore((s) => s.scene.mode)
  if (mode !== 'lab') return <>{children}</>
  return (
    <Suspense fallback={<>{children}</>}>
      <Physics gravity={[0, 0, 0]}>{children}</Physics>
    </Suspense>
  )
}
