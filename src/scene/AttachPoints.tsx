'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Mesh } from 'three'
import { getElement } from '@/src/chem/elements'
import { canBond } from '@/src/chem/rules'
import { getBondingSites } from '@/src/chem/vsper'
import { commitBond } from '@/src/lib/commitBond'
import { useReducedMotion } from '@/src/lib/useReducedMotion'
import { useStore } from '@/src/store'

const SNAP_RANGE = 1.5
const COLOR_COMMON = '#a4ff8c'
const COLOR_UNUSUAL = '#ffd97a'

interface SitePlan {
  id: string
  hostId: string
  position: [number, number, number]
  color: string
  preference: 'common' | 'unusual'
}

interface AttachPointProps {
  plan: SitePlan
  active: boolean
  onClick: () => void
}

function AttachPoint({ plan, active, onClick }: AttachPointProps) {
  const ref = useRef<Mesh>(null)
  const reducedMotion = useReducedMotion()
  useFrame((state) => {
    if (!ref.current) return
    // Skip the breathing pulse when the user prefers reduced motion;
    // the larger "active" scale still applies because it's a state
    // change, not an ongoing animation.
    const pulse = reducedMotion ? 1 : 1 + Math.sin(state.clock.elapsedTime * 5) * 0.15
    ref.current.scale.setScalar(active ? 1.6 : pulse)
  })
  return (
    <mesh
      ref={ref}
      position={plan.position}
      onPointerDown={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        color={plan.color}
        emissive={plan.color}
        emissiveIntensity={active ? 2.2 : 1.4}
        transparent
        opacity={0.85}
      />
    </mesh>
  )
}

export function AttachPoints() {
  const heldZ = useStore((s) => s.build.heldZ)
  const pointer = useStore((s) => s.build.pointerWorld)
  const atoms = useStore((s) => s.scene.atoms)
  const bonds = useStore((s) => s.scene.bonds)
  const molecules = useStore((s) => s.scene.molecules)
  const setActiveSite = useStore((s) => s.setActiveSite)
  const activeSiteId = useStore((s) => s.build.activeSiteId)
  const addAtom = useStore((s) => s.addAtom)
  const addBond = useStore((s) => s.addBond)
  const clearHeld = useStore((s) => s.clearHeld)

  const allSites = useMemo<SitePlan[]>(() => {
    if (heldZ === null) return []
    const held = getElement(heldZ)
    const list: SitePlan[] = []
    for (const atom of Object.values(atoms)) {
      const host = getElement(atom.Z)
      const verdict = canBond(host, held)
      if (!verdict.allowed) continue
      const color = verdict.preference === 'common' ? COLOR_COMMON : COLOR_UNUSUAL
      const sites = getBondingSites(atom, { atoms, bonds, molecules })
      for (let i = 0; i < sites.length; i++) {
        const site = sites[i]
        if (!site) continue
        list.push({
          id: `${atom.id}::${i}`,
          hostId: atom.id,
          position: [site.position[0], site.position[1], site.position[2]],
          color,
          preference: verdict.preference,
        })
      }
    }
    return list
  }, [heldZ, atoms, bonds, molecules])

  // Track which site is closest to the pointer; mark it as "active".
  useMemo(() => {
    if (!pointer || allSites.length === 0) {
      setActiveSite(null)
      return
    }
    let bestId: string | null = null
    let bestDist = SNAP_RANGE
    for (const s of allSites) {
      const dx = s.position[0] - pointer[0]
      const dy = s.position[1] - pointer[1]
      const dz = s.position[2] - pointer[2]
      const d = Math.hypot(dx, dy, dz)
      if (d < bestDist) {
        bestDist = d
        bestId = s.id
      }
    }
    setActiveSite(bestId)
  }, [pointer, allSites, setActiveSite])

  function commit(siteId: string) {
    if (heldZ === null) return
    const site = allSites.find((s) => s.id === siteId)
    if (!site) return
    const host = atoms[site.hostId]
    if (!host) return
    commitBond(host, heldZ, site.position, { addAtom, addBond, clearHeld })
  }

  return (
    <>
      {allSites.map((s) => (
        <AttachPoint
          key={s.id}
          plan={s}
          active={s.id === activeSiteId}
          onClick={() => commit(s.id)}
        />
      ))}
    </>
  )
}
