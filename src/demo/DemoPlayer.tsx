'use client'

import { PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PerspectiveCamera as PerspectiveCameraImpl } from 'three'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { Atom as AtomData, Bond as BondData } from '@/src/chem/types'
import type { Demonstration } from '@/src/data/demonstrations'
import { Molecule } from '@/src/scene/Molecule'
import { Scene } from '@/src/scene/Scene'
import { TutorPanel } from '@/src/ui/TutorPanel'
import { AnimatedMolecule } from './AnimatedMolecule'
import { buildIngredientScene, buildProductLayout, getReactionMetadata } from './buildDemoScene'
import { EnergyDisplay } from './EnergyDisplay'
import { FreeParticleField } from './FreeParticleField'
import { LightningEffect } from './LightningEffect'
import { MoleculeLabel } from './MoleculeLabel'
import { NuclearEffect } from './NuclearEffect'
import { ReactionEffect } from './ReactionEffect'
import { TransitionFlash } from './TransitionFlash'

type Level = 'elementary' | 'advanced'
type Step = 'ingredients' | 'combine' | 'results'

const STEP_ORDER: Step[] = ['ingredients', 'combine', 'results']

const STEP_LABEL: Record<Step, string> = {
  ingredients: 'Ingredients',
  combine: 'Combine',
  results: 'Results',
}

// Per-reaction-kind verb for the middle step. The default "Combine"
// only fits synthesis demos — for decomposition, fission, decay, etc.
// it's misleading. Drives both the action button ("Combine" → press
// to combine) and the step-progress label ("Step 2 · Combine"). Keep
// each entry an imperative verb so it reads cleanly in both contexts.
const ACTION_VERB: Record<Demonstration['effectKind'], string> = {
  synthesis: 'Combine',
  combustion: 'Ignite',
  decomposition: 'Decompose',
  neutralization: 'Neutralize',
  displacement: 'Displace',
  fusion: 'Fuse',
  fission: 'Split',
  decay: 'Decay',
}

// Stable suggestion chips per step. Generic enough to apply across
// every demo, but step-specific so the tutor is asked relevant
// questions for what the student is currently looking at.
const TUTOR_SUGGESTIONS: Record<Step, readonly string[]> = {
  ingredients: [
    'What are these atoms doing here?',
    'Why does this reaction need exactly these ingredients?',
    'What is about to happen?',
  ],
  combine: [
    'Where does the energy come from?',
    'Why does this reaction work?',
    'What is happening at the atomic level?',
  ],
  results: [
    'What is this reaction used for?',
    'Why is the energy released so large?',
    'Where does this reaction occur in nature?',
  ],
}

/**
 * Build the tutor's context string for the current demo + step. Includes
 * the demo title, reaction-type, products / free particles / energy, and
 * the current step's audience-level explanation — so the tutor answers
 * are grounded in exactly what the student is looking at.
 */
function buildDemoContext(demo: Demonstration, step: Step, level: Level): string {
  const ingredients = demo.ingredients
    .map((i) =>
      i.kind === 'library' ? `${i.count} ${i.libraryId}` : `${i.count} atom(s) Z=${i.Z}`,
    )
    .join(', ')
  const products = demo.products
    ? demo.products
        .map((p) =>
          p.kind === 'library' ? `${p.count} ${p.libraryId}` : `${p.count} atom(s) Z=${p.Z}`,
        )
        .join(', ')
    : 'derived from engine'
  const freeParticles =
    demo.freeParticles?.map((p) => `${p.count} ${p.kind}${p.count === 1 ? '' : 's'}`).join(', ') ??
    'none'
  const energy =
    demo.energyScale && demo.energyScale > 0
      ? `${demo.energyLabel ?? `level ${demo.energyScale}/5`} (relative scale ${demo.energyScale}/5)`
      : 'endothermic or near-neutral'
  return [
    `Demonstration: "${demo.title}" (${demo.reactionType})`,
    `Summary: ${demo.summary}`,
    `Ingredients: ${ingredients}`,
    `Products: ${products}`,
    `Free particles emitted: ${freeParticles}`,
    `Energy released: ${energy}`,
    `Current step: ${step}`,
    `Student-facing description of this step: ${demo.steps[step][level]}`,
  ].join('\n')
}

/**
 * Map the demo player's audience level ("elementary" | "advanced") to
 * the tutor API's tier vocabulary ("beginner" | "standard" | "advanced").
 * Elementary collapses to beginner; advanced stays advanced.
 */
function levelToTier(level: Level): 'beginner' | 'standard' | 'advanced' {
  return level === 'elementary' ? 'beginner' : 'advanced'
}

// Length of the ingredients→combine transition. Long enough for the
// merge motion and effect burst to read clearly without dragging.
const TRANSITION_MS = 1400
// OrbitControls autoRotateSpeed (drei units — speed=2.0 → ~30s per
// revolution at 60fps). 0.6 gives ~100s per revolution, slow enough to
// read as a calm museum turntable rather than a spin.
const RESULTS_AUTO_ROTATE_SPEED = 0.6
// Constant tilt applied to the result group. ~20° forward on X tips the
// top of the cluster TOWARD the camera — gives a 3/4 inspection angle
// instead of a flat orthogonal view.
const RESULTS_TILT_RAD = Math.PI / 9
// Padding multiplier when fitting the bounding sphere into the viewport.
// The bounding sphere is the worst-case across orbit angles, so 0.92
// actively undershoots it — outer atoms occasionally graze the edge at
// the widest rotation, which reads as "well-framed" rather than empty.
const FIT_PADDING = 0.92
// Effective "radius" added to each atom position when building the
// bounding sphere. Atom shells render at ~0.5 units; 0.5 is enough to
// keep them on-screen without padding bond stubs that are usually well
// inside the sphere already.
const ATOM_FIT_RADIUS = 0.5
// Exponential decay rate for the camera-distance tween. Higher = faster
// snap toward target. 3.5 closes ~97% of the gap in 1 second — fast
// enough to feel responsive, slow enough to read as a smooth dolly.
const ZOOM_LAMBDA = 3.5
// Stable reference for the camera's initial position. Inline array
// literals create a new array each render, which makes R3F think the
// prop changed and re-apply camera.position every render — fighting the
// auto-fit tween. The constant keeps reference equality stable.
const INITIAL_CAMERA_POSITION: [number, number, number] = [0, 0, 8]

const REACTION_TYPE_COLOR: Record<string, string> = {
  synthesis: '#5cc6ff',
  combustion: '#ff7a8c',
  decomposition: '#c89eff',
  neutralization: '#a4ff8c',
  displacement: '#ffd97a',
  // Nuclear types share the same hue family as the corresponding flash
  // colors in TransitionFlash so the top-bar badge and the combine
  // flash read as the same event.
  fusion: '#5cc6ff',
  fission: '#ff5a3a',
  decay: '#a4ff8c',
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
  const [tutorOpen, setTutorOpen] = useState(false)

  const reaction = useMemo(() => getReactionMetadata(demo.reactionId), [demo.reactionId])
  const ingredientScene = useMemo(() => buildIngredientScene(demo.ingredients), [demo.ingredients])
  // Per-unit layout used by BOTH the transition's entering animation and
  // the static results step. Each unit carries its final targetPosition +
  // scale so the animation lands at the same coordinates the static
  // render uses — no jump at transition end.
  const productLayout = useMemo(() => buildProductLayout(demo), [demo])

  // Group atoms by moleculeId so each ingredient unit can animate
  // independently (e.g. each H₂ molecule shrinks toward origin on its own).
  const ingredientUnits = useMemo(
    () => groupByMolecule(ingredientScene.atoms, ingredientScene.bonds),
    [ingredientScene],
  )

  // Worldspace points for the camera auto-fit. Ingredients scene atoms
  // are already in worldspace; product layout atoms are LOCAL to each
  // unit's targetPosition+scale, so flatten them here.
  const ingredientPoints = useMemo(
    () => ingredientScene.atoms.map((a) => a.position),
    [ingredientScene],
  )
  const productPoints = useMemo(() => {
    const pts: Array<[number, number, number]> = []
    for (const unit of productLayout) {
      const [tx, ty, tz] = unit.targetPosition
      const s = unit.scale
      for (const a of unit.atoms) {
        pts.push([tx + a.position[0] * s, ty + a.position[1] * s, tz + a.position[2] * s])
      }
    }
    // Include the energy cloud and free-particle ring in the bounding
    // set so the auto-fit camera frames the WHOLE Results scene, not
    // just the product atoms. Without these, the cloud above and the
    // neutron sprites on the upper ring would sit off-screen at the
    // top of the viewport.
    //
    // Coordinates here have to mirror what EnergyDisplay and
    // FreeParticleField actually render. Worth refactoring those into
    // shared layout constants if the geometry drifts again.
    if (demo.energyScale && demo.energyScale > 0) {
      // EnergyDisplay sits at [0, 1.5, -2.5] (pulled back in z so the
      // cloud doesn't overlap wide product layouts like propane
      // combustion). Level-scaled radius is BASE_SIZE=1.0 +
      // scale*SIZE_PER_LEVEL=0.36. Include the cloud's outermost
      // extent including the z offset so the auto-fit knows the cloud
      // sits behind origin.
      const cloudY = 1.5
      const cloudZ = -2.5
      const cloudReach = (1.0 + demo.energyScale * 0.36) / 2
      pts.push([0, cloudY + cloudReach, cloudZ])
      pts.push([cloudReach, cloudY, cloudZ])
      pts.push([-cloudReach, cloudY, cloudZ])
      pts.push([0, cloudY, cloudZ - cloudReach])
    }
    if (demo.freeParticles && demo.freeParticles.length > 0) {
      // FreeParticleField positions particles on a tilted ring centered
      // at y=0.4 with ringRadius=3.6 and VERTICAL_FLATTEN=0.45, so the
      // topmost slot reaches y = 0.4 + 3.6*0.45 ≈ 2.0 and the bottom
      // reaches y ≈ -1.2. Include the top/bottom/left/right of that
      // ring so the camera frames it all.
      const ringCenterY = 0.4
      const ringRadius = 3.6
      const ringVerticalReach = ringRadius * 0.45
      pts.push([0, ringCenterY + ringVerticalReach, 0.3])
      pts.push([0, ringCenterY - ringVerticalReach, 0.3])
      pts.push([-ringRadius, ringCenterY, 0.3])
      pts.push([ringRadius, ringCenterY, 0.3])
    }
    return pts
  }, [productLayout, demo.energyScale, demo.freeParticles])

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
            - combine/results: render product units idle.
          .scene-shift-portrait: on mobile portrait, translate the canvas
          up ~8dvh so the bottom step bubble + step nav don't crop the
          molecule cluster. No-op on landscape and ≥768px. */}
      <div className="scene-shift-portrait absolute inset-0">
        {/* interactive=true gives the user OrbitControls (rotate + zoom) so
            they can inspect the molecule from any angle during ingredients
            or results — useful for teachers pointing at specific atoms or
            bond geometry. Pan is disabled in Scene by default; the camera
            stays trained on the origin. */}
        <Scene>
          {/* Pulled back to z=8 (was 7) so 4-unit ingredient rows like
              ammonia synthesis (3 H₂ + N₂) fit without cropping at the
              new 2.6-unit ingredient spacing. */}
          <PerspectiveCamera makeDefault position={INITIAL_CAMERA_POSITION} fov={45} />
          {/* Auto-fit camera distance to the visible scene contents. Switches
              between the ingredient and product point sets based on step so
              both layouts are framed correctly. Skipped during the transition
              — the merge animation looks best with a stable camera. */}
          <CameraAutoFit
            points={step === 'ingredients' ? ingredientPoints : productPoints}
            active={!isTransitioning}
          />
          {step === 'ingredients' && !isTransitioning && (
            <>
              <Molecule atoms={ingredientScene.atoms} bonds={ingredientScene.bonds} />
              {/* Library-unit labels — one card per ingredient, anchored
                  above the unit's spawn slot. Bare-atom ingredients are
                  already labelled by `<Atom>`'s element card. */}
              {ingredientScene.labels.map((label) => (
                <MoleculeLabel
                  key={label.moleculeId}
                  libraryId={label.libraryId}
                  position={label.position}
                />
              ))}
            </>
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
              {productLayout.map((unit, i) => (
                <AnimatedMolecule
                  // biome-ignore lint/suspicious/noArrayIndexKey: layout order is stable per demo
                  key={`enter-${i}`}
                  atoms={unit.atoms}
                  bonds={unit.bonds}
                  phase="entering"
                  phaseStartedAt={transitionStartedAt}
                  durationMs={TRANSITION_MS}
                  targetPosition={unit.targetPosition}
                  targetScale={unit.scale}
                />
              ))}
              {/* Chemistry effect vs nuclear effect — same role (driving
                  particle vocabulary for the combine transition) but the
                  motion language is different enough that nuclear demos
                  get their own component. NuclearEffect implements the
                  fusion-converge and fission-shatter recipes with neutron
                  ejection; ReactionEffect handles the five chemistry kinds. */}
              {demo.effectKind === 'fusion' ||
              demo.effectKind === 'fission' ||
              demo.effectKind === 'decay' ? (
                <NuclearEffect
                  kind={demo.effectKind}
                  phaseStartedAt={transitionStartedAt}
                  durationMs={TRANSITION_MS}
                />
              ) : (
                <ReactionEffect
                  kind={demo.effectKind}
                  phaseStartedAt={transitionStartedAt}
                  durationMs={TRANSITION_MS}
                />
              )}
              {/* Environmental driver overlay — lightning bolts for
                  electricity-driven reactions (e.g. water electrolysis).
                  Stacks on top of the regular reaction-type effect so
                  the particles still play their role. */}
              {demo.energySource === 'electricity' && (
                <LightningEffect phaseStartedAt={transitionStartedAt} durationMs={TRANSITION_MS} />
              )}
              {/* Cover-up flash. Renders last so its additive core and
                  screen-tint shell sit on top of every other transition
                  layer, masking the geometry swap at the visual midpoint. */}
              <TransitionFlash
                kind={demo.effectKind}
                phaseStartedAt={transitionStartedAt}
                durationMs={TRANSITION_MS}
              />
            </>
          )}
          {(step === 'combine' || step === 'results') && !isTransitioning && (
            <>
              {/* Turns on OrbitControls.autoRotate so the camera slowly
                  circles the target [0,0,0] — kicks in as soon as the
                  combine transition finishes and stays on through the
                  results step so the rotation is continuous across both. */}
              <CameraAutoRotate enabled />
              <group rotation={[RESULTS_TILT_RAD, 0, 0]}>
                {productLayout.map((unit, i) => (
                  <group
                    // biome-ignore lint/suspicious/noArrayIndexKey: layout order is stable per demo
                    key={`prod-${i}`}
                    position={unit.targetPosition}
                    scale={unit.scale}
                  >
                    <Molecule atoms={unit.atoms} bonds={unit.bonds} />
                    {/* MoleculeLabel rides with the unit's group so it
                        inherits the tilt + auto-rotate transforms. Only
                        emitted for library-derived primaries; remainder
                        bare atoms get their element card from `<Atom>`. */}
                    {unit.libraryId && <MoleculeLabel libraryId={unit.libraryId} />}
                  </group>
                ))}
                {/* Free particles released by the reaction (neutrons,
                    photons) — rendered alongside the products so the
                    conservation of matter/energy is visible. Skipped
                    when the demo declared none. */}
                {demo.freeParticles && demo.freeParticles.length > 0 && (
                  <FreeParticleField particles={demo.freeParticles} />
                )}
                {/* Energy-release gauge. Vertical thermometer-style bar
                    on the right of the scene + a swarm of ambient
                    quanta. Hidden for endothermic / neutral reactions
                    (energyScale=0 or undefined). */}
                {demo.energyScale !== undefined && demo.energyScale > 0 && (
                  <EnergyDisplay
                    scale={demo.energyScale}
                    direction={demo.energyDirection}
                    label={demo.energyLabel}
                  />
                )}
              </group>
            </>
          )}
        </Scene>
      </div>

      {/* Top toolbar — title + reaction-type badge + back/share. */}
      <header className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/demo"
            aria-label="Back to demonstrations"
            className="button-glow inline-flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-extrabold transition-transform hover:scale-105 active:scale-95"
            style={{
              // Same cool cyan→navy gradient as the footer Back button so
              // the two "go back" affordances share a visual language.
              background: 'linear-gradient(135deg, #5cc6ff 0%, #3a2e7a 100%)',
            }}
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
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
        <div className="flex items-center gap-2">
          {/* AI tutor — opens a bottom sheet pinned to the current
              demo + step. Same Sparkles vocabulary as the sandbox so
              the affordance reads as "AI helper" across both surfaces. */}
          <Sheet open={tutorOpen} onOpenChange={setTutorOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  aria-label="Ask the chemistry tutor about this demo"
                  className="button-glow inline-flex h-10 w-10 items-center justify-center rounded-full text-white shadow-[0_4px_20px_rgba(236,89,182,0.45)] transition-transform hover:scale-110 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #ffd97a 0%, #ec59b6 100%)' }}
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              }
            />
            <SheetContent
              side="bottom"
              style={{ height: '60vh', maxHeight: '60vh' }}
              className="flex flex-col gap-0 overflow-hidden border-[#5cc6ff]/40 bg-[#0d0a22] p-0 text-[#dffaff]"
            >
              <SheetTitle className="shrink-0 border-[#2a2655] border-b px-4 py-3 font-extrabold text-[#dffaff] text-xs uppercase tracking-[0.25em]">
                Tutor · {demo.title}
              </SheetTitle>
              <div className="min-h-0 flex-1">
                <TutorPanel
                  mode="demo"
                  tier={levelToTier(level)}
                  contextSummary={buildDemoContext(demo, step, level)}
                  suggestions={TUTOR_SUGGESTIONS[step]}
                />
              </div>
            </SheetContent>
          </Sheet>
          <button
            type="button"
            onClick={share}
            className="button-glow inline-flex min-h-[40px] items-center gap-1 rounded-full px-4 py-1.5 font-extrabold text-white text-xs uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #a4ff8c 0%, #5cc6ff 100%)' }}
          >
            Share
          </button>
        </div>
      </header>

      {/* Bottom: step bubble + Prev/Next nav. */}
      <footer className="absolute right-0 bottom-0 left-0 z-10 flex flex-col gap-3 px-4 pb-5 sm:px-8 sm:pb-8">
        {/* Step bubble — outer wrapper carries .panel-glow. The three
            glow layers are explicit child spans (NOT pseudo-elements):
            the inner content uses backdrop-filter which makes the
            z-index: -1 trick used by .modal-glow stop working, so we
            rely on DOM order instead — the spans come BEFORE the
            content, so natural painting order keeps them behind. */}
        <div className="panel-glow mx-auto w-full max-w-2xl rounded-2xl">
          <span className="panel-glow-layer-1" aria-hidden="true" />
          <span className="panel-glow-layer-2" aria-hidden="true" />
          <div className="relative rounded-2xl border border-[#5cc6ff]/30 bg-[#0d0a22]/90 px-5 py-4 text-[#dffaff] backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <span
                className="text-[10px] font-extrabold uppercase tracking-[0.25em]"
                style={{ color: typeColor }}
              >
                Step {stepIndex + 1} ·{' '}
                {step === 'combine' ? ACTION_VERB[demo.effectKind] : STEP_LABEL[step]}
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
        </div>

        {/* Step nav */}
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canPrev}
            className="button-glow inline-flex min-h-[40px] items-center gap-1 rounded-full px-5 py-1.5 text-white text-xs font-extrabold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
            style={{
              // Cool cyan→navy gradient that visually recedes vs the bright
              // forward CTA's cyan→magenta→gold. Reads as "secondary action"
              // without dropping out of the design language.
              background: 'linear-gradient(90deg, #5cc6ff 0%, #3a2e7a 100%)',
            }}
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
            Back
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
            {step === 'ingredients' ? (
              <>
                {ACTION_VERB[demo.effectKind]} <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </>
            ) : step === 'combine' ? (
              <>
                Results <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </>
            ) : (
              'Done'
            )}
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

/**
 * Compute a bounding-sphere radius around origin for `points` and move
 * the active camera along its current viewing direction so the sphere
 * fits inside the viewport, given the camera's FOV and the current
 * aspect ratio. Re-runs whenever the points list, viewport, or `active`
 * flag changes — so resizing the window or switching steps re-frames
 * the scene automatically.
 *
 * Why bounding-sphere (not bounding-box): the camera orbits via
 * OrbitControls.autoRotate. Distance from origin is the only invariant
 * during orbit, so fitting the sphere guarantees the scene stays in
 * frame from every orbit angle.
 */
function CameraAutoFit({
  points,
  active,
}: {
  points: ReadonlyArray<readonly [number, number, number]>
  active: boolean
}) {
  const camera = useThree((s) => s.camera) as PerspectiveCameraImpl
  const size = useThree((s) => s.size)
  const controls = useThree(
    (s) =>
      s.controls as { addEventListener?: typeof EventTarget.prototype.addEventListener } | null,
  )
  // Target distance from origin the camera should converge to. `null`
  // means "don't touch the camera this frame" (e.g. during the merge
  // transition, where we want the camera stable).
  const targetDistance = useRef<number | null>(null)
  // Tracks whether the very first fit has happened yet. The first fit
  // SNAPS so the user sees a correctly-framed step 1 from frame zero;
  // every subsequent fit (step change, resize) tweens via useFrame so
  // the camera glides instead of popping.
  const hasFitOnce = useRef(false)
  // Once the user pinches / scroll-zooms / drags the camera, freeze the
  // auto-fit so subsequent step changes don't yank their zoom back to
  // the fitted distance. They asked for it, leave it.
  const userInteracted = useRef(false)

  useEffect(() => {
    if (!controls?.addEventListener) return
    const onStart = () => {
      userInteracted.current = true
    }
    controls.addEventListener('start', onStart as EventListener)
    return () => {
      const ctl = controls as {
        removeEventListener?: typeof EventTarget.prototype.removeEventListener
      }
      ctl.removeEventListener?.('start', onStart as EventListener)
    }
  }, [controls])

  // Recompute the target whenever inputs change. The actual camera move
  // happens in the useFrame below — this effect only updates the target.
  useEffect(() => {
    if (!active || points.length === 0 || userInteracted.current) {
      targetDistance.current = null
      return
    }
    // Bounding-sphere radius from origin (sphere centered at origin).
    let maxR2 = 0
    for (const p of points) {
      const r2 = p[0] * p[0] + p[1] * p[1] + p[2] * p[2]
      if (r2 > maxR2) maxR2 = r2
    }
    const radius = Math.sqrt(maxR2) + ATOM_FIT_RADIUS

    // Distance to fit a sphere of `radius` given a vertical FOV `fov`
    // and aspect = width/height. If aspect < 1 (portrait), the
    // horizontal axis is the tighter constraint, so back off further.
    const aspect = size.width / Math.max(1, size.height)
    const vFov = (camera.fov * Math.PI) / 180
    const halfTanV = Math.tan(vFov / 2)
    const limitingTan = halfTanV * Math.min(1, aspect)
    // FIT_PADDING < 1 deliberately overshoots the bounding sphere on
    // wide viewports — outer atoms "graze the edge" with orbit
    // rotation, which reads as well-framed. But on narrow portrait
    // viewports the graze becomes a hard clip (the edge atoms in a
    // 3-4 atom row land off-screen). Force >= 1.0 padding when the
    // viewport is portrait so everything actually fits, with a small
    // margin (1.05) so the corner atoms aren't pixel-flush.
    const padding = aspect < 1 ? Math.max(FIT_PADDING, 1.05) : FIT_PADDING
    const target = (radius / limitingTan) * padding
    targetDistance.current = target

    // First fit: snap immediately so step 1 is framed correctly the
    // moment it's drawn (no slow ramp up from the default z=8).
    if (!hasFitOnce.current) {
      hasFitOnce.current = true
      const current = camera.position.length()
      if (current > 1e-6) {
        camera.position.multiplyScalar(target / current)
        camera.updateProjectionMatrix()
      }
    }
  }, [active, points, size.width, size.height, camera.fov, camera])

  // Frame-by-frame exponential decay toward the target distance. Scales
  // the camera's existing position vector so it stays on its current
  // orbit ray — OrbitControls' autoRotate keeps advancing the orbit
  // direction underneath, and we just slide along it. Bails when the
  // user has interacted so manual zoom isn't fought every frame.
  useFrame((_, delta) => {
    if (userInteracted.current) return
    const target = targetDistance.current
    if (target === null) return
    const current = camera.position.length()
    if (current < 1e-6) return
    const k = 1 - Math.exp(-ZOOM_LAMBDA * delta)
    const next = current + (target - current) * k
    // Skip the multiply/copy when we're effectively at target — avoids
    // touching the camera on every idle frame.
    if (Math.abs(next - current) < 1e-4) return
    camera.position.multiplyScalar(next / current)
  })

  return null
}

/**
 * Toggles OrbitControls' autoRotate on the makeDefault'd controls
 * instance. Mounted as a render-only side-effect node inside the Canvas
 * so it can grab the controls via `useThree`. Cleans up on unmount so
 * the auto-rotation only happens while the Results step is active —
 * other steps see a static framing.
 */
function CameraAutoRotate({ enabled }: { enabled: boolean }) {
  const controls = useThree(
    (s) => s.controls as { autoRotate?: boolean; autoRotateSpeed?: number } | null,
  )
  useEffect(() => {
    if (!controls) return
    controls.autoRotate = enabled
    if (controls.autoRotateSpeed !== undefined) {
      controls.autoRotateSpeed = RESULTS_AUTO_ROTATE_SPEED
    }
    return () => {
      controls.autoRotate = false
    }
  }, [controls, enabled])
  return null
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
