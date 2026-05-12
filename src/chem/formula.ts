import { getElement } from './elements'
import type { Atom } from './types'

// Elements where, conventionally, hydrogen is written LAST when the compound contains
// no carbon (e.g. NH3, BH3, PH3, SiH4). Without this list, strict electronegativity
// sort would put H first (since H is less electronegative than these elements is not
// uniformly true — but convention places H after them anyway).
const HYDRIDE_ELEMENTS = new Set(['B', 'N', 'P', 'Si', 'As', 'Ge', 'Sb'])

/**
 * Conventional chemical formula:
 * - With carbon: C, H, then rest alphabetical (Hill system).
 * - Without carbon: elements sorted by electronegativity ascending.
 *   If H is present alongside any hydride element (B, N, P, Si, As, Ge, Sb),
 *   H is moved to the end of the formula.
 *
 * Designed to match what students see in textbooks: NH3, H2O, HCl, NaCl, BH3, SiH4.
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
    // Hydride exception: if H is present and any HYDRIDE_ELEMENTS element is present,
    // move H to the end.
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
