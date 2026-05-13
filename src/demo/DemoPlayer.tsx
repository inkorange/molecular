'use client'

import { PerspectiveCamera } from '@react-three/drei'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { Atom as AtomData, Bond as BondData } from '@/src/chem/types'
import type { Demonstration } from '@/src/data/demonstrations'
import { Molecule } from '@/src/scene/Molecule'
import { Scene } from '@/src/scene/Scene'
import { AnimatedMolecule } from './AnimatedMolecule'
import { buildIngredientScene, buildProductScene, getReactionMetadata } from './buildDemoScene'
import { ReactionEffect } from './ReactionEffect'

type Level = 'elementary' | 'advanced'
type Step = 'ingredients' | 'combine' | 'results'

const STEP_ORDER: Step[] = ['ingredients', 'combine', 'results']

const STEP_LABEL: Record<Step, string> = {
  ingredients: 'Ingredients',
  combine: 'Combine',
  results: 'Results',
}

// Length of the ingredients→combine transition. Long enough for the
// merge motion and effect burst to read clearly without dragging.
const TRANSITION_MS = 1400

const REACTION_TYPE_COLOR: Record<string, string> = {
  synthesis: '#5cc6ff',
  combustion: '#ff7a8c',
  decomposition: '#c89eff',
  neutralization: '#a4ff8c',
  displacement: '#ffd97a',
}

interface DemoPlayerProps {
  demo: Demonstration
  initialLevel: Level
}

/**
 * Demonstrations player. Manages step state (ingredients → combine →
 * results), drives the 3D scene contents accordingly, and surfaces the
 * audience-leveled step text in a bubble overlay above the canvas. The
 * player is standalone — it does NOT mount AppShell or any gameplay
 * chrome; students should focus only on the demo content.
 */
export function DemoPlayer({ demo, initialLevel }: DemoPlayerProps) {
  const [step, setStep] = useState<Step>('ingredients')
  // While transitioning, `step` is the OUTGOING step (ingredients) and
  // `pendingStep` is the incoming one (combine). The render path uses
  // both to draw exiting + entering scenes at once + the effect overlay.
  const [transitionStartedAt, setTransitionStartedAt] = useState<number | null>(null)
  const [level] = useState<Level>(initialLevel)
  const [shareToast, setShareToast] = useState<string | null>(null)

  const reaction = useMemo(() => getReactionMetadata(demo.reactionId), [demo.reactionId])
  const ingredientScene = useMemo(() => buildIngredientScene(demo.ingredients), [demo.ingredients])
  const productScene = useMemo(() => buildProductScene(demo), [demo])

  // Group atoms by moleculeId so each unit can animate independently
  // (e.g. each H₂ molecule shrinks toward origin on its own).
  const ingredientUnits = useMemo(
    () => groupByMolecule(ingredientScene.atoms, ingredientScene.bonds),
    [ingredientScene],
  )
  const productUnits = useMemo(
    () => groupByMolecule(productScene.atoms, productScene.bonds),
    [productScene],
  )

  const isTransitioning = transitionStartedAt !== null
  const stepIndex = STEP_ORDER.indexOf(step)
  const canPrev = stepIndex > 0 && !isTransitioning
  const canNext = stepIndex < STEP_ORDER.length - 1 && !isTransitioning

  function goPrev() {
    if (canPrev) {
      const prev = STEP_ORDER[stepIndex - 1]
      if (prev) setStep(prev)
    }
  }
  function goNext() {
    if (!canNext) return
    // The ingredients → combine hop is the visually meaningful transition
    // that warrants the merge motion + effect overlay. Other hops are
    // just text + scene swaps.
    if (step === 'ingredients') {
      setTransitionStartedAt(performance.now())
      return
    }
    const next = STEP_ORDER[stepIndex + 1]
    if (next) setStep(next)
  }

  // When a transition is running, schedule the step swap to land at the
  // end of the animation window. Cleanup cancels the pending swap if the
  // user navigates away mid-transition.
  useEffect(() => {
    if (!isTransitioning) return
    const t = window.setTimeout(() => {
      setStep('combine')
      setTransitionStartedAt(null)
    }, TRANSITION_MS)
    return () => window.clearTimeout(t)
  }, [isTransitioning])

  async function share() {
    const url = `${window.location.origin}/demo/${demo.id}?level=${level}`
    try {
      await navigator.clipboard.writeText(url)
      setShareToast('Demo link copied to clipboard')
    } catch {
      setShareToast(url)
    }
    setTimeout(() => setShareToast(null), 2400)
  }

  const bubbleText = demo.steps[step][level]
  const typeColor = REACTION_TYPE_COLOR[demo.reactionType] ?? '#5cc6ff'

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-[#07051a]">
      {/* Full-bleed 3D scene. Three render modes share one canvas:
            - ingredients: render reactant units, idle.
            - transitioning: ingredient units shrink toward origin (exiting)
              while product units grow from origin (entering), plus the
              reaction-type effect overlay bursts at center.
            - combine/results: render product units idle. */}
      <div className="absolute inset-0">
        <Scene interactive={false}>
          <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={45} />
          {step === 'ingredients' && !isTransitioning && (
            <Molecule atoms={ingredientScene.atoms} bonds={ingredientScene.bonds} />
          )}
          {isTransitioning && transitionStartedAt !== null && (
            <>
              {ingredientUnits.map((unit) => (
                <AnimatedMolecule
                  key={`exit-${unit.atoms[0]?.moleculeId ?? unit.atoms[0]?.id}`}
                  atoms={unit.atoms}
                  bonds={unit.bonds}
                  phase="exiting"
                  phaseStartedAt={transitionStartedAt}
                  durationMs={TRANSITION_MS}
                />
              ))}
              {productUnits.map((unit) => (
                <AnimatedMolecule
                  key={`enter-${unit.atoms[0]?.moleculeId ?? unit.atoms[0]?.id}`}
                  atoms={unit.atoms}
                  bonds={unit.bonds}
                  phase="entering"
                  phaseStartedAt={transitionStartedAt}
                  durationMs={TRANSITION_MS}
                />
              ))}
              <ReactionEffect
                kind={demo.effectKind}
                phaseStartedAt={transitionStartedAt}
                durationMs={TRANSITION_MS}
              />
            </>
          )}
          {(step === 'combine' || step === 'results') && !isTransitioning && (
            <Molecule atoms={productScene.atoms} bonds={productScene.bonds} />
          )}
        </Scene>
      </div>

      {/* Top toolbar — title + reaction-type badge + back/share. */}
      <header className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/demo"
            aria-label="Back to demonstrations"
            className="inline-flex min-h-[36px] items-center justify-center rounded-full border border-[#2a2655] bg-[#0d0a22]/80 px-3 py-1 text-[#dffaff] text-xs backdrop-blur hover:bg-[#1a163a]"
          >
            ←
          </Link>
          <div className="flex flex-col">
            <h1 className="font-extrabold text-[#dffaff] text-sm uppercase tracking-wider sm:text-base">
              {demo.title}
            </h1>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: typeColor }}>
              {demo.reactionType}
              {reaction?.enthalpy ? ` · ${reaction.enthalpy}` : ''}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={share}
          className="button-glow inline-flex min-h-[40px] items-center gap-1 rounded-full px-4 py-1.5 text-white text-xs font-extrabold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #a4ff8c 0%, #5cc6ff 100%)' }}
        >
          Share
        </button>
      </header>

      {/* Bottom: step bubble + Prev/Next nav. */}
      <footer className="absolute right-0 bottom-0 left-0 z-10 flex flex-col gap-3 px-4 pb-5 sm:px-8 sm:pb-8">
        {/* Step bubble */}
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[#5cc6ff]/30 bg-[#0d0a22]/90 px-5 py-4 text-[#dffaff] shadow-[0_0_32px_rgba(92,198,255,0.18)] backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <span
              className="text-[10px] font-extrabold uppercase tracking-[0.25em]"
              style={{ color: typeColor }}
            >
              Step {stepIndex + 1} · {STEP_LABEL[step]}
            </span>
            <span className="text-[10px] text-[#6a6f95] uppercase tracking-wider">
              {level === 'elementary' ? 'Elementary' : 'Advanced'}
            </span>
          </div>
          <p className="text-[#dffaff] text-sm leading-relaxed sm:text-base">{bubbleText}</p>
          {/* Results step also surfaces the engine-level enthalpy snippet
              when one is available — small, factual, not in either voice. */}
          {step === 'results' && reaction?.notes && (
            <p className="mt-2 text-[#9aa0c8] text-xs leading-relaxed">{reaction.notes}</p>
          )}
        </div>

        {/* Step nav */}
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canPrev}
            className="min-h-[40px] rounded-full border border-[#2a2655] bg-[#0d0a22]/80 px-4 py-1.5 text-[#dffaff] text-xs font-extrabold uppercase tracking-wider transition-colors hover:bg-[#1a163a] disabled:opacity-30"
          >
            ← Back
          </button>
          {/* Centered step pips */}
          <div className="flex items-center gap-2">
            {STEP_ORDER.map((s, i) => (
              <span
                key={s}
                className={
                  i <= stepIndex
                    ? 'h-2 w-6 rounded-full bg-[#5cc6ff]'
                    : 'h-2 w-6 rounded-full bg-[#2a2655]'
                }
              />
            ))}
          </div>
          <button
            type="button"
            onClick={goNext}
            disabled={!canNext}
            className="button-glow inline-flex min-h-[40px] items-center gap-1 rounded-full px-5 py-1.5 text-white text-xs font-extrabold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
            style={{
              background: 'linear-gradient(90deg, #5cc6ff 0%, #ec59b6 50%, #ffd97a 100%)',
            }}
          >
            {step === 'ingredients' ? 'Combine →' : step === 'combine' ? 'Results →' : 'Done'}
          </button>
        </div>
      </footer>

      {shareToast && (
        <div className="pointer-events-none absolute top-20 right-0 left-0 z-20 flex justify-center px-4">
          <div className="pointer-events-auto max-w-[90vw] truncate rounded-full border border-[#a4ff8c]/50 bg-[#0d0a22]/95 px-4 py-2 text-[#dffaff] text-xs shadow-[0_0_18px_rgba(164,255,140,0.35)] backdrop-blur">
            {shareToast}
          </div>
        </div>
      )}
    </div>
  )
}

interface MoleculeUnit {
  atoms: AtomData[]
  bonds: BondData[]
}

/**
 * Split a flat atoms+bonds payload into per-moleculeId units so each unit
 * can animate independently. Used by the transition path: every reactant
 * "unit" (one library-spawned molecule, or one bare atom) drifts toward
 * origin under its own AnimatedMolecule.
 */
function groupByMolecule(atoms: AtomData[], bonds: BondData[]): MoleculeUnit[] {
  const byMol = new Map<string, MoleculeUnit>()
  for (const a of atoms) {
    const key = a.moleculeId as unknown as string
    if (!byMol.has(key)) byMol.set(key, { atoms: [], bonds: [] })
    byMol.get(key)?.atoms.push(a)
  }
  for (const b of bonds) {
    const owner = atoms.find((a) => a.id === b.atomA)
    if (!owner) continue
    const key = owner.moleculeId as unknown as string
    byMol.get(key)?.bonds.push(b)
  }
  return [...byMol.values()]
}
