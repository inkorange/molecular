'use client'

import { getLibraryEntryByFormula } from '@/src/data/molecules'
import type { RecipeHint } from '@/src/lib/recipeHints'

interface RecipeHintPanelProps {
  hints: RecipeHint[]
  /** Run the reaction. Panel passes the already-matched scene molecule ids,
   *  so the parent can call applyReaction directly without re-matching. */
  onCombine: (hint: RecipeHint) => void
  /** Add one instance of the given library entry to the scene as a pending
   *  reactant. Panel resolves the formula to a libId before calling. */
  onAddReactant: (libId: string) => void
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
 * Renders the list of recipe hints inside the Lab Hints sheet. Each hint
 * is one card; the affordances differ by status.
 *
 * Ready hints get a green-bordered card and a primary "Combine" button.
 * Missing hints are dimmer and show one "Add X" button per missing
 * reactant. Reactants without a library entry (e.g. monatomic Na, Cl)
 * are surfaced as informational text instead of an Add button — the
 * library doesn't expose those as individually-spawnable molecules.
 */
export function RecipeHintPanel({
  hints,
  onCombine,
  onAddReactant,
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
                : 'rounded-md border border-[#2a2655] bg-[#0d0a22] p-3 opacity-90'
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
            {ready ? (
              <button
                type="button"
                onClick={() => onCombine(hint)}
                className="mt-2 min-h-[36px] w-full rounded-md bg-[#a4ff8c] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0d2a0d] transition-colors hover:bg-[#c0ffae]"
              >
                Combine
              </button>
            ) : (
              <div className="mt-2 flex flex-col gap-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9aa0c8]">
                  Needs
                </div>
                {hint.missing.map((m) => {
                  const lib = getLibraryEntryByFormula(m.formula)
                  if (!lib) {
                    return (
                      <div
                        key={m.formula}
                        className="rounded-md border border-[#2a2655] bg-[#14112e] px-3 py-1.5 text-[11px] text-[#6a6f95]"
                      >
                        {m.count}× {m.formula} (not in library)
                      </div>
                    )
                  }
                  return (
                    <button
                      type="button"
                      key={m.formula}
                      onClick={() => onAddReactant(lib.id)}
                      className="min-h-[32px] rounded-md border border-[#2a2655] bg-[#14112e] px-3 py-1.5 text-left text-[11px] text-[#dffaff] transition-colors hover:border-[#5cc6ff]/40 hover:bg-[#1a163a]"
                    >
                      + Add {m.formula}
                      {m.count > 1 && <span className="text-[#9aa0c8]"> ({m.count} needed)</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
