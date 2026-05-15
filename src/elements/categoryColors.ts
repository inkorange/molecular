import type { PeriodicCategory } from '@/src/data/elementsFull'

/**
 * Per-category accent colors used on the tile left-edge strip,
 * detail-card heading, and the element-atom shell tint. Same palette
 * vocabulary as the in-app element cards (`Atom.tsx`'s
 * CATEGORY_ACCENT) — extended with two more entries for the heavies
 * the chem engine doesn't model.
 */
const ACCENTS: Record<PeriodicCategory, string> = {
  alkali: '#FF7A8C',
  alkaline: '#FFB86B',
  transition: '#FFD07A',
  'other-metal': '#B0B5CC',
  'post-transition': '#B0B5CC',
  metalloid: '#7AD9AA',
  nonmetal: '#5CC6FF',
  halogen: '#C8FF7A',
  noble: '#C89EFF',
  lanthanide: '#ec59b6',
  actinide: '#ffd97a',
}

const LABELS: Record<PeriodicCategory, string> = {
  alkali: 'Alkali metal',
  alkaline: 'Alkaline earth',
  transition: 'Transition metal',
  'other-metal': 'Post-transition metal',
  'post-transition': 'Post-transition metal',
  metalloid: 'Metalloid',
  nonmetal: 'Nonmetal',
  halogen: 'Halogen',
  noble: 'Noble gas',
  lanthanide: 'Lanthanide',
  actinide: 'Actinide',
}

export function categoryAccent(category: PeriodicCategory): string {
  return ACCENTS[category]
}

export function categoryLabel(category: PeriodicCategory): string {
  return LABELS[category]
}
