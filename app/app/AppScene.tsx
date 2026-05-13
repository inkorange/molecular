'use client'

import { useEffect, useRef } from 'react'
import { getLibraryEntry } from '@/src/data/molecules'
import { tryReact } from '@/src/lib/applyReaction'
import { spawnLibraryEntry } from '@/src/lib/spawn'
import { AttachPoints } from '@/src/scene/AttachPoints'
import { CameraFit } from '@/src/scene/CameraFit'
import { DragGhost } from '@/src/scene/DragGhost'
import { DropCatcher } from '@/src/scene/DropCatcher'
import { LabMolecule } from '@/src/scene/LabMolecule'
import { Molecule } from '@/src/scene/Molecule'
import { PhysicsWrapper } from '@/src/scene/PhysicsWrapper'
import { Scene } from '@/src/scene/Scene'
import { SelectionMenu } from '@/src/scene/SelectionMenu'
import { useStore } from '@/src/store'

export function AppScene() {
  const atoms = useStore((s) => s.scene.atoms)
  const bonds = useStore((s) => s.scene.bonds)
  const molecules = useStore((s) => s.scene.molecules)
  const mode = useStore((s) => s.scene.mode)
  const addAtom = useStore((s) => s.addAtom)
  const addBond = useStore((s) => s.addBond)
  const addMolecule = useStore((s) => s.addMolecule)

  // First-mount spawn. Honours `?molecule=<libId>` from a landing deep link
  // so visitors who tap a feature card or the reel CTA land in the app
  // already looking at the molecule they clicked. Falls back to water when
  // the param is missing or the lib id isn't recognised.
  useEffect(() => {
    if (Object.keys(useStore.getState().scene.atoms).length > 0) return
    const params = new URLSearchParams(window.location.search)
    const lib = params.get('molecule') ?? 'water'
    const entry = getLibraryEntry(lib) ?? getLibraryEntry('water')
    if (!entry) return
    const result = spawnLibraryEntry(entry)
    addMolecule(result.molecule)
    for (const a of result.atoms) addAtom(a)
    for (const b of result.bonds) addBond(b)
  }, [addAtom, addBond, addMolecule])

  const atomList = Object.values(atoms)
  const bondList = Object.values(bonds)

  // Collision-driven react: a single collision can fire `onCollisionEnter`
  // on both bodies simultaneously, and rapier may fire multiple times per
  // contact across frames. Debounce so applyReaction only runs once per
  // resolution window.
  const reactGuard = useRef(0)
  function onCollide() {
    const now = performance.now()
    if (now - reactGuard.current < 300) return
    const reactionId = tryReact()
    if (reactionId) reactGuard.current = now
  }

  const inLab = mode === 'lab'

  return (
    <Scene>
      <CameraFit />
      <PhysicsWrapper>
        {Object.values(molecules).map((m) => {
          const mAtoms = atomList.filter((a) => a.moleculeId === m.id)
          const mBonds = bondList.filter((b) => m.bondIds.includes(b.id))
          if (inLab) {
            return (
              <LabMolecule
                key={m.id}
                moleculeId={m.id}
                atoms={mAtoms}
                bonds={mBonds}
                onCollideWith={onCollide}
              />
            )
          }
          return <Molecule key={m.id} atoms={mAtoms} bonds={mBonds} />
        })}
      </PhysicsWrapper>
      <DropCatcher />
      <DragGhost />
      <AttachPoints />
      <SelectionMenu />
    </Scene>
  )
}
