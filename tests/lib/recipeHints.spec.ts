import { describe, expect, it } from 'vitest'
import type { SceneSnapshot } from '@/src/chem/types'
import { getLibraryEntry } from '@/src/data/molecules'
import { getRecipeHints } from '@/src/lib/recipeHints'
import { spawnLibraryEntry } from '@/src/lib/spawn'

// Build a SceneSnapshot from a list of library ids by reusing the production
// spawn helper. Returns the scene plus the spawned molecule ids so individual
// tests can mark them as "pending" if needed.
function buildScene(libIds: string[]): { scene: SceneSnapshot; moleculeIds: string[] } {
  const scene: SceneSnapshot = { atoms: {}, bonds: {}, molecules: {} }
  const moleculeIds: string[] = []
  for (const id of libIds) {
    const entry = getLibraryEntry(id)
    if (!entry) throw new Error(`Library entry not found: ${id}`)
    const result = spawnLibraryEntry(entry)
    scene.molecules[result.molecule.id] = result.molecule
    for (const a of result.atoms) scene.atoms[a.id] = a
    for (const b of result.bonds) scene.bonds[b.id] = b
    moleculeIds.push(result.molecule.id)
  }
  return { scene, moleculeIds }
}

describe('getRecipeHints', () => {
  it('returns no hints for an empty scene', () => {
    const { scene } = buildScene([])
    expect(getRecipeHints({ scene })).toEqual([])
  })

  it('marks water-synthesis as ready with 2 H₂ + 1 O₂', () => {
    const { scene, moleculeIds } = buildScene(['hydrogen-gas', 'hydrogen-gas', 'oxygen-gas'])
    const hints = getRecipeHints({ scene })
    const water = hints.find((h) => h.reactionId === 'water-synthesis')
    expect(water).toBeDefined()
    expect(water?.status).toBe('ready')
    expect(water?.missing).toEqual([])
    // Three molecules in the scene; all three should be in the matched set.
    expect(new Set(water?.matchedMoleculeIds)).toEqual(new Set(moleculeIds))
  })

  it('reports missing reactants for partial ingredients', () => {
    const { scene } = buildScene(['hydrogen-gas', 'oxygen-gas']) // missing 1 H₂
    const hints = getRecipeHints({ scene })
    const water = hints.find((h) => h.reactionId === 'water-synthesis')
    expect(water).toBeDefined()
    expect(water?.status).toBe('missing')
    expect(water?.missing).toContainEqual({ formula: 'H2', count: 1 })
    expect(water?.matchedMoleculeIds).toEqual([])
  })

  it('water-electrolysis is ready when scene has 2 H₂O', () => {
    const { scene } = buildScene(['water', 'water'])
    const hints = getRecipeHints({ scene })
    const electrolysis = hints.find((h) => h.reactionId === 'water-electrolysis')
    expect(electrolysis?.status).toBe('ready')
  })

  it('ranks ready hints above missing hints', () => {
    // 2 H₂ + 1 O₂ → ready for water-synthesis. Also 1 H₂ alone would
    // partially match h2-synthesis-from-h but should rank lower.
    const { scene } = buildScene(['hydrogen-gas', 'hydrogen-gas', 'oxygen-gas'])
    const hints = getRecipeHints({ scene })
    expect(hints[0]?.status).toBe('ready')
  })

  it('boosts ready hints whose matched molecules are all in the pending pool', () => {
    // Two scenes both have 2 H₂ + 1 O₂. In one, all are pending → that hint
    // should rank with the synthetic 1.5 fillRatio boost.
    const { scene, moleculeIds } = buildScene(['hydrogen-gas', 'hydrogen-gas', 'oxygen-gas'])
    const hints = getRecipeHints({ scene, pendingReactantIds: moleculeIds })
    const water = hints.find((h) => h.reactionId === 'water-synthesis')
    expect(water?.fillRatio).toBeGreaterThanOrEqual(1.5)
  })

  it('caps the hint list at 6 entries', () => {
    // A scene that touches many reactions — methane, ethane, propane each
    // need O₂ for combustion; ammonia synthesis needs N₂; water synthesis
    // needs H₂; ethanol combustion etc. Adding broadly should produce ≥ 6
    // partially-filled recipes.
    const { scene } = buildScene([
      'methane',
      'ethane',
      'propane',
      'ethanol',
      'hydrogen-gas',
      'oxygen-gas',
      'nitrogen-gas',
      'water',
    ])
    const hints = getRecipeHints({ scene })
    expect(hints.length).toBeLessThanOrEqual(6)
  })

  it('drops very low fill-ratio missing hints as noise', () => {
    // A lonely H atom is far from satisfying any reaction (most reactants
    // are H₂, O₂, etc., not H by itself). The hint list should not be
    // dominated by ≤25% filled recipes.
    const { scene } = buildScene(['hydrogen-gas'])
    const hints = getRecipeHints({ scene })
    for (const h of hints) {
      if (h.status === 'missing') {
        expect(h.fillRatio).toBeGreaterThanOrEqual(0.25)
      }
    }
  })
})
