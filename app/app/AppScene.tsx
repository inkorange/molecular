'use client'

import { useEffect, useRef } from 'react'
import { getLibraryEntry } from '@/src/data/molecules'
import { tryReact } from '@/src/lib/applyReaction'
import { saveCurrent } from '@/src/lib/persistence'
import { spawnLibraryEntry } from '@/src/lib/spawn'
import { AttachPoints } from '@/src/scene/AttachPoints'
import { CameraApply } from '@/src/scene/CameraApply'
import { CameraFit } from '@/src/scene/CameraFit'
import { CameraSync } from '@/src/scene/CameraSync'
import { DragGhost } from '@/src/scene/DragGhost'
import { DropCatcher } from '@/src/scene/DropCatcher'
import { LabMolecule } from '@/src/scene/LabMolecule'
import { LabReactionEffects } from '@/src/scene/LabReactionEffects'
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
  const resetScene = useStore((s) => s.resetScene)

  // First-mount spawn.
  //
  // When `?molecule=<libId>` is in the URL we ALWAYS honour it — reset
  // the existing scene first then spawn the requested entry. The
  // previous behaviour gated on `atoms.length === 0`, but the zustand
  // store survives across route navigations (it's a module-level
  // singleton), so the second time the user arrived from an element
  // detail with a different molecule param the scene still held the
  // PREVIOUS molecule's atoms — the check returned early and the new
  // param was ignored. The user saw whatever they last opened
  // regardless of the link they clicked.
  //
  // When the URL has NO molecule param, only spawn water as a default
  // when the scene is genuinely empty. Otherwise we'd clobber a
  // user-built scene on every render.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const lib = params.get('molecule')
    if (lib) {
      const entry = getLibraryEntry(lib) ?? getLibraryEntry('water')
      if (!entry) return
      resetScene()
      const result = spawnLibraryEntry(entry)
      addMolecule(result.molecule)
      for (const a of result.atoms) addAtom(a)
      for (const b of result.bonds) addBond(b)
      return
    }
    if (Object.keys(useStore.getState().scene.atoms).length > 0) return
    const entry = getLibraryEntry('water')
    if (!entry) return
    const result = spawnLibraryEntry(entry)
    addMolecule(result.molecule)
    for (const a of result.atoms) addAtom(a)
    for (const b of result.bonds) addBond(b)
  }, [addAtom, addBond, addMolecule, resetScene])

  // Auto-save the scene to localStorage one second after the last change.
  // Debounced so rapid edits (drag, build, react) don't hammer setItem.
  // Persistence is best-effort — failures are swallowed in saveCurrent.
  useEffect(() => {
    const t = setTimeout(() => saveCurrent({ atoms, bonds, molecules }), 1000)
    return () => clearTimeout(t)
  }, [atoms, bonds, molecules])

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
      {/* CameraSync: live-mirror camera + controls into the store so the
          Share button can capture the user's current view. CameraApply: if
          a shared URL stamped a pending view onto the store, apply it once
          on mount and clear. */}
      <CameraSync />
      <CameraApply />
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
      {/* Reaction-animation overlay. Renders nothing while
          `lab.activeAnimation` is null; lights up with the demo-style
          particles + flash + energy blob when the user hits Combine. */}
      {inLab && <LabReactionEffects />}
    </Scene>
  )
}
