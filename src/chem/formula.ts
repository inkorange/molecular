import { getElement } from './elements'
import type { Atom } from './types'

/**
 * Hill system formula: C first, then H, then everything else alphabetical by symbol.
 * If there is no carbon, ALL elements are alphabetical by symbol (including H).
 */
export function getFormula(atoms: readonly Atom[]): string {
  if (atoms.length === 0) return ''
  const counts = new Map<string, number>()
  for (const a of atoms) {
    const sym = getElement(a.Z).symbol
    counts.set(sym, (counts.get(sym) ?? 0) + 1)
  }
  const hasCarbon = counts.has('C')
  const ordered: string[] = []
  if (hasCarbon) {
    ordered.push('C')
    if (counts.has('H')) ordered.push('H')
    const rest = [...counts.keys()].filter((s) => s !== 'C' && s !== 'H').sort()
    ordered.push(...rest)
  } else {
    ordered.push(...[...counts.keys()].sort())
  }
  return ordered
    .map((s) => {
      const n = counts.get(s) ?? 0
      return n === 1 ? s : `${s}${n}`
    })
    .join('')
}
