import { describe, expect, it } from 'vitest'
import { cn } from '@/src/lib/cn'

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy values', () => {
    expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c')
  })

  it('dedupes conflicting Tailwind classes (last one wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})
