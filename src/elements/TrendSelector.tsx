'use client'

import { TREND_META, type TrendKey } from '@/src/data/elementTrends'
import type { ElementViewMode } from './trendOverlay'

interface TrendSelectorProps {
  value: ElementViewMode
  onChange: (next: ElementViewMode) => void
}

const TREND_KEYS: readonly TrendKey[] = [
  'atomicRadius',
  'electronegativity',
  'ionizationEnergy',
  'meltingPoint',
]

/**
 * Segmented control above the periodic-table grid for toggling between
 * the default category view and one of the four periodic-trend
 * heatmaps. Picking a trend recolours every tile by its value for that
 * property; picking "Categories" returns to the family-coded palette.
 *
 * Designed to fit comfortably on mobile too — wraps onto two rows on
 * narrow viewports rather than horizontal-scrolling, so every option
 * stays tappable.
 */
export function TrendSelector({ value, onChange }: TrendSelectorProps) {
  const isTrend = value !== 'categories'
  const meta = isTrend ? TREND_META[value] : null
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-[#9aa0c8] text-[10px] uppercase tracking-wider">View:</span>
        <button
          type="button"
          onClick={() => onChange('categories')}
          className={pillClass(value === 'categories')}
        >
          Categories
        </button>
        {TREND_KEYS.map((k) => (
          <button
            type="button"
            key={k}
            onClick={() => onChange(k)}
            className={pillClass(value === k)}
            title={TREND_META[k].description}
          >
            {TREND_META[k].label}
          </button>
        ))}
      </div>
      {/* Active-trend description, shown below the segmented control.
          Helps students understand what the heatmap is showing without
          hunting through tile tooltips. */}
      {meta && (
        <p className="mt-2 max-w-2xl text-[#9aa0c8] text-xs leading-relaxed sm:text-sm">
          <span className="font-bold text-[#dffaff]">{meta.label}</span>
          {meta.unit ? ` (${meta.unit})` : ''} · {meta.description}
        </p>
      )}
    </div>
  )
}

/** Pill button style. Active pill uses the app's cyan accent. */
function pillClass(active: boolean): string {
  return active
    ? 'min-h-[32px] rounded-full bg-[#5cc6ff] px-3 py-1 text-[10px] sm:text-xs font-bold text-[#07051a] uppercase tracking-wider'
    : 'min-h-[32px] rounded-full border border-[#2a2655] bg-[#0d0a22] px-3 py-1 text-[10px] sm:text-xs font-bold text-[#9aa0c8] uppercase tracking-wider hover:text-[#dffaff] hover:border-[#5cc6ff]/40'
}
