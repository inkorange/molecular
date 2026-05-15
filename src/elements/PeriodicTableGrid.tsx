'use client'

import { PERIODIC_ELEMENTS } from '@/src/data/elementsFull'
import { PeriodicTile } from './PeriodicTile'

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
      {PERIODIC_ELEMENTS.map((el) => (
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
        />
      ))}
    </div>
  )
}
