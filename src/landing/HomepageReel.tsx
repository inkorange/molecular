'use client'

import { PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import { type Atom, atomId, type Bond, bondId, moleculeId } from '@/src/chem/types'
import { useReducedMotion } from '@/src/lib/useReducedMotion'
import { Molecule } from '@/src/scene/Molecule'
import { Scene } from '@/src/scene/Scene'
import { getReelMolecule, REEL } from './reelData'

type ReelPhase = 'entering' | 'stable' | 'exiting'

// Both halves of the cycle use the same duration so the cadence reads even.
const TRANSITION_MS = 550

interface SceneData {
  atoms: Atom[]
  bonds: Bond[]
  name: string
  formula: string
}

function buildSceneFor(libraryId: string): SceneData {
  const entry = getReelMolecule(libraryId)
  if (!entry) return { atoms: [], bonds: [], name: '', formula: '' }
  const mId = moleculeId()
  const atoms: Atom[] = entry.atoms.map((a) => ({
    id: atomId(),
    Z: a.Z,
    position: a.position,
    velocity: [0, 0, 0],
    charge: 0,
    moleculeId: mId,
  }))
  const bonds: Bond[] = entry.bonds.map((b) => {
    const atomA = atoms[b.atomAIndex]
    const atomB = atoms[b.atomBIndex]
    return {
      id: bondId(),
      atomA: atomA ? atomA.id : atoms[0]!.id,
      atomB: atomB ? atomB.id : atoms[0]!.id,
      order: b.order,
      type: b.type ?? 'covalent',
    }
  })
  return { atoms, bonds, name: entry.name, formula: entry.formula }
}

/**
 * easeOutCubic — fast start, soft landing. Good for entry tweens.
 * easeInCubic — soft start, fast finish. Good for exits.
 */
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}
function easeInCubic(t: number): number {
  return t ** 3
}

interface ReelStageProps {
  atoms: Atom[]
  bonds: Bond[]
  /** Animation phase. ReelStage drives the scale + rotation tween itself
   *  via useFrame — the parent just flips the phase. */
  phase: ReelPhase
  /** Timestamp (performance.now) at which the current phase began.
   *  Changing this resets the tween clock. */
  phaseStartedAt: number
}

/**
 * Inner R3F stage that reads the canvas size and positions the molecule
 * differently on mobile vs desktop, AND tweens scale + yaw based on the
 * reel phase so molecules pop in and spin away rather than swapping
 * abruptly.
 */
// Max mouse-tilt offsets applied to the reel molecule's rotation. Small
// values so the tilt reads as "the model leans toward your cursor" — not
// a full interactive orbit (that's what /app is for). On touch devices
// the listener bails so it never competes with page scrolling.
const TILT_YAW_MAX = Math.PI / 14 // ~13° horizontal
const TILT_PITCH_MAX = Math.PI / 28 // ~6° vertical
// Exponential decay rate for tilt easing — higher = snappier follow.
const TILT_LAMBDA = 5

function ReelStage({ atoms, bonds, phase, phaseStartedAt }: ReelStageProps) {
  const width = useThree((s) => s.size.width)
  const isMobile = width < 640
  const position: [number, number, number] = isMobile ? [0.35, 0.95, 0] : [1.2, 0.2, 0]
  const baseScale = isMobile ? 0.95 : 1.2
  // Stable resting yaw — 45° presents bond angles in 3/4 view.
  const baseYaw = Math.PI / 4

  const groupRef = useRef<Group>(null)
  // When the OS asks for reduced motion, hold the molecule at its base
  // scale + yaw with no per-phase tweening. The parent already pins
  // phase to 'stable' in that mode, but skipping the useFrame work
  // entirely also avoids any visual drift.
  const reducedMotion = useReducedMotion()
  // Target tilt driven by the mouse's position over the viewport, eased
  // smoothly each frame. Mouse-only — touch events are ignored so the
  // reel never interferes with mobile page scrolling. Stored in refs so
  // mousemove handlers don't trigger React re-renders.
  const targetTilt = useRef<[number, number]>([0, 0])
  const currentTilt = useRef<[number, number]>([0, 0])

  useEffect(() => {
    if (reducedMotion) return
    function onMove(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      targetTilt.current = [nx, ny]
    }
    function onLeave() {
      targetTilt.current = [0, 0]
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [reducedMotion])

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return
    if (reducedMotion) {
      g.scale.setScalar(baseScale)
      g.rotation.set(0, baseYaw, 0)
      return
    }
    // Ease the current tilt toward the target each frame. Exponential
    // decay makes the lean feel weighty rather than tracking 1:1.
    const k = 1 - Math.exp(-TILT_LAMBDA * delta)
    currentTilt.current = [
      currentTilt.current[0] + (targetTilt.current[0] - currentTilt.current[0]) * k,
      currentTilt.current[1] + (targetTilt.current[1] - currentTilt.current[1]) * k,
    ]
    const yawTilt = currentTilt.current[0] * TILT_YAW_MAX
    const pitchTilt = currentTilt.current[1] * TILT_PITCH_MAX

    const t = Math.min(1, (performance.now() - phaseStartedAt) / TRANSITION_MS)
    let factor = 1
    let yawOffset = 0
    if (phase === 'entering') {
      // Pop in: scale 0 → 1, spin in from -90° to 0° offset (lands at baseYaw).
      factor = easeOutCubic(t)
      yawOffset = (-Math.PI / 2) * (1 - factor)
    } else if (phase === 'exiting') {
      // Spin away: scale 1 → 0, continue spinning forward 90°.
      factor = 1 - easeInCubic(t)
      yawOffset = (Math.PI / 2) * (1 - factor)
    }
    g.scale.setScalar(baseScale * factor)
    g.rotation.set(pitchTilt, baseYaw + yawOffset + yawTilt, 0)
  })

  return (
    <group ref={groupRef} position={position} scale={baseScale} rotation={[0, baseYaw, 0]}>
      <Molecule atoms={atoms} bonds={bonds} />
    </group>
  )
}

/**
 * Autonomous reel for the landing page. Cycles through the REEL list with
 * a three-phase animation per step:
 *
 *   entering (TRANSITION_MS) → stable (step.durationMs) → exiting (TRANSITION_MS)
 *
 * At the end of the exit, swap to the next step's molecule and re-enter.
 * The actual scale + yaw tween lives in `ReelStage`'s useFrame; this
 * component just drives the state machine and timers.
 */
export function HomepageReel() {
  const [stepIndex, setStepIndex] = useState(0)
  const [phase, setPhase] = useState<ReelPhase>('entering')
  const [phaseStartedAt, setPhaseStartedAt] = useState(() => performance.now())
  const step = REEL[stepIndex] ?? REEL[0]!
  const scene = useMemo(() => buildSceneFor(step.libraryId), [step.libraryId])
  // OS-level "reduce motion" pins the reel: hold the FIRST molecule in
  // 'stable' phase indefinitely, no pop-in / spin-out / step advance.
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    if (reducedMotion) {
      setStepIndex(0)
      setPhase('stable')
    }
  }, [reducedMotion])

  // Phase scheduler. Each phase change registers its own timer to flip to
  // the next phase. stepIndex is intentionally in the deps so the effect
  // re-fires on every advance even when the phase happens to repeat.
  // biome-ignore lint/correctness/useExhaustiveDependencies: stepIndex re-runs the timer per step
  useEffect(() => {
    if (reducedMotion) return
    if (phase === 'entering') {
      const t = setTimeout(() => {
        setPhase('stable')
        setPhaseStartedAt(performance.now())
      }, TRANSITION_MS)
      return () => clearTimeout(t)
    }
    if (phase === 'stable') {
      // Stable hold runs durationMs MINUS the entry+exit we steal from it
      // so the apparent step cadence matches REEL[i].durationMs.
      const stableMs = Math.max(0, step.durationMs - 2 * TRANSITION_MS)
      const t = setTimeout(() => {
        setPhase('exiting')
        setPhaseStartedAt(performance.now())
      }, stableMs)
      return () => clearTimeout(t)
    }
    // exiting
    const t = setTimeout(() => {
      setStepIndex((i) => (i + 1) % REEL.length)
      setPhase('entering')
      setPhaseStartedAt(performance.now())
    }, TRANSITION_MS)
    return () => clearTimeout(t)
  }, [phase, stepIndex, step.durationMs, reducedMotion])

  return (
    <div className="absolute inset-0 z-0">
      {/* Decorative reel — interactive={false} so the user can't grab and
          orbit it; OrbitControls would also intercept page scroll. */}
      <Scene interactive={false}>
        <PerspectiveCamera makeDefault position={[0, 0, 3.5]} fov={45} />
        <ReelStage
          atoms={scene.atoms}
          bonds={scene.bonds}
          phase={phase}
          phaseStartedAt={phaseStartedAt}
        />
      </Scene>
      {/* Caption pill — fades alongside the molecule so it doesn't sit there
          labelling something that's spinning away. */}
      <Link
        href={`/app?molecule=${step.libraryId}`}
        aria-label={`Open ${scene.name} in the app`}
        style={{ opacity: phase === 'stable' ? 1 : 0 }}
        className="-translate-x-1/2 absolute top-[26vh] left-1/2 z-10 whitespace-nowrap rounded-md bg-[#0d0a22]/70 px-3 py-1 text-[#dffaff]/85 text-xs backdrop-blur transition-opacity duration-500 hover:text-[#dffaff] sm:top-auto sm:right-[8%] sm:bottom-[8%] sm:left-auto sm:translate-x-0"
      >
        {scene.name} · {scene.formula} ↗
      </Link>
    </div>
  )
}
