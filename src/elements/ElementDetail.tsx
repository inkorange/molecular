'use client'

import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { ArrowLeft, ArrowUpRight, Info } from 'lucide-react'
import Link from 'next/link'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getElementContent } from '@/src/data/elementsContent'
import type { PeriodicElement } from '@/src/data/elementsFull'
import { LIBRARY } from '@/src/data/molecules'
import { formatFormula } from '@/src/lib/formatFormula'
import { computeCameraDistance, ElementAtom } from '@/src/scene/ElementAtom'
import { Scene } from '@/src/scene/Scene'
import { categoryAccent, categoryLabel } from './categoryColors'

interface ElementDetailProps {
  element: PeriodicElement
  onClose: () => void
  /** When true, fade the card out (opacity 1 → 0) and call
   *  `onFadedOut` when the transition completes. The parent then
   *  runs the close-morph back to the periodic table. */
  closing?: boolean
  onFadedOut?: () => void
  /** Mount-time fade-in / close-time fade-out duration in ms. */
  fadeMs?: number
}

/**
 * Find every library molecule that contains at least one atom of the
 * selected element. The lab `/app?molecule=<id>` deep-link picks them
 * up so visitors land in the molecule they clicked.
 */
function relatedMolecules(Z: number) {
  return LIBRARY.filter((m) => m.atoms.some((a) => a.Z === Z))
}

/**
 * Small info-bubble that pops a one-or-two-sentence definition on
 * hover (or tap on touch). Used next to each stat label so students
 * who don't yet know what a "proton" is can find out without leaving
 * the page.
 */
function HelpBubble({ children, label }: { children: React.ReactNode; label: string }) {
  // Hover (desktop) and click (mobile) both open the tooltip. We track
  // each independently because Base UI's Tooltip is hover/focus only —
  // there's no built-in click trigger. Click "sticks" the tooltip open
  // until the user clicks the icon again or anywhere outside it.
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const open = hovered || clicked
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Outside-click closes the sticky click state. Listener only attached
  // while clicked=true so we don't subscribe globally for every help
  // bubble on the page.
  useEffect(() => {
    if (!clicked) return
    function handlePointerDown(e: PointerEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setClicked(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [clicked])

  return (
    <Tooltip open={open} onOpenChange={() => {}}>
      <TooltipTrigger
        render={
          <button
            ref={triggerRef}
            type="button"
            aria-label={`What is a ${label}?`}
            aria-expanded={open}
            className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[#9aa0c8] transition-colors hover:text-[#dffaff] focus:outline-none focus-visible:text-[#dffaff]"
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onClick={(e) => {
              // stopPropagation so the document outside-click listener
              // (registered above when clicked=true) doesn't see this
              // tap and immediately re-close what we just opened.
              e.stopPropagation()
              setClicked((v) => !v)
            }}
          >
            <Info className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        }
      />
      <TooltipContent
        side="top"
        className="max-w-[220px] border-[#5cc6ff]/40 bg-[#0d0a22] px-3 py-2 text-[#dffaff] text-xs leading-relaxed shadow-[0_4px_18px_rgba(0,0,0,0.5)]"
      >
        {children}
      </TooltipContent>
    </Tooltip>
  )
}

export function ElementDetail({
  element,
  onClose,
  closing = false,
  onFadedOut,
  fadeMs = 280,
}: ElementDetailProps) {
  const accent = categoryAccent(element.category)
  const content = getElementContent(element.Z)
  const related = useMemo(() => relatedMolecules(element.Z), [element.Z])
  const neutronCount = Math.max(0, Math.round(element.mass) - element.Z)

  // Defer the 3D scene mount to AFTER hydration. Mounting the R3F
  // Canvas during the SSR→client hydration window was crashing the
  // tab on refresh (WebGL context creation racing with React 19's
  // concurrent commit). Waiting one effect tick lets hydration settle
  // first.
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])
  // Auto-zoom: pull the camera back enough that the outermost electron
  // shell (which scales with shell count — 7 shells for uranium) fits
  // in the FOV-45 viewport with ~18% padding. useMemo keeps the
  // position tuple stable so R3F doesn't reset the camera every render
  // and fight the OrbitControls auto-rotate.
  const cameraPosition = useMemo<[number, number, number]>(
    () => [0, 0, computeCameraDistance(element.shells.length, 45, 1.18)],
    [element.shells.length],
  )
  const cameraDistance = cameraPosition[2]
  const maxOrbitDistance = cameraDistance * 1.6
  const minOrbitDistance = Math.max(1.5, cameraDistance * 0.55)

  // Mount-time fade-in: start at opacity 0, flip to 1 on the next
  // animation frame so the CSS transition has a `from` and `to` value
  // to interpolate between.
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  // Fade-out: when the parent flips `closing` to true, drive opacity to
  // 0 and fire `onFadedOut` on transition-end so the parent can start
  // the close-morph.
  const targetOpacity = closing ? 0 : shown ? 1 : 0
  function handleTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    if (e.propertyName !== 'opacity') return
    if (closing) onFadedOut?.()
  }

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      className="flex flex-col gap-8"
      style={{
        opacity: targetOpacity,
        transition: `opacity ${fadeMs}ms ease-out`,
      }}
    >
      {/* Top nav — back to grid + open the lab. Mirrors the demo /
          about page pattern. */}
      <nav className="flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="button-glow inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#5cc6ff]/40 bg-[#0d0a22]/80 px-5 py-1.5 font-extrabold text-[#dffaff] text-xs uppercase tracking-wider backdrop-blur transition-transform hover:scale-105 hover:border-[#5cc6ff]/70 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          Periodic table
        </button>
        <Link
          href="/app"
          className="button-glow inline-flex min-h-[40px] items-center gap-2 rounded-full px-5 py-1.5 font-extrabold text-white text-xs uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
          }}
        >
          Open the lab
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-[1.1fr_1fr]">
        {/* 3D atom — full square slot, auto-rotating. The Scene is gated
            on `hasMounted` so the R3F Canvas only initializes AFTER the
            hydration commit; mounting it during hydration was racing
            with React 19's concurrent rendering and crashing the tab. */}
        <div className="aspect-square w-full overflow-hidden rounded-2xl border border-[#2a2655] bg-[#0d0a22]/40">
          {hasMounted && (
            <Suspense fallback={null}>
              {/* enableBloom={false} — the postprocessing chain (bloom +
                  motion-blur framebuffers) was the likely cause of the
                  refresh-crash on heavy elements. The atom renders well
                  without bloom; the additive trails + emissive nucleus
                  already carry the visual punch. */}
              <Scene enableBloom={false} interactive>
                <PerspectiveCamera makeDefault position={cameraPosition} fov={45} />
                <OrbitControls
                  makeDefault
                  enablePan={false}
                  enableZoom
                  enableRotate
                  autoRotate
                  autoRotateSpeed={0.6}
                  minDistance={minOrbitDistance}
                  maxDistance={maxOrbitDistance}
                  target={[0, 0, 0]}
                />
                {/* 45° z-axis tilt so the orbital planes don't read as a
                    flat 2D ring on first paint — they roll diagonally
                    across the frame, hinting at the 3D structure. */}
                <group rotation={[0, 0, Math.PI / 4]}>
                  <ElementAtom Z={element.Z} mass={element.mass} shells={element.shells} />
                </group>
              </Scene>
            </Suspense>
          )}
        </div>

        {/* Right column: data + content sections. */}
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <span
              className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider"
              style={{ color: accent, border: `1px solid ${accent}50` }}
            >
              {categoryLabel(element.category)}
            </span>
            {/* Headline: oversized atomic symbol on the left, sized to
                roughly span both right-column lines. items-end pins the
                right column to the symbol's baseline so the bottoms of
                "Tm" and the mass line are flush. */}
            <div className="flex items-end gap-4">
              <span
                className="font-extrabold text-8xl leading-none md:text-9xl"
                style={{ color: accent }}
              >
                {element.symbol}
              </span>
              <div className="flex flex-col gap-1 pb-1">
                <h1 className="font-extrabold text-3xl text-white leading-none md:text-4xl">
                  {element.name}
                </h1>
                <p className="text-[#9aa0c8] text-sm leading-none">
                  Atomic number {element.Z} · {element.mass} u
                </p>
              </div>
            </div>
          </header>

          {/* Atomic stats — three "chip" cells across the top with big
              color-coded numbers (matching the 3D viz palette: protons
              pink, neutrons blue-grey, electrons cyan). Each stat has a
              tiny Info-icon next to its label that pops a definition on
              hover — so students who haven't seen these terms yet can
              find out without leaving the page. */}
          <TooltipProvider delay={150}>
            <div className="grid gap-3">
              <dl className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: 'Protons',
                    value: element.Z,
                    color: '#ff7a8c',
                    bg: 'rgba(255, 122, 140, 0.08)',
                    border: 'rgba(255, 122, 140, 0.3)',
                    help: 'Positively-charged particles in the nucleus. The number of protons is what makes an element what it is — change the count and you change the element.',
                  },
                  {
                    label: 'Neutrons',
                    value: neutronCount,
                    color: '#9aa0c8',
                    bg: 'rgba(154, 160, 200, 0.08)',
                    border: 'rgba(154, 160, 200, 0.3)',
                    help: 'Neutral particles in the nucleus that add mass without changing the element. Atoms of the same element with different neutron counts are called isotopes.',
                  },
                  {
                    label: 'Electrons',
                    value: element.Z,
                    color: '#5cc6ff',
                    bg: 'rgba(92, 198, 255, 0.08)',
                    border: 'rgba(92, 198, 255, 0.3)',
                    help: "Negatively-charged particles orbiting the nucleus. They're what hold atoms together into molecules — chemistry is mostly the story of electrons.",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-start gap-0.5 rounded-xl border px-3 py-3"
                    style={{ backgroundColor: stat.bg, borderColor: stat.border }}
                  >
                    <span className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-[0.18em] text-[#9aa0c8]">
                      {stat.label}
                      <HelpBubble label={stat.label.toLowerCase()}>{stat.help}</HelpBubble>
                    </span>
                    <span
                      className="font-extrabold text-3xl leading-none md:text-4xl"
                      style={{
                        color: stat.color,
                        textShadow: `0 0 24px ${stat.color}40`,
                      }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </dl>

              {/* Shell configuration — chips along a row, each labeled
                  with shell letter + electron count. */}
              <div className="rounded-xl border border-[#2a2655] bg-[#0d0a22]/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-[0.18em] text-[#9aa0c8]">
                    Electron shells
                    <HelpBubble label="electron shell">
                      Concentric layers around the nucleus where electrons live. Each shell holds a
                      fixed maximum (2, 8, 18, 32, ...). Electrons fill the inner shells first, and
                      the outermost shell controls how the atom bonds.
                    </HelpBubble>
                  </span>
                  <span className="text-[10px] text-[#6a6f95]">K → outer</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {element.shells.map((count, i) => (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: shell order is stable per element
                      key={`shell-${i}`}
                      className="inline-flex items-baseline gap-1 rounded-md border border-[#5cc6ff]/30 bg-[#0d0a22]/70 px-2 py-1"
                    >
                      <span className="font-mono text-[10px] text-[#6a6f95]">
                        {String.fromCharCode(75 + i)}
                      </span>
                      <span className="font-extrabold font-mono text-[#dffaff]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TooltipProvider>

          {(content.discoveredYear || content.discoveredBy) && (
            <section>
              <h2 className="mb-1 font-bold text-[10px] text-[#9aa0c8] uppercase tracking-[0.25em]">
                Discovery
              </h2>
              <p className="text-[#dffaff] text-base">
                {content.discoveredYear !== undefined
                  ? content.discoveredYear < 0
                    ? `Known since at least ${Math.abs(content.discoveredYear)} BCE`
                    : `Discovered in ${content.discoveredYear}`
                  : ''}
                {content.discoveredBy ? ` · ${content.discoveredBy}` : ''}
              </p>
            </section>
          )}

          {content.uses && content.uses.length > 0 && (
            <section>
              <h2 className="mb-2 font-bold text-[10px] text-[#9aa0c8] uppercase tracking-[0.25em]">
                Common uses
              </h2>
              <ul className="flex flex-wrap gap-2">
                {content.uses.map((u) => (
                  <li
                    key={u}
                    className="rounded-full border border-[#2a2655] bg-[#0d0a22]/70 px-3 py-1 text-[#dffaff] text-xs"
                  >
                    {u}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {content.everydayExamples && (
            <section>
              <h2 className="mb-1 font-bold text-[10px] text-[#9aa0c8] uppercase tracking-[0.25em]">
                Everyday examples
              </h2>
              <p className="text-[#dffaff] text-base leading-relaxed">{content.everydayExamples}</p>
            </section>
          )}

          {!content.discoveredYear && !content.uses && !content.everydayExamples && (
            <p className="rounded-xl border border-[#2a2655] bg-[#0d0a22]/40 p-4 text-[#9aa0c8] text-sm italic">
              Educational content for {element.name} is coming soon.
            </p>
          )}
        </div>
      </div>

      {/* Related molecules — fully-bleed section below the two-col
          layout. Iterates LIBRARY for any molecule that contains this Z. */}
      {related.length > 0 && (
        <section>
          <h2 className="mb-4 font-extrabold text-2xl text-white uppercase tracking-tight md:text-3xl">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
              }}
            >
              See related molecules
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {related.map((m) => (
              <Link
                key={m.id}
                href={`/app?molecule=${m.id}`}
                className="group flex flex-col gap-1 rounded-xl border border-[#2a2655] bg-[#0d0a22]/60 p-4 transition-colors hover:border-[#5cc6ff]/40"
              >
                <span className="font-mono font-extrabold text-[#dffaff] text-lg">
                  {formatFormula(m.formula)}
                </span>
                <span className="text-[#9aa0c8] text-sm">{m.name}</span>
                <span className="mt-1 inline-flex items-center gap-1 self-start font-bold text-[#5cc6ff] text-xs uppercase tracking-wider group-hover:underline">
                  Open in lab
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {related.length === 0 && (
        <p className="rounded-xl border border-[#2a2655] bg-[#0d0a22]/40 p-4 text-[#9aa0c8] text-sm italic">
          No library molecules contain {element.name} yet.
        </p>
      )}
    </div>
  )
}
