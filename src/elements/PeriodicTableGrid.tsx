'use client'

import { PERIODIC_ELEMENTS } from '@/src/data/elementsFull'
import { getElementTrends } from '@/src/data/elementTrends'
import { categoryAccent } from './categoryColors'
import { PeriodicTile } from './PeriodicTile'
import { type ElementViewMode, tileAccentForView } from './trendOverlay'

interface PeriodicTableGridProps {
  /** Slug of the currently-selected element, if any. The matching tile
   *  is hidden so it doesn't double-render under the morph clone. */
  selectedSlug: string | null
  onSelect: (slug: string, rect: DOMRect) => void
  /** Lets the parent capture each tile's button DOM node for the
   *  morph clone's start-rect lookup. */
  registerRef?: (slug: string, el: HTMLButtonElement | null) => void
  /** Apply a dim/blur treatment to every tile during a transition. */
  dimmed?: boolean
  /** Coloring mode — 'categories' (default) or one of the trend keys. */
  view?: ElementViewMode
}

/**
 * Canonical 18×9 periodic-table layout. Used at md:+ breakpoints; the
 * mobile fallback list lives in PeriodicTableList.tsx.
 *
 * The grid template uses two row-gap bands so the lanthanide and
 * actinide rows visually separate from the main block — matches every
 * textbook reproduction students will recognize.
 */
export function PeriodicTableGrid({
  selectedSlug,
  onSelect,
  registerRef,
  dimmed,
  view = 'categories',
}: PeriodicTableGridProps) {
  return (
    <div
      className="grid w-full gap-1 transition-[opacity,filter] duration-300"
      style={{
        gridTemplateColumns: 'repeat(18, minmax(0, 1fr))',
        // Rows 1–7 are the main block; row 8 (lanthanide) and 9 (actinide)
        // sit below with a small spacer gap above them.
        gridTemplateRows: 'repeat(7, minmax(0, 1fr)) 12px repeat(2, minmax(0, 1fr))',
        opacity: dimmed ? 0.2 : 1,
        filter: dimmed ? 'blur(2px)' : undefined,
      }}
    >
      {PERIODIC_ELEMENTS.map((el) => {
        // In trend mode, override the accent with a heatmap color and
        // surface the numeric value in the tile's corner so students
        // can compare exact numbers, not just hues.
        const categoryFallback = categoryAccent(el.category)
        const accent =
          view === 'categories' ? categoryFallback : tileAccentForView(el.Z, view, categoryFallback)
        const trendNumeric = view === 'categories' ? null : (getElementTrends(el.Z)[view] ?? null)
        return (
          <PeriodicTile
            key={el.slug}
            element={{
              ...el,
              // Rows 8 + 9 in our data become CSS grid rows 9 + 10 because of
              // the inserted 12px spacer row.
              row: el.row >= 8 ? el.row + 1 : el.row,
            }}
            onSelect={onSelect}
            registerRef={registerRef}
            hidden={selectedSlug === el.slug}
            accentOverride={view === 'categories' ? undefined : accent}
            trendValue={trendNumeric != null ? formatTrendValue(view, trendNumeric) : undefined}
          />
        )
      })}
    </div>
  )
}

/** Format a numeric trend value for display in a tile corner — short
 *  enough that it doesn't overflow the small tile. */
function formatTrendValue(view: ElementViewMode, value: number): string {
  if (view === 'electronegativity') return value.toFixed(2)
  if (view === 'meltingPoint')
    return value < 1000 ? String(Math.round(value)) : `${(value / 1000).toFixed(1)}k`
  if (view === 'ionizationEnergy')
    return value < 1000 ? String(Math.round(value)) : `${(value / 1000).toFixed(1)}k`
  if (view === 'atomicRadius') return String(Math.round(value))
  return String(Math.round(value))
}
