'use client'

import { useMemo } from 'react'
import { validateScene } from '@/src/chem/validate'
import { useStore } from '@/src/store'

export function ValidityBar() {
  const scene = useStore((s) => s.scene)
  const status = useMemo(() => validateScene(scene), [scene])

  const color = {
    empty: 'text-[#6a6f95]',
    'valid-named': 'text-[#a4ff8c]',
    'valid-unnamed': 'text-[#9aa0c8]',
    'valid-unusual': 'text-[#ffd97a]',
    invalid: 'text-[#ff7a7a]',
  }[status.status]

  const text =
    status.status === 'empty'
      ? 'Empty scene'
      : status.status === 'valid-named'
        ? `✓ ${status.name} · ${status.formula}`
        : status.status === 'valid-unnamed'
          ? `✓ ${status.formula} · stable but unnamed`
          : status.status === 'valid-unusual'
            ? `⚠ ${status.formula} · ${status.reason ?? 'unusual'}`
            : `⚠ ${status.reason ?? 'invalid'}`

  return <div className={`flex h-9 items-center px-4 text-xs font-medium ${color}`}>{text}</div>
}
