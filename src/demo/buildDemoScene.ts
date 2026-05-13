import { REACTIONS } from '@/src/chem/reactions'
import { type Atom, atomId, type Bond, bondId, moleculeId } from '@/src/chem/types'
import type { DemoIngredient, Demonstration } from '@/src/data/demonstrations'
import { getLibraryEntry, LIBRARY } from '@/src/data/molecules'

const REACTIONS_BY_ID = new Map(REACTIONS.map((r) => [r.id, r]))
const LIBRARY_BY_FORMULA = new Map(LIBRARY.map((m) => [m.formula, m.id]))

/**
 * Per-unit label info used by `<MoleculeLabel>`. Only library-derived
 * units get an entry — bare atoms already render their element card via
 * the periodic-table-style billboard inside `<Atom>`, so re-labelling
 * them would double up.
 */
export interface SceneLabel {
  /** Spawned unit's moleculeId. Used by `buildProductLayout` to match a
   *  layout unit back to its library origin. */
  moleculeId: string
  libraryId: string
  /** World-space anchor (the unit's spawn-slot centroid). Used directly
   *  for the Ingredients step rendering, where atoms sit at absolute
   *  world positions. */
  position: [number, number, number]
}

export interface DemoSceneInstance {
  atoms: Atom[]
  bonds: Bond[]
  labels: SceneLabel[]
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
  spacing = 2.6,
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
  const labels: SceneLabel[] = []
  const positions = ingredientPositions(units.length, spacing)

  units.forEach((unit, idx) => {
    const slot = positions[idx] ?? [0, 0, 0]
    const cx = slot[0]
    const cy = slot[1]
    const cz = slot[2]
    const mId = moleculeId()
    if (unit.kind === 'library') {
      const entry = getLibraryEntry(unit.libraryId)
      if (!entry) return
      // One label per library unit, anchored at the unit's slot. The
      // MoleculeLabel component handles the vertical offset above the
      // molecule and the billboard rotation. moleculeId pairs the label
      // with the underlying atom-group so the products step can match
      // a layout unit back to its library entry.
      labels.push({
        moleculeId: mId as unknown as string,
        libraryId: unit.libraryId,
        position: [cx, cy, cz],
      })
      const idsByIndex: string[] = entry.atoms.map(() => atomId() as string)
      for (let i = 0; i < entry.atoms.length; i++) {
        const a = entry.atoms[i]
        const aid = idsByIndex[i]
        if (!a || !aid) continue
        atoms.push({
          id: aid as never,
          Z: a.Z,
          position: [a.position[0] + cx, a.position[1] + cy, a.position[2] + cz],
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
        position: [cx, cy, cz],
        velocity: [0, 0, 0],
        charge: 0,
        moleculeId: mId,
      })
    }
  })

  return { atoms, bonds, labels }
}

/**
 * Derive the Results step's scene for a demo. Honours `demo.products` if
 * the author supplied an explicit override; otherwise reads the engine
 * reaction's product stoichiometry and maps each product formula to its
 * library entry. Returns an empty scene if a formula has no library
 * entry — the author should add a `products` override in that case.
 */
export function buildProductScene(demo: Demonstration, spacing = 2.6): DemoSceneInstance {
  if (demo.products) return buildIngredientScene(demo.products, spacing)

  const reaction = REACTIONS_BY_ID.get(demo.reactionId)
  if (!reaction) return { atoms: [], bonds: [], labels: [] }

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

/**
 * Lay out N ingredient units. 1–4 stay in a horizontal row at y=0 so the
 * "starting line" of reactants reads cleanly. 5+ wrap to two rows so wide
 * combustion reactions (propane = 6 units, ethanol = 4 units) don't
 * overflow the camera frame.
 */
function ingredientPositions(n: number, spacing: number): Array<[number, number, number]> {
  if (n <= 4) {
    const halfSpan = (spacing * (n - 1)) / 2
    return Array.from({ length: n }, (_, i) => [i * spacing - halfSpan, 0, 0])
  }
  // 5+: two rows. Top row gets the extra unit when n is odd so a singleton
  // (often the hydrocarbon being burned) reads as the "headline" reactant.
  const top = Math.ceil(n / 2)
  const bottom = n - top
  const rowGap = 1.8
  const out: Array<[number, number, number]> = []
  for (let i = 0; i < top; i++) {
    const x = (i - (top - 1) / 2) * spacing
    out.push([x, rowGap / 2, 0])
  }
  for (let i = 0; i < bottom; i++) {
    const x = (i - (bottom - 1) / 2) * spacing
    out.push([x, -rowGap / 2, 0])
  }
  return out
}

/**
 * Pick world-space positions for N primary product units. For 1–2 units the
 * row layout is fine; for 3+ we shift to a stacked / cross layout so wide
 * molecules (CO₂ is ~2.4 units across) don't intersect their neighbours.
 *
 * Patterns:
 *   1 → centered
 *   2 → horizontal pair
 *   3 → triangle (one on top, two below side-by-side)
 *   4 → 2×2 grid
 *   5+ → two rows, top row gets the extra when odd
 */
function primariesLayout(n: number): Array<[number, number, number]> {
  if (n <= 1) return [[0, 0, 0]]
  if (n === 2) {
    return [
      [-1.4, 0, 0],
      [1.4, 0, 0],
    ]
  }
  if (n === 3) {
    return [
      [0, 1.1, 0],
      [-1.7, -0.9, 0],
      [1.7, -0.9, 0],
    ]
  }
  if (n === 4) {
    return [
      [-1.5, 1.0, 0],
      [1.5, 1.0, 0],
      [-1.5, -1.0, 0],
      [1.5, -1.0, 0],
    ]
  }
  // 5+: two rows. Top row gets one more when n is odd so a singleton
  // product (typical of combustion reactions) reads as the "headline".
  // Wider x spacing + a z stagger break apart wide CO₂ / H₂O products
  // (≈2.4 units across) so neighbours don't clip into each other.
  const top = Math.ceil(n / 2)
  const bottom = n - top
  const out: Array<[number, number, number]> = []
  const spacing = 2.5
  const zStagger = 0.7
  for (let i = 0; i < top; i++) {
    const x = (i - (top - 1) / 2) * spacing
    // Alternate molecules sit slightly forward / back of the plane so
    // long molecules like CO₂ pass IN FRONT OF or BEHIND their neighbour
    // instead of intersecting in the same plane.
    const z = i % 2 === 0 ? zStagger : -zStagger
    out.push([x, 1.1, z])
  }
  for (let i = 0; i < bottom; i++) {
    const x = (i - (bottom - 1) / 2) * spacing
    // Phase-shift the bottom-row stagger so the two rows don't make
    // a flat plane together.
    const z = i % 2 === 0 ? -zStagger : zStagger
    out.push([x, -1.1, z])
  }
  return out
}

export interface ProductLayoutUnit {
  /** Atoms with LOCAL positions (relative to this unit's centroid). The
   *  caller places the whole unit via the group transform below. */
  atoms: Atom[]
  bonds: Bond[]
  /** World-space position where the unit's group should sit. */
  targetPosition: [number, number, number]
  /** Scale to apply to the group. Library-product units render at full
   *  size; leftover bare atoms render smaller to read as background. */
  scale: number
  /** Library entry this unit was spawned from, if any. Drives the
   *  MoleculeLabel rendering — bare-atom units omit this and rely on
   *  the element card from `<Atom>` instead. */
  libraryId?: string
}

/**
 * Lay out the Results step. Primary product molecules (library entries —
 * the things the reaction "produced") cluster front-center in a tight
 * horizontal row; any leftover bare atoms (reaction byproducts that aren't
 * library entries on their own, e.g. the Zn²⁺ and Cl⁻ from Zn + HCl)
 * orbit around the center on a ring at reduced scale.
 *
 * Why: conservation of matter. The previous flat row layout silently
 * dropped bare-atom products and made it look like atoms vanished. This
 * variant keeps every output atom on screen while still framing the
 * "headline" product front and center.
 */
export function buildProductLayout(demo: Demonstration): ProductLayoutUnit[] {
  const flat = buildProductScene(demo)
  // moleculeId → libraryId, derived from the flat scene's label table.
  // Used to attach each primary layout unit to its library entry so
  // MoleculeLabel can look up the name + formula.
  const libraryByMol = new Map<string, string>()
  for (const label of flat.labels) {
    libraryByMol.set(label.moleculeId, label.libraryId)
  }
  // Group flat atoms+bonds by moleculeId so each spawn unit becomes one
  // layout unit. We retain the moleculeId on each grouped unit so we
  // can look up its library origin when emitting layout units below.
  type Grouped = { atoms: Atom[]; bonds: Bond[]; moleculeId: string }
  const byMol = new Map<string, Grouped>()
  for (const a of flat.atoms) {
    const key = a.moleculeId as unknown as string
    if (!byMol.has(key)) byMol.set(key, { atoms: [], bonds: [], moleculeId: key })
    byMol.get(key)?.atoms.push(a)
  }
  for (const b of flat.bonds) {
    const owner = flat.atoms.find((a) => a.id === b.atomA)
    if (!owner) continue
    const key = owner.moleculeId as unknown as string
    byMol.get(key)?.bonds.push(b)
  }

  // Convert each unit into a centroid + LOCAL-positioned-atoms pair so the
  // caller can place + scale the whole unit cleanly. A "remainder" is a
  // unit that's a single atom with no bonds — that's our heuristic for
  // "this was a bare-atom product in the demo data".
  const primaries: Grouped[] = []
  const remainders: Grouped[] = []
  for (const u of byMol.values()) {
    if (u.atoms.length === 1 && u.bonds.length === 0) remainders.push(u)
    else primaries.push(u)
  }

  function localise(unit: Grouped): {
    atoms: Atom[]
    bonds: Bond[]
    centroid: [number, number, number]
  } {
    let sx = 0
    let sy = 0
    let sz = 0
    for (const a of unit.atoms) {
      sx += a.position[0]
      sy += a.position[1]
      sz += a.position[2]
    }
    const n = unit.atoms.length || 1
    const centroid: [number, number, number] = [sx / n, sy / n, sz / n]
    const atoms = unit.atoms.map((a) => ({
      ...a,
      position: [
        a.position[0] - centroid[0],
        a.position[1] - centroid[1],
        a.position[2] - centroid[2],
      ] as [number, number, number],
    }))
    return { atoms, bonds: unit.bonds, centroid }
  }

  const units: ProductLayoutUnit[] = []

  // Primaries: pick a layout that uses both axes when there are 3+ units,
  // so wide molecules (CO₂, ethanol) don't pile up in a single row.
  const primaryPositions = primariesLayout(primaries.length)
  primaries.forEach((p, i) => {
    const { atoms, bonds } = localise(p)
    units.push({
      atoms,
      bonds,
      targetPosition: primaryPositions[i] ?? [0, 0, 0],
      scale: 1,
      libraryId: libraryByMol.get(p.moleculeId),
    })
  })

  // Remainders: ring around the cluster. Stagger angles so atoms don't
  // pile up; vary scale 0.55 / 0.7 / 0.85 cyclically so the row reads
  // as scattered debris instead of evenly-spaced satellites.
  const remainderRadius = 3.5
  const scales = [0.7, 0.55, 0.85]
  remainders.forEach((r, i) => {
    const { atoms, bonds } = localise(r)
    // Distribute angles around the full circle starting offset π/3 so
    // the first remainder doesn't sit directly under the primary cluster.
    const angle = Math.PI / 3 + (i / Math.max(1, remainders.length)) * Math.PI * 2
    const x = Math.cos(angle) * remainderRadius
    const y = Math.sin(angle) * remainderRadius * 0.5
    const z = -0.6 // push slightly back so primaries clearly read in front
    const scale = scales[i % scales.length] ?? 0.7
    units.push({ atoms, bonds, targetPosition: [x, y, z], scale })
  })

  return units
}
