import { REACTIONS } from '@/src/chem/reactions'
import { type Atom, atomId, type Bond, bondId, moleculeId } from '@/src/chem/types'
import type { DemoIngredient, Demonstration } from '@/src/data/demonstrations'
import { getLibraryEntry, LIBRARY } from '@/src/data/molecules'

const REACTIONS_BY_ID = new Map(REACTIONS.map((r) => [r.id, r]))
const LIBRARY_BY_FORMULA = new Map(LIBRARY.map((m) => [m.formula, m.id]))

export interface DemoSceneInstance {
  atoms: Atom[]
  bonds: Bond[]
}

/**
 * Spawn a row of DemoIngredient units into a scene snapshot.
 *
 * Each "count" of an ingredient becomes a separate instance — so
 * `{ kind: 'library', libraryId: 'hydrogen-gas', count: 2 }` becomes two
 * H₂ molecules at distinct x positions. Library ingredients clone the
 * atom + bond shape of the library entry; atom ingredients spawn a single
 * bare atom by Z.
 *
 * Used for both the Ingredients step (reactants) and the Results step
 * (products) — same layout primitive, different inputs.
 */
export function buildIngredientScene(
  ingredients: readonly DemoIngredient[],
  spacing = 2.2,
): DemoSceneInstance {
  type Unit = { kind: 'library'; libraryId: string } | { kind: 'atom'; Z: number }
  const units: Unit[] = []
  for (const ing of ingredients) {
    for (let i = 0; i < ing.count; i++) {
      if (ing.kind === 'library') units.push({ kind: 'library', libraryId: ing.libraryId })
      else units.push({ kind: 'atom', Z: ing.Z })
    }
  }

  const atoms: Atom[] = []
  const bonds: Bond[] = []
  const n = units.length
  const halfSpan = (spacing * (n - 1)) / 2

  units.forEach((unit, idx) => {
    const cx = idx * spacing - halfSpan
    const mId = moleculeId()
    if (unit.kind === 'library') {
      const entry = getLibraryEntry(unit.libraryId)
      if (!entry) return
      const idsByIndex: string[] = entry.atoms.map(() => atomId() as string)
      for (let i = 0; i < entry.atoms.length; i++) {
        const a = entry.atoms[i]
        const aid = idsByIndex[i]
        if (!a || !aid) continue
        atoms.push({
          id: aid as never,
          Z: a.Z,
          position: [a.position[0] + cx, a.position[1], a.position[2]],
          velocity: [0, 0, 0],
          charge: 0,
          moleculeId: mId,
        })
      }
      for (const b of entry.bonds) {
        const aid = idsByIndex[b.atomAIndex]
        const cid = idsByIndex[b.atomBIndex]
        if (!aid || !cid) continue
        bonds.push({
          id: bondId(),
          atomA: aid as never,
          atomB: cid as never,
          order: b.order,
          type: b.type ?? 'covalent',
        })
      }
    } else {
      atoms.push({
        id: atomId(),
        Z: unit.Z,
        position: [cx, 0, 0],
        velocity: [0, 0, 0],
        charge: 0,
        moleculeId: mId,
      })
    }
  })

  return { atoms, bonds }
}

/**
 * Derive the Results step's scene for a demo. Honours `demo.products` if
 * the author supplied an explicit override; otherwise reads the engine
 * reaction's product stoichiometry and maps each product formula to its
 * library entry. Returns an empty scene if a formula has no library
 * entry — the author should add a `products` override in that case.
 */
export function buildProductScene(demo: Demonstration, spacing = 2.2): DemoSceneInstance {
  if (demo.products) return buildIngredientScene(demo.products, spacing)

  const reaction = REACTIONS_BY_ID.get(demo.reactionId)
  if (!reaction) return { atoms: [], bonds: [] }

  const productIngredients: DemoIngredient[] = []
  for (const p of reaction.products) {
    const libId = LIBRARY_BY_FORMULA.get(p.formula)
    if (libId) productIngredients.push({ kind: 'library', libraryId: libId, count: p.count })
  }
  return buildIngredientScene(productIngredients, spacing)
}

/** Convenience getter for the engine reaction metadata (enthalpy, notes). */
export function getReactionMetadata(reactionId: string) {
  return REACTIONS_BY_ID.get(reactionId)
}
