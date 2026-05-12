import { ELEMENTS } from '@/src/chem/elements'
import type { ElementCategory } from '@/src/chem/types'

export const CATEGORY_ACCENT: Record<ElementCategory, string> = {
  alkali: '#FF7A8C',
  alkaline: '#FFB86B',
  transition: '#FFD07A',
  'other-metal': '#B0B5CC',
  metalloid: '#7AD9AA',
  nonmetal: '#5CC6FF',
  halogen: '#C8FF7A',
  noble: '#C89EFF',
}

export const CATEGORY_LABEL: Record<ElementCategory, string> = {
  alkali: 'Alkali Metals',
  alkaline: 'Alkaline Earth',
  transition: 'Transition Metals',
  'other-metal': 'Other Metals',
  metalloid: 'Metalloids',
  nonmetal: 'Reactive Nonmetals',
  halogen: 'Halogens',
  noble: 'Noble Gases',
}

// Sidebar display order — most-used groups first so beginners see them.
export const SIDEBAR_ORDER: ElementCategory[] = [
  'nonmetal',
  'halogen',
  'alkali',
  'alkaline',
  'noble',
  'metalloid',
  'other-metal',
  'transition',
]

export function tierMaxZ(tier: 'beginner' | 'standard' | 'advanced'): number {
  if (tier === 'beginner') return 20
  return 36
}

export function groupedElements(maxZ: number) {
  const filtered = ELEMENTS.filter((e) => e.Z <= maxZ)
  return SIDEBAR_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    accent: CATEGORY_ACCENT[category],
    entries: filtered.filter((e) => e.category === category),
  })).filter((g) => g.entries.length > 0)
}
