import { getElement } from '@/src/chem/elements'
import { getFormula } from '@/src/chem/formula'
import type { SceneSnapshot } from '@/src/chem/types'
import { validateScene } from '@/src/chem/validate'

/**
 * Render the current scene as a short plain-text summary suitable for
 * stuffing into an LLM prompt. Kept tiny on purpose — tutor responses
 * stream faster when the prompt body is small. Includes formula, common
 * name (if known), atom counts, and the chem engine's validity note.
 */
export function sceneToPrompt(scene: SceneSnapshot): string {
  const atoms = Object.values(scene.atoms)
  if (atoms.length === 0) return 'The scene is empty.'

  const formula = getFormula(atoms)
  const v = validateScene(scene)

  const counts = new Map<string, number>()
  for (const a of atoms) {
    const sym = getElement(a.Z).symbol
    counts.set(sym, (counts.get(sym) ?? 0) + 1)
  }
  const composition = [...counts.entries()].map(([s, n]) => `${n} ${s}`).join(', ')
  const bondCount = Object.keys(scene.bonds).length

  return [
    'Current scene:',
    `Formula: ${formula}`,
    v.name ? `Common name: ${v.name}` : 'No common name in the local library.',
    `Atoms: ${composition}`,
    `Bonds: ${bondCount}`,
    v.reason ? `Note: ${v.reason}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}
