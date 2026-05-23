'use client'

import { getLibraryEntryByFormula } from '@/src/data/molecules'
import type { ReactantSlot, RecipeHint } from '@/src/lib/recipeHints'

interface RecipeHintPanelProps {
  hints: RecipeHint[]
  /** Run the reaction. Panel passes the already-matched scene molecule ids,
   *  so the parent can call applyReaction directly without re-matching. */
  onCombine: (hint: RecipeHint) => void
  /** Add one instance of the given library entry to the scene as a pending
   *  reactant. Panel resolves the formula to a libId before calling. */
  onAddReactant: (libId: string) => void
  /** Remove a single scene molecule. Wired to the Undo affordance on a
   *  reactant row — the panel passes the LAST matched id for that slot
   *  so each Undo click steps the user back through their additions one
   *  at a time. */
  onUndoReactant: (moleculeId: string) => void
  /** Optional. When supplied, each hint card shows an × that calls this to
   *  hide the reaction from the panel until the lab is reset. */
  onDismiss?: (reactionId: string) => void
}

const ENTHALPY_LABEL: Record<RecipeHint['enthalpy'], string> = {
  exothermic: 'releases energy',
  endothermic: 'absorbs energy',
}

const ENTHALPY_COLOR: Record<RecipeHint['enthalpy'], string> = {
  exothermic: 'text-[#5cc6ff]',
  endothermic: 'text-[#ffd97a]',
}

/**
 * Renders the list of recipe hints inside the Lab Hints sheet. Each
 * hint is one card. Cards always show the full reactant breakdown
 * (one row per reactant slot) AND a Combine button at the bottom.
 * The Combine button is disabled until every reactant slot is
 * satisfied; clicking a row's "+ Add" adds one instance to the
 * scene; clicking a row's Undo (visible once the slot has at least
 * one matched molecule) removes the last addition.
 *
 * This replaces the previous "switch the whole footer between Needs
 * list and Combine button" pattern — students were losing track of
 * what they'd already added because added items disappeared from
 * the card entirely.
 */
export function RecipeHintPanel({
  hints,
  onCombine,
  onAddReactant,
  onUndoReactant,
  onDismiss,
}: RecipeHintPanelProps) {
  if (hints.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-xs text-[#6a6f95]">
        Add a reactant from the toolbar to see what reactions are possible.
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2 p-3">
      {hints.map((hint) => {
        const ready = hint.status === 'ready'
        return (
          <li
            key={hint.reactionId}
            className={
              ready
                ? 'rounded-md border border-[#a4ff8c]/60 bg-[#14112e] p-3'
                : 'rounded-md border border-[#2a2655] bg-[#0d0a22] p-3'
            }
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-sm text-[#dffaff]">{hint.equation}</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] uppercase tracking-wider ${ENTHALPY_COLOR[hint.enthalpy]}`}
                >
                  {ENTHALPY_LABEL[hint.enthalpy]}
                </span>
                {onDismiss && (
                  <button
                    type="button"
                    onClick={() => onDismiss(hint.reactionId)}
                    aria-label={`Dismiss ${hint.equation}`}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[#6a6f95] transition-colors hover:bg-[#1a163a] hover:text-[#dffaff]"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            {hint.notes && (
              <p className="mt-1 text-[11px] leading-snug text-[#9aa0c8]">{hint.notes}</p>
            )}

            {/* Reactant rows. Always show ALL reactants on the card so
                students can see what they've added at a glance. Each
                row toggles between "+ Add" and "✓ added with Undo"
                based on how many of that formula are in the scene. */}
            <div className="mt-2 flex flex-col gap-1">
              {hint.reactants.map((slot) => (
                <ReactantRow
                  key={slot.formula}
                  slot={slot}
                  onAdd={onAddReactant}
                  onUndo={onUndoReactant}
                />
              ))}
            </div>

            {/* Combine button — ALWAYS rendered. Disabled when status
                isn't ready. Keeps the call-to-action visible from the
                start so students learn "you'll click this when the
                ingredients are ready" without it appearing/disappearing. */}
            <button
              type="button"
              onClick={() => onCombine(hint)}
              disabled={!ready}
              className={
                ready
                  ? 'mt-2 min-h-[36px] w-full rounded-md bg-[#a4ff8c] px-3 py-1.5 font-bold text-[#0d2a0d] text-xs uppercase tracking-wider transition-colors hover:bg-[#c0ffae]'
                  : 'mt-2 min-h-[36px] w-full cursor-not-allowed rounded-md border border-[#2a2655] bg-[#14112e] px-3 py-1.5 font-bold text-[#6a6f95] text-xs uppercase tracking-wider'
              }
            >
              Combine
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Single reactant row on a hint card. Shows either:
 *  - "+ Add formula (0 of N)" full-width Add button when nothing is
 *    added yet
 *  - "+ Add formula (M of N)" Add button next to an Undo button when
 *    partially satisfied (count > 1, midway)
 *  - "✓ M formula added" badge next to an Undo button when fully
 *    satisfied
 *
 * If the formula isn't in the molecule library (monatomic elements
 * like Na, Cl that the library doesn't ship as standalone entries)
 * we render an informational placeholder instead.
 */
function ReactantRow({
  slot,
  onAdd,
  onUndo,
}: {
  slot: ReactantSlot
  onAdd: (libId: string) => void
  onUndo: (moleculeId: string) => void
}) {
  const lib = getLibraryEntryByFormula(slot.formula)
  const fullySatisfied = slot.satisfied >= slot.needed
  const hasSome = slot.satisfied > 0

  if (!lib) {
    return (
      <div className="rounded-md border border-[#2a2655] bg-[#14112e] px-3 py-1.5 text-[#6a6f95] text-[11px]">
        {slot.needed}× {slot.formula} (not in library)
      </div>
    )
  }

  // Counter label shown inside the Add button or as the "added" badge.
  // For a 1-of-1 slot the count is implied; show it explicitly only
  // when needed > 1 so single-reactant rows stay terse.
  const counter = slot.needed > 1 ? ` (${slot.satisfied} of ${slot.needed})` : ''

  return (
    <div className="flex items-stretch gap-1">
      {fullySatisfied ? (
        <div className="flex-1 rounded-md border border-[#a4ff8c]/50 bg-[#14210e] px-3 py-1.5 text-[#a4ff8c] text-[11px] font-bold">
          ✓ {slot.needed > 1 ? `${slot.needed} ` : ''}
          {slot.formula} added
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onAdd(lib.id)}
          className="flex-1 min-h-[32px] rounded-md border border-[#2a2655] bg-[#14112e] px-3 py-1.5 text-left text-[#dffaff] text-[11px] transition-colors hover:border-[#5cc6ff]/40 hover:bg-[#1a163a]"
        >
          + Add {slot.formula}
          {counter && <span className="text-[#9aa0c8]">{counter}</span>}
        </button>
      )}
      {hasSome && (
        <button
          type="button"
          onClick={() => {
            const lastId = slot.matchedIds[slot.matchedIds.length - 1]
            if (lastId) onUndo(lastId)
          }}
          aria-label={`Undo adding ${slot.formula}`}
          className="min-h-[32px] rounded-md border border-[#2a2655] bg-[#14112e] px-2.5 text-[#9aa0c8] text-[11px] transition-colors hover:border-[#ff7a8c]/40 hover:bg-[#1a163a] hover:text-[#ff7a8c]"
        >
          Undo
        </button>
      )}
    </div>
  )
}
