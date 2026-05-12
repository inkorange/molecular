'use client'

import type { Atom as AtomData, Bond as BondData } from '@/src/chem/types'
import { Atom } from './Atom'
import { Bond } from './Bond'

interface MoleculeProps {
  atoms: AtomData[]
  bonds: BondData[]
}

export function Molecule({ atoms, bonds }: MoleculeProps) {
  const byId = new Map(atoms.map((a) => [a.id, a]))

  return (
    <group>
      {atoms.map((a) => (
        <Atom key={a.id} atomId={a.id} Z={a.Z} position={a.position as [number, number, number]} />
      ))}
      {bonds.map((b) => {
        const a = byId.get(b.atomA)
        const c = byId.get(b.atomB)
        if (!a || !c) return null
        return (
          <Bond
            key={b.id}
            start={a.position as [number, number, number]}
            end={c.position as [number, number, number]}
            order={b.order}
            type={b.type}
          />
        )
      })}
    </group>
  )
}
