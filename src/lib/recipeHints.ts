import { getFormula } from '@/src/chem/formula'
import { REACTIONS, type Reaction } from '@/src/chem/reactions'
import type { Atom as AtomData, SceneSnapshot } from '@/src/chem/types'

export interface RecipeHint {
  reactionId: string
  /** Human-readable balanced equation: "2 H2 + O2 → 2 H2O". */
  equation: string
  /** Plain-English summary of the reaction's products and notes. */
  notes: string
  enthalpy: 'exothermic' | 'endothermic'
  /** 'ready' means the scene already has enough reactants; 'missing' means
   *  the user still needs to add more of something. */
  status: 'ready' | 'missing'
  /** What's still needed when status === 'missing'. Empty otherwise. */
  missing: { formula: string; count: number }[]
  /** Scene molecule ids picked to satisfy this recipe (deterministic — the
   *  first N molecules of each formula). Lets the panel pass them straight
   *  to applyReaction without re-matching. Empty when missing. */
  matchedMoleculeIds: string[]
  /** What fraction of the reactant slots are already satisfied. Drives the
   *  ranker so near-ready recipes float above totally-empty ones. */
  fillRatio: number
}

interface RecipeHintsInput {
  scene: SceneSnapshot
  /** Optional. When provided, ready hints whose ALL matched ids are in the
   *  pending pool rank above ready hints that lean on background molecules.
   *  Doesn't affect missing-hint ranking. */
  pendingReactantIds?: readonly string[]
}

/** How many hints the panel shows. */
const MAX_HINTS = 6
/** Don't bother surfacing a hint that's less than this fraction filled. A
 *  reaction needing 4 reactants where the user has zero feels noisy. */
const MIN_FILL_RATIO_FOR_MISSING = 0.25

/** Index scene molecules by their formula. Returns formula → list-of-ids. */
function indexByFormula(scene: SceneSnapshot): Map<string, string[]> {
  const byFormula = new Map<string, string[]>()
  for (const m of Object.values(scene.molecules)) {
    const atomsInMol = m.atomIds
      .map((id) => scene.atoms[id])
      .filter((a): a is AtomData => Boolean(a))
    if (atomsInMol.length === 0) continue
    const formula = getFormula(atomsInMol)
    const list = byFormula.get(formula) ?? []
    list.push(m.id)
    byFormula.set(formula, list)
  }
  return byFormula
}

function formatEquation(side: readonly { formula: string; count: number }[]): string {
  return side.map((s) => `${s.count > 1 ? `${s.count} ` : ''}${s.formula}`).join(' + ')
}

function buildHint(
  reaction: Reaction,
  byFormula: Map<string, string[]>,
  pending: Set<string>,
): RecipeHint {
  const matched: string[] = []
  const missing: { formula: string; count: number }[] = []
  let neededTotal = 0
  let satisfied = 0
  let allMatchedPending = true

  for (const r of reaction.reactants) {
    neededTotal += r.count
    const available = byFormula.get(r.formula) ?? []
    const take = Math.min(available.length, r.count)
    satisfied += take
    for (let i = 0; i < take; i++) {
      const id = available[i]
      if (!id) continue
      matched.push(id)
      if (!pending.has(id)) allMatchedPending = false
    }
    if (take < r.count) {
      missing.push({ formula: r.formula, count: r.count - take })
    }
  }

  const status: RecipeHint['status'] = missing.length === 0 ? 'ready' : 'missing'
  const fillRatio = neededTotal === 0 ? 0 : satisfied / neededTotal
  const eqL = formatEquation(reaction.reactants)
  const eqR = formatEquation(reaction.products)

  return {
    reactionId: reaction.id,
    equation: `${eqL} → ${eqR}`,
    notes: reaction.notes,
    enthalpy: reaction.enthalpy,
    status,
    missing,
    matchedMoleculeIds: status === 'ready' ? matched : [],
    // A "ready" hint where every matched molecule is in the pending pool
    // is the cleanest fit — bump its effective ratio above 1 so it sorts
    // first among ready hints.
    fillRatio: status === 'ready' && allMatchedPending && pending.size > 0 ? 1.5 : fillRatio,
  }
}

/**
 * Compute ranked recipe hints for the current scene.
 *
 * Ranking (highest to lowest):
 *   1. status === 'ready' first (actionable now)
 *   2. Within 'ready', recipes whose every matched id is in the pending pool
 *      come first — that's a user who set up exactly this reaction.
 *   3. status === 'missing' ranked by fillRatio (closer to ready ranks higher)
 *   4. Missing hints below MIN_FILL_RATIO_FOR_MISSING are dropped as noise.
 *
 * Caps results at MAX_HINTS so the panel stays glanceable.
 */
export function getRecipeHints({ scene, pendingReactantIds = [] }: RecipeHintsInput): RecipeHint[] {
  const byFormula = indexByFormula(scene)
  if (byFormula.size === 0) return []
  const pending = new Set(pendingReactantIds)

  const hints: RecipeHint[] = []
  for (const r of REACTIONS) {
    const hint = buildHint(r, byFormula, pending)
    if (hint.status === 'missing' && hint.fillRatio < MIN_FILL_RATIO_FOR_MISSING) continue
    hints.push(hint)
  }

  // Stable sort: ready first (with pending-pool boost via fillRatio=1.5),
  // then missing by fillRatio desc.
  hints.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'ready' ? -1 : 1
    return b.fillRatio - a.fillRatio
  })

  return hints.slice(0, MAX_HINTS)
}
