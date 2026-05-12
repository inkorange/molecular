import { describe, expect, it } from 'vitest'
import { detectReaction } from '@/src/lab/detectReaction'

describe('detectReaction', () => {
  it('matches 2 H2 + O2 → water-synthesis', () => {
    const r = detectReaction([
      { formula: 'H2', count: 2 },
      { formula: 'O2', count: 1 },
    ])
    expect(r?.id).toBe('water-synthesis')
  })

  it('returns undefined when no match', () => {
    expect(detectReaction([{ formula: 'He', count: 2 }])).toBeUndefined()
  })
})
