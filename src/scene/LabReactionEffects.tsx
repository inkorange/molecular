'use client'

import { EnergyDisplay } from '@/src/demo/EnergyDisplay'
import { ReactionEffect } from '@/src/demo/ReactionEffect'
import { TransitionFlash } from '@/src/demo/TransitionFlash'
import { useStore } from '@/src/store'

/**
 * In-scene reaction-animation overlay for lab mode. Subscribes to
 * `lab.activeAnimation` and renders the same effect vocabulary the
 * /demo player uses (particle burst + cover-up flash + energy blob)
 * whenever the lab kicks off a reaction.
 *
 * Mounted inside `AppScene` so it lives in the R3F tree alongside the
 * lab's molecules. Renders nothing when no animation is active —
 * effects vanish cleanly the moment `clearReactionAnimation` fires.
 *
 * Why reuse the demo effects: students already build a mental model
 * for "this colour + motion = this reaction type" from the /demo
 * surface; carrying that language into lab makes the interaction
 * feel like one continuous experience instead of two disconnected
 * tools.
 */
export function LabReactionEffects() {
  const anim = useStore((s) => s.lab.activeAnimation)
  if (!anim) return null

  // Reuse the energy-direction logic from the demo system: exothermic
  // reactions release energy outward (warm cloud + outward flame
  // particles); endothermic absorb (cool cloud + inward suction).
  const direction = anim.enthalpy === 'exothermic' ? 'released' : 'absorbed'
  return (
    <group>
      <ReactionEffect
        kind={anim.kind}
        phaseStartedAt={anim.startedAt}
        durationMs={anim.durationMs}
      />
      <TransitionFlash
        kind={anim.kind}
        phaseStartedAt={anim.startedAt}
        durationMs={anim.durationMs}
      />
      {/* Energy blob — scale 3 by default since the engine reactions
          table doesn't carry per-reaction kJ/mol magnitudes. The
          curated demos that DO have specific values use the same
          component with a richer scale; lab keeps it modest so the
          blob doesn't dwarf the actual molecule cluster. */}
      <EnergyDisplay scale={3} direction={direction} />
    </group>
  )
}
