'use client'

import { type Atom, atomId, type Bond, bondId, moleculeId } from '@/src/chem/types'
import { Molecule } from '@/src/scene/Molecule'
import { Scene } from '@/src/scene/Scene'

// Hardcoded water for Phase 2 demoability.
const M = moleculeId()
const O = atomId()
const H1 = atomId()
const H2 = atomId()

const ATOMS: Atom[] = [
  { id: O, Z: 8, position: [0, 0.2, 0], velocity: [0, 0, 0], charge: 0, moleculeId: M },
  { id: H1, Z: 1, position: [-0.85, -0.45, 0], velocity: [0, 0, 0], charge: 0, moleculeId: M },
  { id: H2, Z: 1, position: [0.85, -0.45, 0], velocity: [0, 0, 0], charge: 0, moleculeId: M },
]

const BONDS: Bond[] = [
  { id: bondId(), atomA: O, atomB: H1, order: 1, type: 'covalent' },
  { id: bondId(), atomA: O, atomB: H2, order: 1, type: 'covalent' },
]

export function AppScene() {
  return (
    <Scene>
      <Molecule atoms={ATOMS} bonds={BONDS} />
    </Scene>
  )
}
