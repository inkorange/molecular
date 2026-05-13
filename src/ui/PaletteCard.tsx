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
        // aspect-square keeps card height in sync with width so big text
        // doesn't overflow at low column counts, and the cards never get
        // tall + empty in the middle.
        'relative flex aspect-square flex-col justify-between overflow-hidden rounded-md px-2 py-2 text-left font-mono transition-colors',
        isHeld
          ? 'border-2 border-dashed border-[#5cc6ff] bg-transparent text-[#5cc6ff]'
          : 'border border-[#2a2655] bg-[#0d0a22]/90 text-[#dffaff] hover:-translate-y-0.5 hover:shadow-md',
      )}
      style={
        isHeld
          ? undefined
          : {
              // Thick left-edge accent strip (5px) — matches the 3D atom
              // card's category-bar pattern so the palette cards read as
              // the same design language.
              boxShadow: `inset 5px 0 0 ${accent}`,
            }
      }
    >
      {/* Atomic number — top-left, inset past the accent strip. */}
      <span className="pl-1.5 font-semibold text-[#9aa0c8] text-sm leading-none sm:text-base md:text-lg lg:text-sm">
        {element.Z}
      </span>
      {/* Symbol — the headline of the card. Sized large enough at every
          breakpoint that the card reads at a glance, even on mobile. */}
      <span className="text-center font-extrabold text-3xl leading-none sm:text-4xl md:text-5xl lg:text-3xl">
        {element.symbol}
      </span>
      <div className="flex flex-col items-center gap-0 leading-tight">
        <span className="text-center font-semibold text-[#8d92b8] text-xs sm:text-sm md:text-base lg:text-xs">
          {element.name}
        </span>
        <span className="text-center text-[11px] text-[#6a6f95] sm:text-xs md:text-sm lg:text-[10px]">
          {element.mass.toFixed(2)}
        </span>
      </div>
    </button>
  )
}
