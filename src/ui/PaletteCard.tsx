'use client'

import type { Element } from '@/src/chem/types'
import { cn } from '@/src/lib/cn'
import { useStore } from '@/src/store'

interface PaletteCardProps {
  element: Element
  accent: string
  onPick?: () => void
}

export function PaletteCard({ element, accent, onPick }: PaletteCardProps) {
  const heldZ = useStore((s) => s.build.heldZ)
  const hold = useStore((s) => s.hold)
  const clearHeld = useStore((s) => s.clearHeld)
  const isHeld = heldZ === element.Z

  function handleClick() {
    if (isHeld) {
      clearHeld()
    } else {
      hold(element.Z)
      onPick?.()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isHeld}
      aria-label={`${element.name}, atomic number ${element.Z}`}
      className={cn(
        'relative flex aspect-square min-h-[60px] flex-col justify-between rounded-md px-2 py-1.5 text-left font-mono transition-colors lg:min-h-0',
        isHeld
          ? 'border-2 border-dashed border-[#5cc6ff] bg-transparent text-[#5cc6ff]'
          : 'border border-[#2a2655] bg-[#181536] text-[#dffaff] hover:-translate-y-0.5 hover:shadow-md',
      )}
      style={
        isHeld
          ? undefined
          : {
              boxShadow: `inset 4px 0 0 ${accent}`,
              background: `linear-gradient(90deg, ${accent}1f 0%, #181536 60%)`,
            }
      }
    >
      <span className="text-[8px] leading-none text-[#6a6f95] lg:text-xs">{element.Z}</span>
      <span className="text-center text-base font-extrabold leading-none lg:text-3xl">
        {element.symbol}
      </span>
      <div className="flex flex-col items-center gap-0 leading-none">
        <span className="text-center text-[7px] text-[#8d92b8] lg:text-[11px]">{element.name}</span>
        <span className="text-center text-[7px] text-[#6a6f95] lg:text-[10px]">
          {element.mass.toFixed(2)}
        </span>
      </div>
    </button>
  )
}
