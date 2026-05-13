import { LIBRARY } from '@/src/data/molecules'

export interface ReelStep {
  libraryId: string
  durationMs: number
}

/**
 * Autonomous landing-page reel. Each step plays for durationMs then advances
 * to the next; the sequence loops. Picked for visual variety — bent (H₂O),
 * tetrahedral (CH₄), trigonal pyramidal (NH₃), ionic pair (NaCl).
 */
export const REEL: ReelStep[] = [
  { libraryId: 'water', durationMs: 7000 },
  { libraryId: 'methane', durationMs: 7000 },
  { libraryId: 'ammonia', durationMs: 7000 },
  { libraryId: 'sodium-chloride', durationMs: 7000 },
]

export function getReelMolecule(id: string) {
  return LIBRARY.find((m) => m.id === id)
}
