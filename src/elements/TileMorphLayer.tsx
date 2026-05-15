'use client'

import { useEffect, useRef, useState } from 'react'
import type { PeriodicElement } from '@/src/data/elementsFull'
import { categoryAccent } from './categoryColors'

interface TileMorphLayerProps {
  element: PeriodicElement
  /** Where the tile sits in the periodic-table grid right now. */
  startRect: DOMRect
  /** Where it should land. For opening: the detail card's 3D-atom slot.
   *  For closing: the tile's current grid slot (re-measured). */
  endRect: DOMRect
  phase: 'opening' | 'closing'
  durationMs?: number
  onComplete: () => void
}

/**
 * Fixed-position overlay that animates a tile-styled box from one rect
 * to another. Used as the visual bridge between the periodic-table
 * grid and the element detail card — so the clicked tile appears to
 * fly out and grow into the detail card, and shrink back when closed.
 *
 * Hand-rolled FLIP: mount at the start rect, schedule a microtask
 * that swaps to the end rect, let the CSS transition do the rest, and
 * call `onComplete` on transition-end.
 */
export function TileMorphLayer({
  element,
  startRect,
  endRect,
  phase,
  durationMs = 420,
  onComplete,
}: TileMorphLayerProps) {
  const ref = useRef<HTMLDivElement>(null)
  // The interpolated rect is React state so the second render (after
  // microtask) drives the CSS transition.
  const [rect, setRect] = useState<DOMRect>(startRect)
  const accent = categoryAccent(element.category)

  useEffect(() => {
    // Force the browser to paint at the start rect, then on the very
    // next frame swap to the end rect. requestAnimationFrame is enough
    // — a microtask alone can land in the same paint and skip the
    // transition entirely.
    const raf = requestAnimationFrame(() => {
      setRect(endRect)
    })
    return () => cancelAnimationFrame(raf)
  }, [endRect])

  function handleTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    // Multiple properties transition together (width, height, top, left,
    // border-radius, font-size). Wait for the longest one — width — so
    // we don't fire onComplete early. transform/opacity transitions on
    // children don't bubble here because they're scoped to inner spans.
    if (e.propertyName !== 'width') return
    onComplete()
  }

  // Larger font + slightly bigger accent strip when we're approaching
  // the "open" end so the morph reads as growing rather than just
  // translating. At the close end we use the same sizing flipped.
  const isOpening = phase === 'opening'
  const isAtStart = rect === startRect
  // Symbol scales up while opening (start small → big), and down while
  // closing (start big → small). Computed via a CSS scale on a span.
  const symbolScale = (isOpening && isAtStart) || (!isOpening && !isAtStart) ? 1 : 2.4
  // Body opacity dims toward the small end so the source-tile appearance
  // matches its grid-row siblings cleanly.
  const detailOpacity = (isOpening && isAtStart) || (!isOpening && !isAtStart) ? 0 : 1

  return (
    <div
      ref={ref}
      aria-hidden="true"
      onTransitionEnd={handleTransitionEnd}
      style={{
        position: 'fixed',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        boxShadow: `inset 5px 0 0 ${accent}`,
        transition: `top ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1),
                     left ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1),
                     width ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1),
                     height ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1),
                     border-radius ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        borderRadius: rect === startRect ? 6 : 18,
        pointerEvents: 'none',
        zIndex: 40,
      }}
      className="overflow-hidden border border-[#2a2655] bg-[#0d0a22]/95"
    >
      {/* Symbol — fixed at card center, scales up as the clone grows. */}
      <span
        className="absolute inset-0 flex items-center justify-center font-extrabold font-mono text-[#dffaff]"
        style={{
          fontSize: '1.25rem',
          transform: `scale(${symbolScale})`,
          transition: `transform ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
      >
        {element.symbol}
      </span>
      {/* Atomic-number badge top-left — matches the tile vocabulary at
          the small end, fades out at the large end where the detail
          card has its own header. */}
      <span
        className="absolute top-1.5 left-2 font-mono font-semibold text-[#9aa0c8] text-xs"
        style={{
          opacity: 1 - detailOpacity,
          transition: `opacity ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
      >
        {element.Z}
      </span>
    </div>
  )
}
