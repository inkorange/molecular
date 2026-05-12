'use client'

import { useEffect } from 'react'
import { getLibraryEntry } from '@/src/data/molecules'
import { spawnLibraryEntry } from '@/src/lib/spawn'
import { AttachPoints } from '@/src/scene/AttachPoints'
import { CameraFit } from '@/src/scene/CameraFit'
import { DragGhost } from '@/src/scene/DragGhost'
import { DropCatcher } from '@/src/scene/DropCatcher'
import { Molecule } from '@/src/scene/Molecule'
import { PhysicsWrapper } from '@/src/scene/PhysicsWrapper'
import { Scene } from '@/src/scene/Scene'
import { SelectionMenu } from '@/src/scene/SelectionMenu'
import { useStore } from '@/src/store'

export function AppScene() {
  const atoms = useStore((s) => s.scene.atoms)
  const bonds = useStore((s) => s.scene.bonds)
  const molecules = useStore((s) => s.scene.molecules)
  const addAtom = useStore((s) => s.addAtom)
  const addBond = useStore((s) => s.addBond)
  const addMolecule = useStore((s) => s.addMolecule)

  // Spawn water on first mount if the scene is empty.
  useEffect(() => {
    if (Object.keys(useStore.getState().scene.atoms).length > 0) return
    const water = getLibraryEntry('water')
    if (!water) return
    const result = spawnLibraryEntry(water)
    addMolecule(result.molecule)
    for (const a of result.atoms) addAtom(a)
    for (const b of result.bonds) addBond(b)
  }, [addAtom, addBond, addMolecule])

  const atomList = Object.values(atoms)
  const bondList = Object.values(bonds)

  return (
    <Scene>
      <CameraFit />
      <PhysicsWrapper>
        {Object.values(molecules).map((m) => {
          const mAtoms = atomList.filter((a) => a.moleculeId === m.id)
          const mBonds = bondList.filter((b) => m.bondIds.includes(b.id))
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
