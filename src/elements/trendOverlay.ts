/**
 * Trend-overlay color logic. The periodic-table grid can render in two
 * modes:
 *
 *   - 'categories' (default): tiles take their accent from the
 *     PeriodicCategory color palette in categoryColors.ts.
 *   - one of the four `TrendKey`s: tiles are colored by a heatmap
 *     gradient based on each element's value for that trend.
 *
 * The heatmap maps normalized 0..1 trend values onto a cool→hot ramp
 * (blue → cyan → green → yellow → red) so students see the periodic
 * trends as continuous gradients across the table.
 */

import { PERIODIC_ELEMENTS } from '@/src/data/elementsFull'
import { getElementTrends, type TrendKey } from '@/src/data/elementTrends'

export type ElementViewMode = 'categories' | TrendKey

/** Pre-computed min/max for each trend across every element that has a
 *  measured value, so the heatmap normalization is well-defined. Built
 *  once at module load. */
const TREND_BOUNDS: Record<TrendKey, { min: number; max: number }> = (() => {
  const keys: TrendKey[] = ['atomicRadius', 'electronegativity', 'ionizationEnergy', 'meltingPoint']
  const bounds: Record<TrendKey, { min: number; max: number }> = {
    atomicRadius: { min: Infinity, max: -Infinity },
    electronegativity: { min: Infinity, max: -Infinity },
    ionizationEnergy: { min: Infinity, max: -Infinity },
    meltingPoint: { min: Infinity, max: -Infinity },
  }
  for (const el of PERIODIC_ELEMENTS) {
    const trends = getElementTrends(el.Z)
    for (const key of keys) {
      const v = trends[key]
      if (v == null) continue
      if (v < bounds[key].min) bounds[key].min = v
      if (v > bounds[key].max) bounds[key].max = v
    }
  }
  return bounds
})()

/** Color for "no measured value for this property" tiles. Neutral gray
 *  so the eye reads them as data-absent rather than as a low value. */
export const NO_DATA_COLOR = '#3a3a4a'

/**
 * Map a normalized 0..1 value to a heatmap color. Cool blue at 0, red
 * at 1, with cyan/green/yellow waypoints between. HSL gives a smooth
 * continuous gradient with no banding.
 */
function heatmapColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t))
  // Hue runs from 220° (deep blue) down to 0° (red), inverted so high
  // values land on warm hues. Add a small bump to skew the perceptual
  // gradient toward distinguishability at the cooler end.
  const hue = 220 - clamped * 220
  // Lightness peaks in the middle so neither extreme is washed out.
  const lightness = 45 + (1 - Math.abs(clamped - 0.5) * 2) * 15
  return `hsl(${Math.round(hue)}, 78%, ${Math.round(lightness)}%)`
}

/**
 * Compute the tile accent color for the given element + view mode.
 * Returns the category color when view === 'categories'; a heatmap
 * color sampled from the trend bounds otherwise.
 */
export function tileAccentForView(
  Z: number,
  view: ElementViewMode,
  categoryFallback: string,
): string {
  if (view === 'categories') return categoryFallback
  const trends = getElementTrends(Z)
  const value = trends[view]
  if (value == null) return NO_DATA_COLOR
  const { min, max } = TREND_BOUNDS[view]
  if (max === min) return heatmapColor(0.5)
  return heatmapColor((value - min) / (max - min))
}

/** Tick labels for the legend strip — min, midpoint, max of the
 *  current trend, rounded to be readable. */
export function trendLegendTicks(view: TrendKey): { min: number; mid: number; max: number } {
  const { min, max } = TREND_BOUNDS[view]
  return { min: Math.round(min), mid: Math.round((min + max) / 2), max: Math.round(max) }
}
