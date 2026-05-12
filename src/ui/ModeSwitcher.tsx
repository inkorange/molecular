'use client'

import { cn } from '@/src/lib/cn'
import { useStore } from '@/src/store'
import type { Mode } from '@/src/store/sceneSlice'

const MODES: { id: Mode; label: string }[] = [
  { id: 'explore', label: 'Explore' },
  { id: 'build', label: 'Build' },
  { id: 'lab', label: 'Lab' },
]

export function ModeSwitcher() {
  const mode = useStore((s) => s.scene.mode)
  const setMode = useStore((s) => s.setMode)
  return (
    <div className="inline-flex rounded-lg bg-[#14112e] p-1">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setMode(m.id)}
          aria-pressed={mode === m.id}
          className={cn(
            'min-h-[36px] min-w-[60px] rounded-md px-3 py-1 text-xs font-semibold transition-colors',
            mode === m.id ? 'bg-[#3a2e7a] text-white' : 'text-[#9aa0c8] hover:bg-[#1a163a]',
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
