import { getElement } from './elements'
import type { Atom } from './types'

// Elements where, conventionally, hydrogen is written LAST when the compound contains
// no carbon (e.g. NH3, BH3, PH3, SiH4).
const HYDRIDE_ELEMENTS = new Set(['B', 'N', 'P', 'Si', 'As', 'Ge', 'Sb'])

/**
 * Compound-formula overrides for common compounds whose conventional textbook
 * formula doesn't match algorithmic electronegativity-ordering. Keyed by the
 * sorted "symbol1Count1symbol2Count2..." signature of the atom multiset.
 *
 * Example: NaOH = 1 Na + 1 O + 1 H → signature 'H1Na1O1' → 'NaOH'.
 *
 * The signature is built by sorting element symbols alphabetically (NOT the formula),
 * then concatenating symbol + count for each.
 */
const COMPOUND_OVERRIDES: Record<string, string> = {
  H1Na1O1: 'NaOH',
  H1K1O1: 'KOH',
  C1Ca1O3: 'CaCO3',
  Cu1O4S1: 'CuSO4',
  Fe1O4S1: 'FeSO4',
  K1N1O3: 'KNO3',
  Na2O4S1: 'Na2SO4',
}

function signature(counts: Map<string, number>): string {
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sym, n]) => `${sym}${n}`)
    .join('')
}

/**
 * Conventional chemical formula:
 * - First, check the COMPOUND_OVERRIDES map by atom-count signature.
 * - Otherwise:
 *   - With carbon: C, H, then rest alphabetical (Hill system).
 *   - Without carbon: elements sorted by electronegativity ascending.
 *     If H is present alongside any hydride element (B, N, P, Si, As, Ge, Sb),
 *     H is moved to the end.
 *
 * Designed to match what students see in textbooks: NH3, H2O, HCl, NaCl, BH3,
 * SiH4, NaOH, KOH, CaCO3.
 */
export function getFormula(atoms: readonly Atom[]): string {
  if (atoms.length === 0) return ''

  const counts = new Map<string, number>()
  const electronegativity = new Map<string, number>()
  for (const a of atoms) {
    const el = getElement(a.Z)
    counts.set(el.symbol, (counts.get(el.symbol) ?? 0) + 1)
    electronegativity.set(el.symbol, el.electronegativity)
  }

  const sig = signature(counts)
  const override = COMPOUND_OVERRIDES[sig]
  if (override) return override

  const symbols = [...counts.keys()]
  const hasCarbon = counts.has('C')
  let ordered: string[]

  if (hasCarbon) {
    const rest = symbols.filter((s) => s !== 'C' && s !== 'H').sort()
    ordered = ['C', ...(counts.has('H') ? ['H'] : []), ...rest]
  } else {
    ordered = symbols.slice().sort((x, y) => {
      const ex = electronegativity.get(x) ?? 0
      const ey = electronegativity.get(y) ?? 0
      if (ex === ey) return x.localeCompare(y)
      return ex - ey
    })
    if (ordered.includes('H') && ordered.some((s) => HYDRIDE_ELEMENTS.has(s))) {
      ordered = [...ordered.filter((s) => s !== 'H'), 'H']
    }
  }

  return ordered
    .map((s) => {
      const n = counts.get(s) ?? 0
      return n === 1 ? s : `${s}${n}`
    })
    .join('')
}
