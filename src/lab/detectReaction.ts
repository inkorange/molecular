import { findReaction, type Stoich } from '@/src/chem/reactions'

/**
 * Lab-mode reaction detection. For now a thin pass-through to the chem
 * engine's stoichiometry matcher — energy / proximity gating layers on
 * top of this in Task 5.5.
 */
export function detectReaction(inputs: readonly Stoich[]) {
  return findReaction(inputs)
}
