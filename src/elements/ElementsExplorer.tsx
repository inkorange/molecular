'use client'

import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getPeriodicElementBySlug, type PeriodicElement } from '@/src/data/elementsFull'
import { useReducedMotion } from '@/src/lib/useReducedMotion'
import { ElementDetail } from './ElementDetail'
import { PeriodicTableGrid } from './PeriodicTableGrid'
import { PeriodicTableList } from './PeriodicTableList'
import { TileMorphLayer } from './TileMorphLayer'
import { TrendSelector } from './TrendSelector'
import type { ElementViewMode } from './trendOverlay'

interface ElementsExplorerProps {
  /** Slug pre-selected from the URL (when entered at /elements/[slug]).
   *  null on the bare /elements route. */
  initialSlug: string | null
}

/**
 * State machine for the open/close transition:
 *   idle               — grid normal; no detail
 *   morph-open         — morph clone flying out of tile slot to detail slot
 *                        (grid dimming in parallel)
 *   detail-fade-in     — morph done; detail mounted with opacity 0 → 1
 *   open               — detail fully visible, grid dimmed behind it
 *   detail-fade-out    — close clicked; detail fading 1 → 0
 *   morph-close        — morph clone flying back to the tile slot
 *                        (grid undimming in parallel)
 *
 * The grid stays mounted in EVERY phase so the user always sees the
 * periodic table behind the detail card. Only its dim/blur changes.
 */
type Phase = 'idle' | 'morph-open' | 'detail-fade-in' | 'open' | 'detail-fade-out' | 'morph-close'

interface MorphState {
  element: PeriodicElement
  startRect: DOMRect
  endRect: DOMRect
  phase: 'opening' | 'closing'
}

const MORPH_DURATION_MS = 420
const DETAIL_FADE_MS = 280

/**
 * Compute the target rect the morph clone should land at — where the
 * 3D atom slot will appear in the detail card layout. Centered
 * horizontally, sized to roughly match the detail card's aspect-square
 * 3D scene container.
 */
function computeDetailTargetRect(gridContainer: HTMLDivElement | null): DOMRect {
  if (typeof window === 'undefined') {
    return new DOMRect(0, 0, 0, 0)
  }
  const vw = window.innerWidth
  const isMd = vw >= 768
  const maxWidth = Math.min(vw - 32, 1152)
  const slotWidth = isMd ? Math.min(560, (maxWidth - 32) * 0.55) : maxWidth - 32
  const slotHeight = slotWidth
  const left = isMd ? (vw - maxWidth) / 2 + 16 : 16
  // Anchor the morph endpoint to the TOP of the grid container — which
  // sits below the persistent nav + heading. The detail card's 3D-atom
  // slot sits ~60px down from the top of the detail (after its own
  // back-button nav), so add that offset.
  const gridTop = gridContainer?.getBoundingClientRect().top ?? (isMd ? 200 : 160)
  const top = gridTop + 60
  return new DOMRect(left, top, slotWidth, slotHeight)
}

export function ElementsExplorer({ initialSlug }: ElementsExplorerProps) {
  const initial = initialSlug ? (getPeriodicElementBySlug(initialSlug) ?? null) : null
  const [selection, setSelection] = useState<PeriodicElement | null>(initial)
  const [phase, setPhase] = useState<Phase>(initial ? 'open' : 'idle')
  const [morph, setMorph] = useState<MorphState | null>(null)
  const reducedMotion = useReducedMotion()
  const tileRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  // Container that wraps the grid + detail overlay; used to anchor the
  // morph endpoint below the persistent heading.
  const gridContainerRef = useRef<HTMLDivElement | null>(null)
  // Only mount ONE of the two layouts at a time — desktop grid OR
  // mobile list. CSS-hiding both kept their `display: none` tiles in
  // the DOM, and they both registered refs into the shared tileRefs
  // map; the second to mount won, leaving the visible layout's refs
  // pointing at display:none elements (whose getBoundingClientRect
  // returns 0,0,0,0). That made close-morphs land in the corner.
  const [isMd, setIsMd] = useState<boolean | null>(null)
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    setIsMd(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setIsMd(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Current view mode for the periodic table grid — 'categories' or one
  // of the four trend keys. Drives tile coloring + the legend strip.
  const [view, setView] = useState<ElementViewMode>('categories')

  // Body scroll position on /elements at the moment we opened a detail.
  // Mobile-only: when the detail opens we scroll the page to the top
  // (the detail is a full-width column anchored to the top of the
  // wrapper; if the user was scrolled down the list they'd never see
  // it). When the detail closes we restore this saved position so they
  // pick up the list where they left off.
  const savedScrollY = useRef(0)

  const registerRef = useCallback((slug: string, el: HTMLButtonElement | null) => {
    if (el) tileRefs.current.set(slug, el)
    else tileRefs.current.delete(slug)
  }, [])

  // URL ↔ state sync. Runs on initial mount AND on every browser
  // back/forward (popstate). The mount-time call is the defensive
  // safety net: Next.js soft navigation + the browser's bf-cache can
  // leave the React tree mounted with stale state when the user comes
  // back from an external route — without this, we'd see the URL
  // reading /elements/hydrogen but the page rendering the grid (no
  // detail) because state was selection=null from before.
  useEffect(() => {
    function syncFromUrl() {
      const m = window.location.pathname.match(/^\/elements\/([^/]+)/)
      if (m?.[1]) {
        const el = getPeriodicElementBySlug(m[1])
        if (el) {
          setSelection(el)
          setPhase('open')
          setMorph(null)
        }
      } else {
        setSelection(null)
        setPhase('idle')
        setMorph(null)
      }
    }
    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)
    // pageshow fires when the page is restored from the browser
    // back-forward cache (BFC). When that happens, popstate doesn't —
    // pageshow is the right hook to re-sync.
    window.addEventListener('pageshow', syncFromUrl)
    return () => {
      window.removeEventListener('popstate', syncFromUrl)
      window.removeEventListener('pageshow', syncFromUrl)
    }
  }, [])

  const handleSelect = useCallback(
    (slug: string, startRect: DOMRect) => {
      const element = getPeriodicElementBySlug(slug)
      if (!element) return
      window.history.pushState({}, '', `/elements/${slug}`)

      // Mobile: save the current scroll position, jump to the top, and
      // skip the morph. The mobile list is a single vertical column —
      // a fly-from-tile morph reads as confusing when the start tile
      // is mid-page, and the detail card lives at top-0 of the wrapper
      // (where the user wouldn't see it without scrolling up anyway).
      if (isMd === false) {
        savedScrollY.current = window.scrollY
        window.scrollTo({ top: 0, behavior: 'instant' })
        setSelection(element)
        setPhase('open')
        setMorph(null)
        return
      }

      // Reduced-motion: skip the morph + fade entirely.
      if (reducedMotion) {
        setSelection(element)
        setPhase('open')
        setMorph(null)
        return
      }

      setSelection(element)
      setPhase('morph-open')
      setMorph({
        element,
        startRect,
        endRect: computeDetailTargetRect(gridContainerRef.current),
        phase: 'opening',
      })
    },
    [reducedMotion, isMd],
  )

  const handleClose = useCallback(() => {
    window.history.pushState({}, '', '/elements')

    // Mobile: skip the morph, restore the saved scroll on the next
    // frame so the grid has remounted/unblurred before the body jumps.
    if (isMd === false) {
      setSelection(null)
      setPhase('idle')
      setMorph(null)
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedScrollY.current, behavior: 'instant' })
      })
      return
    }

    if (reducedMotion || !selection) {
      setSelection(null)
      setPhase('idle')
      setMorph(null)
      return
    }

    // First: trigger detail's fade-out. The morph back is kicked off
    // when ElementDetail reports it has finished fading.
    setPhase('detail-fade-out')
  }, [reducedMotion, selection, isMd])

  // Called by ElementDetail once its opacity has reached 0.
  const handleDetailFadedOut = useCallback(() => {
    if (!selection) return
    const targetSlug = selection.slug
    setPhase('morph-close')
    // The grid is already mounted; wait one frame so the tile ref
    // populates if it wasn't there during the open phase (e.g. when
    // the page was first loaded at /elements/[slug] and the user
    // closes without ever seeing the grid).
    requestAnimationFrame(() => {
      const tile = tileRefs.current.get(targetSlug)
      const tileRect =
        tile?.getBoundingClientRect() ?? computeDetailTargetRect(gridContainerRef.current)
      setMorph({
        element: selection,
        startRect: computeDetailTargetRect(gridContainerRef.current),
        endRect: tileRect,
        phase: 'closing',
      })
    })
  }, [selection])

  function handleMorphComplete() {
    if (phase === 'morph-open') {
      // Morph reached the detail slot. Drop the clone and mount the
      // detail card — it self-fades in on mount.
      setPhase('detail-fade-in')
      setMorph(null)
      // detail-fade-in is just a "detail is mounted, opacity rising"
      // marker; flip to fully-open after the fade window. We could
      // tie this to ElementDetail's transition-end but the simpler
      // setTimeout matches the same duration and avoids prop-drilling.
      window.setTimeout(() => setPhase('open'), DETAIL_FADE_MS)
    } else if (phase === 'morph-close') {
      // Morph landed back at the tile slot. Clear selection so the
      // grid reveals the hidden tile underneath, and undim.
      setSelection(null)
      setPhase('idle')
      setMorph(null)
    }
  }

  // Phase-derived flags for the render branches. Note morph-close is
  // intentionally NOT here — when the close morph kicks off we want the
  // grid to start fading back IN simultaneously with the clone flying
  // back to its tile, so the table reveals itself during the same beat.
  const gridDimmed =
    phase === 'morph-open' ||
    phase === 'detail-fade-in' ||
    phase === 'open' ||
    phase === 'detail-fade-out'

  // The tile in the grid that should be hidden so the morph clone
  // covers its slot without a duplicate underneath.
  const hiddenSlug = morph ? morph.element.slug : null

  // Detail is rendered (with appropriate fade direction) once the
  // open-morph has completed and through the close-fade phase.
  const showDetail = phase === 'detail-fade-in' || phase === 'open' || phase === 'detail-fade-out'
  const detailClosing = phase === 'detail-fade-out'

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 pt-6 pb-16 md:px-8 md:pt-12">
      {/* BACKDROP: nav + heading + grid render as a single block that
          dims + blurs together when a detail card opens. From the user's
          POV it's the old grid view going out of focus — they can still
          see the page they came from peeking through behind the detail.
          When dimmed, the backdrop is taken OUT of normal flow via
          `position: fixed` so it doesn't push the page's scroll height
          to the full grid extent. That fixes a mobile bug where the
          detail card was short but the page kept scrolling for hundreds
          more pixels because the (now-blurred) periodic list behind it
          was much taller than the detail. */}
      <div
        ref={gridContainerRef}
        className={
          gridDimmed
            ? 'pointer-events-none fixed inset-x-0 top-0 mx-auto h-[100dvh] w-full max-w-6xl overflow-hidden px-4 pt-6 transition-[opacity,filter] duration-300 md:px-8 md:pt-12'
            : 'transition-[opacity,filter] duration-300'
        }
        style={{
          opacity: gridDimmed ? 0.2 : 1,
          filter: gridDimmed ? 'blur(3px)' : undefined,
        }}
      >
        <nav className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="button-glow inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#5cc6ff]/40 bg-[#0d0a22]/80 px-5 py-1.5 font-extrabold text-[#dffaff] text-xs uppercase tracking-wider backdrop-blur transition-transform hover:scale-105 hover:border-[#5cc6ff]/70 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
            Home
          </Link>
          <Link
            href="/app?mode=explore"
            className="button-glow inline-flex min-h-[40px] items-center gap-2 rounded-full px-5 py-1.5 font-extrabold text-white text-xs uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
            }}
          >
            Explore molecules
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </nav>

        <header className="mb-8">
          <h1 className="mb-3 font-extrabold text-4xl text-white leading-[1.05] tracking-tight md:text-6xl">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
              }}
            >
              The Periodic Table
            </span>
          </h1>
          <p className="max-w-2xl text-[#9aa0c8] text-base md:text-lg">
            Every element in 3D. Tap any tile to see its atom — protons and neutrons swarming inside
            a translucent nucleus, electrons orbiting on shells.
          </p>
        </header>

        <TrendSelector value={view} onChange={setView} />

        {isMd === true && (
          <PeriodicTableGrid
            selectedSlug={hiddenSlug}
            onSelect={handleSelect}
            registerRef={registerRef}
            view={view}
          />
        )}
        {isMd === false && (
          <PeriodicTableList
            selectedSlug={hiddenSlug}
            onSelect={handleSelect}
            registerRef={registerRef}
            view={view}
          />
        )}
      </div>

      {/* Detail card — sits in normal flow so its height determines
          the page's scroll height. The backdrop is fixed-positioned
          when dimmed (see above) so it doesn't compete with the
          detail for layout space. */}
      {showDetail && selection && (
        <div className="relative z-30">
          <ElementDetail
            element={selection}
            onClose={handleClose}
            closing={detailClosing}
            onFadedOut={handleDetailFadedOut}
            fadeMs={DETAIL_FADE_MS}
          />
        </div>
      )}

      {/* Morph overlay — z-40, sits above both the dimmed grid and the
          detail card so it always reads as the focal animation. */}
      {morph && (
        <TileMorphLayer
          element={morph.element}
          startRect={morph.startRect}
          endRect={morph.endRect}
          phase={morph.phase}
          durationMs={MORPH_DURATION_MS}
          onComplete={handleMorphComplete}
        />
      )}
    </div>
  )
}
