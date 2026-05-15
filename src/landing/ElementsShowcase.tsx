'use client'

import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PerspectiveCamera as ThreePerspectiveCamera } from 'three'
import { getPeriodicElement, PERIODIC_ELEMENTS } from '@/src/data/elementsFull'
import { categoryAccent } from '@/src/elements/categoryColors'
import { computeCameraDistance, ElementAtom } from '@/src/scene/ElementAtom'
import { Scene } from '@/src/scene/Scene'

/**
 * Auto-zooming camera that smoothly tweens its distance to fit the
 * current atom's outermost shell. The element rotation cycles every
 * FEATURED_INTERVAL_MS — without an interpolated zoom the camera
 * "pops" between distances each cycle, which reads as a glitch. The
 * useFrame lerp eases the transition in ~250ms.
 *
 * The initial position is locked via useRef so R3F's reconciler doesn't
 * re-apply the position prop on each render (which would fight the
 * per-frame lerp).
 */
function AutoZoomCamera({ shells }: { shells: readonly number[] }) {
  const camRef = useRef<ThreePerspectiveCamera>(null)
  // Padding 1.0 = atom bounding sphere exactly fills the viewport. The
  // showcase card overlay covers a corner, so we want the atom large.
  // 1.18 (the element-detail page default) left too much black space
  // here because there's no UI directly adjacent to the viewport.
  const targetDistance = computeCameraDistance(shells.length, 45, 1.0)
  // Lock the initial position tuple to the FIRST render's distance.
  // useRef gives us a stable reference across renders so R3F's
  // reconciler doesn't reapply `position` every frame and overwrite
  // our useFrame lerp.
  const initialPosRef = useRef<[number, number, number]>([0, 0, targetDistance])

  useFrame((_, delta) => {
    if (!camRef.current) return
    // Lerp the vector MAGNITUDE (distance from origin), not position.z.
    // OrbitControls.autoRotate orbits the camera around the target, so
    // position.z is just the z-component of that orbit — not the actual
    // camera-to-atom distance. Lerping position.z directly was causing
    // the radius to drift larger every cycle, which read as "the atom
    // is getting further away". setLength preserves the orbit direction
    // while scaling to the new radius.
    const currentRadius = camRef.current.position.length()
    const t = 1 - Math.exp(-delta * 4)
    const newRadius = currentRadius + (targetDistance - currentRadius) * t
    camRef.current.position.setLength(newRadius)
  })

  return <PerspectiveCamera ref={camRef} makeDefault position={initialPosRef.current} fov={45} />
}

// Curated rotation of visually rich elements for the showcase. Cycles
// every FEATURED_INTERVAL_MS so the homepage stays alive even when the
// user isn't moving the cursor over the hero.
const FEATURED_Z: readonly number[] = [26, 79, 92, 14, 8]
const FEATURED_INTERVAL_MS = 6000

/**
 * Floating periodic-table card pinned to the corner of the 3D viewport.
 * Mirrors the visual language of the in-scene element cards: accent
 * left strip, atomic number top-left, oversized symbol, name + mass.
 * Mounts with a short fade/slide-in so each cycle reads as a clean
 * "next element" rather than an unexplained reset of the same scene.
 */
function FeatureCard({
  Z,
  symbol,
  name,
  mass,
  accent,
}: {
  Z: number
  symbol: string
  name: string
  mass: number
  accent: string
}) {
  return (
    <div
      className="pointer-events-none absolute top-4 left-4 flex w-[160px] gap-0 overflow-hidden rounded-lg border bg-[#0d0a22]/85 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-md md:w-[180px]"
      style={{
        borderColor: `${accent}66`,
        animation: 'featurecard-in 360ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
      }}
    >
      {/* Category accent strip */}
      <div className="w-1.5 shrink-0" style={{ background: accent }} aria-hidden="true" />
      <div className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        <span className="font-bold text-[10px] text-[#9aa0c8] tracking-wide">{Z}</span>
        <span
          className="font-extrabold text-3xl leading-none md:text-4xl"
          style={{ color: accent }}
        >
          {symbol}
        </span>
        <span className="mt-0.5 font-bold text-[#dffaff] text-sm leading-tight">{name}</span>
        <span className="text-[10px] text-[#6a6f95] leading-tight">{mass.toFixed(2)} u</span>
      </div>
      {/* Keyframes inline — this component is the only place they're
          used; lifting them to globals.css would be premature. */}
      <style>{`
        @keyframes featurecard-in {
          0%   { opacity: 0; transform: translateY(-6px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  )
}

/**
 * Compact preview of the periodic table — non-interactive, sized to
 * fit alongside a large 3D atom in the homepage promo. Each tile is a
 * tiny colored block; the whole panel is wrapped in a Link so any tap
 * lands on /elements.
 */
function MiniTable() {
  return (
    <div
      className="grid w-full"
      style={{
        gridTemplateColumns: 'repeat(18, minmax(0, 1fr))',
        gridTemplateRows: 'repeat(7, minmax(0, 1fr)) 6px repeat(2, minmax(0, 1fr))',
        gap: '3px',
      }}
    >
      {PERIODIC_ELEMENTS.map((el) => {
        const accent = categoryAccent(el.category)
        return (
          <div
            key={el.slug}
            style={{
              gridColumnStart: el.column,
              gridRowStart: el.row >= 8 ? el.row + 1 : el.row,
              background: accent,
              opacity: 0.75,
            }}
            className="aspect-square rounded-[2px]"
            aria-hidden="true"
          />
        )
      })}
    </div>
  )
}

export function ElementsShowcase() {
  const [featuredIdx, setFeaturedIdx] = useState(0)
  const featured = useMemo(() => {
    const Z = FEATURED_Z[featuredIdx % FEATURED_Z.length] ?? 26
    return getPeriodicElement(Z)
  }, [featuredIdx])

  // Defer the Canvas mount to AFTER hydration so the R3F init doesn't
  // race with React 19's concurrent commit on refresh.
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    const t = setInterval(
      () => setFeaturedIdx((i) => (i + 1) % FEATURED_Z.length),
      FEATURED_INTERVAL_MS,
    )
    return () => clearInterval(t)
  }, [])

  if (!featured) return null

  return (
    <section className="relative px-6 py-20 md:px-12 md:py-32">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <p className="mb-3 font-bold text-[#9aa0c8] text-xs uppercase tracking-[0.3em]">New</p>
          <h2 className="font-extrabold text-3xl uppercase tracking-tight md:text-5xl">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
              }}
            >
              Explore every element in 3D
            </span>
          </h2>
          <p className="mt-3 max-w-2xl text-[#9aa0c8] text-base md:text-lg">
            Every atom in the periodic table, rendered in real-time 3D. See protons and neutrons
            swirl inside a translucent nucleus. Read where each element shows up in everyday life.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          {/* Mini table — clickable as a whole. */}
          <Link
            href="/elements"
            aria-label="Open the periodic table"
            className="group block rounded-2xl border border-[#2a2655] bg-[#0d0a22]/60 p-6 transition-colors hover:border-[#5cc6ff]/40"
          >
            <MiniTable />
            <p className="mt-4 text-[#9aa0c8] text-sm">
              118 elements · interactive 3D · educational content
            </p>
          </Link>

          {/* Featured 3D atom — cycles through visually rich elements.
              Gated on hasMounted so the Canvas only initializes after
              hydration completes (R3F + React 19 concurrent rendering
              can race during hydration and crash on refresh). */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#2a2655] bg-[#0a0719]">
            {hasMounted && (
              <Scene enableBloom={false} interactive={false}>
                <AutoZoomCamera shells={featured.shells} />
                <OrbitControls
                  makeDefault
                  enablePan={false}
                  enableZoom={false}
                  enableRotate={false}
                  autoRotate
                  autoRotateSpeed={0.8}
                  target={[0, 0, 0]}
                />
                {/* 45° z-axis tilt matches the element detail scene so
                    the homepage preview previews the same orientation
                    visitors will see when they click through. */}
                <group rotation={[0, 0, Math.PI / 4]}>
                  <ElementAtom Z={featured.Z} mass={featured.mass} shells={featured.shells} />
                </group>
              </Scene>
            )}
            {/* Periodic-table-style card overlay. The 3D atom on its own
                doesn't tell you WHICH element you're looking at — and
                because the showcase auto-cycles every 6s, visitors can
                otherwise be confused by the visual "reset". This card
                names the element and re-keys on Z so React remounts it
                on each cycle, triggering the fade-in animation. */}
            <FeatureCard
              key={featured.Z}
              Z={featured.Z}
              symbol={featured.symbol}
              name={featured.name}
              mass={featured.mass}
              accent={categoryAccent(featured.category)}
            />
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/elements"
            className="button-glow inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 py-2 font-extrabold text-sm text-white uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
            }}
          >
            Open the periodic table
            <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </section>
  )
}
