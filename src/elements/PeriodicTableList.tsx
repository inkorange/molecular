'use client'

import { useMemo } from 'react'
import { PERIODIC_ELEMENTS } from '@/src/data/elementsFull'
import { getElementTrends } from '@/src/data/elementTrends'
import { categoryAccent } from './categoryColors'
import { PeriodicTile } from './PeriodicTile'
import { type ElementViewMode, tileAccentForView } from './trendOverlay'

interface PeriodicTableListProps {
  selectedSlug: string | null
  onSelect: (slug: string, rect: DOMRect) => void
  registerRef?: (slug: string, el: HTMLButtonElement | null) => void
  /** Apply a dim/blur treatment while the detail overlay is shown. */
  dimmed?: boolean
  /** Coloring mode — 'categories' (default) or one of the trend keys. */
  view?: ElementViewMode
}

const PERIOD_LABELS: Record<number, string> = {
  1: 'Period 1',
  2: 'Period 2',
  3: 'Period 3',
  4: 'Period 4',
  5: 'Period 5',
  6: 'Period 6 + Lanthanides',
  7: 'Period 7 + Actinides',
}

/**
 * Mobile fallback for /elements. The 18-column textbook grid is too
 * wide to render legibly on phones, so below `md:` we group elements
 * by period (with lanthanides/actinides folded into their respective
 * period) and render a denser scrollable list of the same tiles.
 */
export function PeriodicTableList({
  selectedSlug,
  onSelect,
  registerRef,
  dimmed,
  view = 'categories',
}: PeriodicTableListProps) {
  const grouped = useMemo(() => {
    const buckets = new Map<number, (typeof PERIODIC_ELEMENTS)[number][]>()
    for (const el of PERIODIC_ELEMENTS) {
      // Lanthanides (row 8) fold into period 6; actinides (row 9) into 7.
      const period = el.row === 8 ? 6 : el.row === 9 ? 7 : el.row
      const list = buckets.get(period) ?? []
      list.push(el)
      buckets.set(period, list)
    }
    return [...buckets.entries()].sort(([a], [b]) => a - b)
  }, [])

  return (
    <div
      className="flex w-full flex-col gap-6 transition-[opacity,filter] duration-300"
      style={{
        opacity: dimmed ? 0.2 : 1,
        filter: dimmed ? 'blur(2px)' : undefined,
      }}
    >
      {grouped.map(([period, entries]) => (
        <section key={period} className="flex flex-col gap-2">
          <h3 className="font-bold text-[10px] text-[#9aa0c8] uppercase tracking-wider">
            {PERIOD_LABELS[period] ?? `Period ${period}`}
          </h3>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
            {entries.map((el) => {
              const categoryFallback = categoryAccent(el.category)
              const accent =
                view === 'categories'
                  ? categoryFallback
                  : tileAccentForView(el.Z, view, categoryFallback)
              const trendNumeric =
                view === 'categories' ? null : (getElementTrends(el.Z)[view] ?? null)
              return (
                <PeriodicTile
                  key={el.slug}
                  element={el}
                  positioned={false}
                  onSelect={onSelect}
                  registerRef={registerRef}
                  hidden={selectedSlug === el.slug}
                  accentOverride={view === 'categories' ? undefined : accent}
                  trendValue={
                    trendNumeric != null
                      ? view === 'electronegativity'
                        ? trendNumeric.toFixed(2)
                        : String(Math.round(trendNumeric))
                      : undefined
                  }
                />
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
