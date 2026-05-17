'use client'

import type { PeriodicElement } from '@/src/data/elementsFull'
import { categoryAccent } from './categoryColors'

interface PeriodicTileProps {
  element: PeriodicElement
  onSelect: (slug: string, rect: DOMRect) => void
  /** Optional ref hook so the parent can capture the tile's rect for
   *  the morph transition without re-querying. */
  registerRef?: (slug: string, el: HTMLButtonElement | null) => void
  /** Hide the tile while its clone is morphing into the detail view. */
  hidden?: boolean
  /** When true, position via element.row/column (textbook grid).
   *  When false (mobile list), the tile flows naturally in its parent
   *  grid via auto-placement. Defaults to true. */
  positioned?: boolean
  /** Override the tile's accent strip color. Used by the trends
   *  overlay to substitute a heatmap color for the category color.
   *  When omitted, falls back to the element's category accent. */
  accentOverride?: string
  /** Optional value to render in the bottom-left corner — used by the
   *  trends overlay to show e.g. electronegativity "3.16" right on
   *  the tile so the user can compare exact numbers, not just colors. */
  trendValue?: string
}

/**
 * Single clickable cell in the periodic table. Designed to read like
 * the existing `<PaletteCard>` (left-edge category accent strip,
 * symbol-dominant layout) so the explorer feels like part of the same
 * design family.
 */
export function PeriodicTile({
  element,
  onSelect,
  registerRef,
  hidden,
  positioned = true,
  accentOverride,
  trendValue,
}: PeriodicTileProps) {
  const accent = accentOverride ?? categoryAccent(element.category)

  return (
    <button
      type="button"
      ref={(el) => registerRef?.(element.slug, el)}
      aria-label={`${element.name}, atomic number ${element.Z}`}
      onClick={(e) => onSelect(element.slug, e.currentTarget.getBoundingClientRect())}
      style={{
        // Only pin to the textbook (row, column) in the desktop grid.
        // Mobile list passes positioned=false so the tile auto-flows.
        gridColumnStart: positioned ? element.column : undefined,
        gridRowStart: positioned ? element.row : undefined,
        boxShadow: `inset 4px 0 0 ${accent}`,
        visibility: hidden ? 'hidden' : undefined,
        // When a trend-overlay accent is supplied, also tint the tile
        // body so the heatmap reads at a glance from across the grid.
        // Without the body tint, the only color cue was the 4-pixel
        // left edge — too subtle to read as a gradient on a 5×5-tile
        // viewport at desktop sizes.
        background: accentOverride
          ? `linear-gradient(135deg, ${accentOverride}55 0%, #0d0a22 70%)`
          : undefined,
      }}
      className="relative flex aspect-square flex-col justify-between overflow-hidden rounded-md border border-[#2a2655] bg-[#0d0a22]/90 px-1.5 py-1 text-left font-mono text-[#dffaff] transition-transform duration-150 ease-out hover:z-10 hover:scale-[1.06] hover:border-[#5cc6ff]/60 hover:shadow-[0_4px_18px_rgba(92,198,255,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5cc6ff]"
    >
      <span className="flex items-start justify-between">
        <span className="pl-1 font-semibold text-[#9aa0c8] text-[10px] leading-none">
          {element.Z}
        </span>
        {trendValue && (
          <span className="pr-0.5 font-bold text-[#dffaff] text-[9px] leading-none">
            {trendValue}
          </span>
        )}
      </span>
      <span className="text-center font-extrabold text-lg leading-none sm:text-xl">
        {element.symbol}
      </span>
      <span className="text-center text-[8px] text-[#8d92b8] leading-tight">{element.name}</span>
    </button>
  )
}
