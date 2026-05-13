'use client'

import { Billboard, Text } from '@react-three/drei'
import { type ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  type Group,
  LineBasicMaterial,
  type Mesh,
  Line as ThreeLine,
  Vector3,
  type Vector3Tuple,
} from 'three'
import { getElement } from '@/src/chem/elements'
import { freeCapacity } from '@/src/chem/rules'
import type { AtomId, ElementCategory } from '@/src/chem/types'
import { usePointerToWorld } from '@/src/lib/usePointerToWorld'
import { useReducedMotion } from '@/src/lib/useReducedMotion'
import { useStore } from '@/src/store'
import { ElectronSprite } from './ElectronSprite'

// Pointer must move further than this many CSS pixels between down and up
// for the gesture to be treated as a drag instead of a click. Tuned for
// touch — a finger can wobble a few pixels on a tap.
const DRAG_THRESHOLD_PX = 6

const CATEGORY_ACCENT: Record<ElementCategory, string> = {
  alkali: '#FF7A8C',
  alkaline: '#FFB86B',
  transition: '#FFD07A',
  'other-metal': '#B0B5CC',
  metalloid: '#7AD9AA',
  nonmetal: '#5CC6FF',
  halogen: '#C8FF7A',
  noble: '#C89EFF',
}

// Periodic-table style card built out of 3D primitives — billboard-rotated to face
// camera but rendered at its real 3D position so depth-test naturally occludes
// cards that sit behind other atoms.
const CARD_W = 0.58
const CARD_H = 0.52
const CARD_ACCENT_W = 0.05

interface AtomProps {
  Z: number
  position: Vector3Tuple
  /** Set to make the atom selectable; passes the id to the store on click. */
  atomId?: string
  showLabel?: boolean
  scale?: number
  /** For drag preview: 0..1 opacity multiplier on the nucleus. */
  opacity?: number
}

interface ElectronPlan {
  id: string
  radius: number
  tilt: [number, number, number]
  phaseOffset: number
  // Signed rotation speed in rad/s. Sign controls direction (cw / ccw).
  speed: number
  isValence: boolean
}

const NUCLEUS_RADIUS = 0.2
const SHELL_RADIUS_BASE = 0.32
const SHELL_RADIUS_STEP = 0.09
const MAX_ELECTRONS_VISIBLE = 8
// The tail is drawn as a single continuous THREE.Line — TAIL_POINTS samples along the arc.
const TAIL_POINTS = 32
const TAIL_ARC = Math.PI / 3 // 60° behind the head

function buildTrailLine(plan: ElectronPlan): ThreeLine {
  const trailDir = plan.speed >= 0 ? 1 : -1
  const positions = new Float32Array(TAIL_POINTS * 3)
  const colors = new Float32Array(TAIL_POINTS * 3)
  for (let k = 0; k < TAIL_POINTS; k++) {
    const angle = trailDir * (k / (TAIL_POINTS - 1)) * TAIL_ARC
    positions[k * 3] = Math.cos(angle) * plan.radius
    positions[k * 3 + 1] = 0
    positions[k * 3 + 2] = Math.sin(angle) * plan.radius
    // Brightness fades from head (~0.7) to tail (~0). Stored as RGB; additive
    // blending below means "near-black" rows contribute nothing to the framebuffer
    // — so the tail effectively vanishes over both atoms and the space background.
    const fade = 1 - k / (TAIL_POINTS - 1)
    const intensity = 0.7 * fade ** 1.4
    colors[k * 3] = intensity
    colors[k * 3 + 1] = intensity * 0.92
    colors[k * 3 + 2] = intensity * 0.55
  }
  const geom = new BufferGeometry()
  geom.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geom.setAttribute('color', new Float32BufferAttribute(colors, 3))
  const mat = new LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  return new ThreeLine(geom, mat)
}

// Distance at which the constant-screen-size card has its base world scale.
// Scaling = currentDistance / CARD_REFERENCE_DISTANCE keeps it visually fixed.
// 6.67 = 5 / 0.75 → cards render 25% smaller than the 5.0 baseline.
const CARD_REFERENCE_DISTANCE = 6.67

export function Atom({ Z, position, atomId, showLabel = true, scale = 1, opacity = 1 }: AtomProps) {
  const el = getElement(Z)
  const groupRef = useRef<Group>(null)
  const electronRefs = useRef<Group[]>([])
  const cardRef = useRef<Group>(null)
  const cardTmp = useMemo(() => new Vector3(), [])
  const targetRingRef = useRef<Mesh>(null)
  // Honor the OS reduced-motion preference: skip electron orbit and
  // target-ring pulse. The card scaling stays on regardless — that's
  // about readability, not motion.
  const reducedMotion = useReducedMotion()

  // Selection / highlight wiring. Only selectable while in Build mode with
  // nothing currently held (so the click doesn't fight drag-drop) and the
  // atomId prop is set (DragGhost passes none).
  const heldZ = useStore((s) => s.build.heldZ)
  const mode = useStore((s) => s.scene.mode)
  const selection = useStore((s) => s.scene.selection)
  const connectingFromAtomId = useStore((s) => s.build.connectingFromAtomId)
  const setSelection = useStore((s) => s.setSelection)
  const cancelConnecting = useStore((s) => s.cancelConnecting)
  const connectAtoms = useStore((s) => s.connectAtoms)
  const moveAtom = useStore((s) => s.moveAtom)
  const inBuild = mode === 'build'
  const isConnectingSource = inBuild && atomId !== undefined && atomId === connectingFromAtomId
  // A connect target glows only if it has free valence — atoms already at
  // their bonding capacity (e.g. an H that's already bonded to something) are
  // not valid targets and shouldn't visually invite a tap.
  const atomsMap = useStore((s) => s.scene.atoms)
  const bondsMap = useStore((s) => s.scene.bonds)
  const hasFreeValence =
    atomId !== undefined && freeCapacity(atomId as AtomId, atomsMap, bondsMap) >= 1
  const isConnectTarget =
    inBuild &&
    atomId !== undefined &&
    connectingFromAtomId !== null &&
    !isConnectingSource &&
    hasFreeValence
  const isSelected =
    inBuild &&
    atomId !== undefined &&
    atomId === (selection as string | null) &&
    !isConnectingSource
  // While in connecting mode, every atom is a valid target click (no held-atom check).
  const selectable =
    atomId !== undefined && inBuild && (connectingFromAtomId !== null || heldZ === null)

  // Drag-to-reposition state. Refs (not state) so per-move updates don't
  // re-render the component on every frame — only the store update does,
  // and that's already throttled by React's batching.
  const screenToWorld = usePointerToWorld()
  // Grab the active OrbitControls instance so we can disable rotation while
  // dragging an atom — drei's makeDefault wiring registers it onto R3F state.
  const controls = useThree((s) => s.controls) as { enabled: boolean } | null
  const dragState = useRef<{
    pointerId: number
    startClientX: number
    startClientY: number
    /** Plane anchor: the atom's world position when the drag started. We
     *  project subsequent pointer moves through a camera-facing plane at
     *  this depth so the atom slides in screen-plane parallel to the view. */
    anchor: readonly [number, number, number]
    moved: boolean
  } | null>(null)

  function handlePointerDown(e: ThreeEvent<PointerEvent>) {
    if (!selectable || atomId === undefined) return
    e.stopPropagation()
    const target = e.target as Element | null
    if (target && 'setPointerCapture' in target) {
      try {
        target.setPointerCapture(e.pointerId)
      } catch {
        // Older browsers / non-DOM targets — ignore.
      }
    }
    dragState.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      anchor: position,
      moved: false,
    }
  }

  function handlePointerMove(e: ThreeEvent<PointerEvent>) {
    const drag = dragState.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.startClientX
    const dy = e.clientY - drag.startClientY
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
    // First time past threshold: latch into drag mode and quiet OrbitControls.
    if (!drag.moved) {
      drag.moved = true
      if (controls) controls.enabled = false
    }
    if (atomId === undefined) return
    const w = screenToWorld(e.clientX, e.clientY, drag.anchor)
    if (!w) return
    moveAtom(atomId as AtomId, w)
  }

  function handlePointerUp(e: ThreeEvent<PointerEvent>) {
    const drag = dragState.current
    if (!drag || drag.pointerId !== e.pointerId) {
      dragState.current = null
      return
    }
    e.stopPropagation()
    const target = e.target as Element | null
    if (target && 'releasePointerCapture' in target) {
      try {
        target.releasePointerCapture(e.pointerId)
      } catch {
        // Ignore.
      }
    }
    const wasClick = !drag.moved
    dragState.current = null
    if (!wasClick) {
      if (controls) controls.enabled = true
      return
    }
    // Click path — same logic the previous onClick handler had.
    if (atomId === undefined) return
    if (connectingFromAtomId !== null) {
      if (connectingFromAtomId === atomId) {
        // Tap source again → cancel.
        cancelConnecting()
        return
      }
      // Only valid targets (free valence) accept the bond. Tapping an
      // at-capacity atom is a deliberate no-op so the user stays in
      // connecting mode and can try another atom.
      if (!hasFreeValence) return
      connectAtoms(connectingFromAtomId as never, atomId as never)
      cancelConnecting()
      setSelection(null)
      return
    }
    setSelection(atomId as never)
  }

  // Viewport-relative card sizing. The DESIGN.md breakpoints:
  //   < 720px       → mobile (~0.56× desktop card size)
  //   720px–1100px  → tablet (~0.75× desktop card size)
  //   ≥ 1100px      → desktop (1× baseline)
  const viewWidth = useThree((s) => s.size.width)
  const cardViewportScale = viewWidth < 720 ? 0.5625 : viewWidth < 1100 ? 0.75 : 1

  const electronPlans: ElectronPlan[] = useMemo(() => {
    const plans: ElectronPlan[] = []
    let globalIdx = 0
    for (let shellIdx = 0; shellIdx < el.shells.length; shellIdx++) {
      const shellSize = el.shells[shellIdx] ?? 0
      const electronsInShell = Math.min(shellSize, MAX_ELECTRONS_VISIBLE)
      const radius = SHELL_RADIUS_BASE + shellIdx * SHELL_RADIUS_STEP
      const isValence = shellIdx === el.shells.length - 1
      for (let i = 0; i < electronsInShell; i++) {
        const tiltXDeg = ((globalIdx * 47 + 17) % 180) - 90
        const tiltZDeg = ((globalIdx * 73 + 31) % 180) - 90
        const phaseOffset = (((globalIdx * 137) % 360) * Math.PI) / 180
        const direction = globalIdx % 2 === 0 ? 1 : -1
        // Speeds range ~9..15 rad/s, signed — ~1.5..2.4 revolutions per second.
        const speed = (9 + ((globalIdx * 13) % 60) / 10) * direction
        plans.push({
          id: `e-${globalIdx}`,
          radius,
          tilt: [(tiltXDeg * Math.PI) / 180, 0, (tiltZDeg * Math.PI) / 180],
          phaseOffset,
          speed,
          isValence,
        })
        globalIdx++
      }
    }
    return plans
  }, [el.shells])

  // Build one THREE.Line per electron up front so we don't re-allocate on every render.
  const trailLines = useMemo(() => electronPlans.map((p) => buildTrailLine(p)), [electronPlans])

  // Dispose geometries and materials when this Atom unmounts.
  useEffect(() => {
    return () => {
      for (const line of trailLines) {
        line.geometry.dispose()
        if (Array.isArray(line.material)) {
          for (const m of line.material) m.dispose()
        } else {
          line.material.dispose()
        }
      }
    }
  }, [trailLines])

  useFrame(({ camera, clock }, delta) => {
    // Electron orbits — skipped when the user prefers reduced motion.
    if (!reducedMotion) {
      for (let i = 0; i < electronRefs.current.length; i++) {
        const ref = electronRefs.current[i]
        const plan = electronPlans[i]
        if (!ref || !plan) continue
        ref.rotation.y += delta * plan.speed
      }
    }
    // Constant-screen-size scaling on the label card: world scale proportional
    // to camera distance so its projected pixel size stays fixed regardless of zoom.
    // Multiply by cardViewportScale so cards shrink on tablet/mobile breakpoints.
    // Not animation — this is readability, so it runs in both modes.
    if (cardRef.current) {
      cardRef.current.getWorldPosition(cardTmp)
      const d = camera.position.distanceTo(cardTmp)
      cardRef.current.scale.setScalar((d / CARD_REFERENCE_DISTANCE) * cardViewportScale)
    }
    // Subtle breathing pulse on the connect-target ring so it reads as
    // "tap me" rather than a static decoration. Hold at scale 1 when
    // reduced motion is requested so it doesn't pulse.
    if (targetRingRef.current) {
      const pulse = reducedMotion ? 1 : 1 + 0.12 * Math.sin(clock.elapsedTime * 4)
      targetRingRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Selection ring — cyan when this atom is the current selection,
          pink while it's the source of a pending connect. */}
      {(isSelected || isConnectingSource) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[NUCLEUS_RADIUS * 1.45, NUCLEUS_RADIUS * 0.08, 16, 48]} />
          <meshBasicMaterial
            color={isConnectingSource ? '#ec59b6' : '#5cc6ff'}
            toneMapped={false}
          />
        </mesh>
      )}
      {/* Connect-target halo — pulsing attach-green ring on every atom that
          isn't the source while a connect is pending, signalling "tap me". */}
      {isConnectTarget && (
        <mesh ref={targetRingRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[NUCLEUS_RADIUS * 1.7, NUCLEUS_RADIUS * 0.1, 16, 48]} />
          <meshBasicMaterial color="#a4ff8c" transparent opacity={0.85} toneMapped={false} />
        </mesh>
      )}
      {/* Nucleus */}
      <mesh
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <sphereGeometry args={[NUCLEUS_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color={el.cpkColor}
          emissive={isConnectingSource ? '#ec59b6' : isSelected ? '#5cc6ff' : el.cpkColor}
          emissiveIntensity={isConnectingSource || isSelected ? 1.2 : 0.4}
          roughness={0.28}
          metalness={0.35}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Label */}
      {showLabel && (
        // Periodic-table card rendered as 3D meshes + drei <Text>. Billboard rotates
        // it to face camera, but its world position respects depth-testing so cards
        // behind atoms get correctly occluded.
        <Billboard ref={cardRef} position={[0, NUCLEUS_RADIUS + 0.22, 0]}>
          {/* Push the entire card forward in Billboard-local +z (which points
              at the camera). Without this the card sat on the plane through
              the atom's center and any bond passing behind the atom could
              intersect the card visually. 0.45u puts it comfortably in
              front of nearby bond tubes. */}
          <group position={[0, 0, 0.45]}>
            {/* Card background */}
            <mesh>
              <planeGeometry args={[CARD_W, CARD_H]} />
              <meshBasicMaterial color="#0d0a22" transparent opacity={0.88} toneMapped={false} />
            </mesh>
            {/* Category accent strip on the left edge */}
            <mesh position={[-CARD_W / 2 + CARD_ACCENT_W / 2, 0, 0.001]}>
              <planeGeometry args={[CARD_ACCENT_W, CARD_H]} />
              <meshBasicMaterial
                color={CATEGORY_ACCENT[el.category]}
                transparent
                opacity={0.75}
                toneMapped={false}
              />
            </mesh>
            {/* Atomic number (top-left) */}
            <Text
              position={[-CARD_W / 2 + 0.1, CARD_H / 2 - 0.06, 0.002]}
              fontSize={0.05}
              color="#8d92b8"
              anchorX="left"
              anchorY="middle"
              material-toneMapped={false}
            >
              {el.Z}
            </Text>
            {/* Symbol (large, center) */}
            <Text
              position={[0, 0.04, 0.002]}
              fontSize={0.17}
              color="#dffaff"
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
              material-toneMapped={false}
            >
              {el.symbol}
            </Text>
            {/* Name */}
            <Text
              position={[0, -0.13, 0.002]}
              fontSize={0.048}
              color="#9aa0c8"
              anchorX="center"
              anchorY="middle"
              material-toneMapped={false}
            >
              {el.name}
            </Text>
            {/* Mass */}
            <Text
              position={[0, -0.21, 0.002]}
              fontSize={0.042}
              color="#6a6f95"
              anchorX="center"
              anchorY="middle"
              material-toneMapped={false}
            >
              {el.mass.toFixed(2)}
            </Text>
          </group>
        </Billboard>
      )}

      {/* Per-electron orbits: each electron has its own tilted group with a
          pre-built THREE.Line trail (additive-blended, so the tail glows over
          dark and disappears over bright). The head is a single bright sprite. */}
      {electronPlans.map((plan, idx) => {
        const headScale = plan.isValence ? 0.06 : 0.045
        const colorHex = plan.isValence ? '#fff5b8' : '#ffd97a'
        const headPos: Vector3Tuple = [plan.radius, 0, 0]
        const trailLine = trailLines[idx]

        return (
          <group key={plan.id} rotation={plan.tilt}>
            <group
              ref={(g) => {
                if (g) {
                  electronRefs.current[idx] = g
                  g.rotation.y = plan.phaseOffset
                }
              }}
            >
              {trailLine && <primitive object={trailLine} />}
              <ElectronSprite
                position={headPos}
                scale={headScale}
                color={colorHex}
                opacity={0.85}
              />
            </group>
          </group>
        )
      })}
    </group>
  )
}
