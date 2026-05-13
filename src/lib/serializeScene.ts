import type { Atom, Bond, Molecule, SceneSnapshot } from '@/src/chem/types'

/**
 * Compact JSON encode of a scene: just the three entity arrays. Ids stay as
 * branded strings — they round-trip lossless via JSON since the brand is
 * compile-time only. Used by both share URLs and localStorage auto-save.
 */
export function serializeScene(scene: SceneSnapshot): string {
  return JSON.stringify({
    atoms: Object.values(scene.atoms),
    bonds: Object.values(scene.bonds),
    molecules: Object.values(scene.molecules),
  })
}

interface RawSnapshot {
  atoms: Atom[]
  bonds: Bond[]
  molecules: Molecule[]
}

/**
 * Reverse of {@link serializeScene}. Tolerant of missing top-level keys
 * (returns empty arrays) so a truncated share URL just yields an empty
 * scene instead of throwing.
 */
export function deserializeScene(json: string): SceneSnapshot {
  const raw = JSON.parse(json) as Partial<RawSnapshot>
  const atoms: SceneSnapshot['atoms'] = {}
  for (const a of raw.atoms ?? []) atoms[a.id as string] = a
  const bonds: SceneSnapshot['bonds'] = {}
  for (const b of raw.bonds ?? []) bonds[b.id as string] = b
  const molecules: SceneSnapshot['molecules'] = {}
  for (const m of raw.molecules ?? []) molecules[m.id as string] = m
  return { atoms, bonds, molecules }
}
