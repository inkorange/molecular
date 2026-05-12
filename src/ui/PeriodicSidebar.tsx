'use client'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { groupedElements, tierMaxZ } from '@/src/lib/elementCategories'
import { useStore } from '@/src/store'
import { PaletteCard } from './PaletteCard'

interface PeriodicSidebarProps {
  onPick?: () => void
}

export function PeriodicSidebar({ onPick }: PeriodicSidebarProps) {
  const tier = useStore((s) => s.scene.tier)
  const toggleFullTable = useStore((s) => s.toggleFullTable)
  const groups = groupedElements(tierMaxZ(tier))

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <Button
        size="sm"
        onClick={() => toggleFullTable()}
        className="min-h-[40px] w-full bg-[#5cc6ff] text-[#07051a] hover:bg-[#7ad6ff]"
      >
        View full table →
      </Button>
      <div className="text-[10px] uppercase tracking-wider text-[#6a6f95]">
        {tier === 'beginner' ? 'Beginner (Z 1–20)' : 'Standard (Z 1–36)'} · tap any card to pick
      </div>
      <div
        className="-mr-3 min-h-0 flex-1 overflow-y-auto pr-3"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex flex-col gap-3 pb-6">
          {groups.map((g) => (
            <Collapsible key={g.category} defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-t-md bg-[#14112e] px-3 py-2 text-left">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#cfd3e8]">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: g.accent }}
                  />
                  {g.label}
                </span>
                <span className="text-[10px] text-[#6a6f95]">{g.entries.length}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-4 gap-1.5 rounded-b-md bg-[#14112e]/60 p-2">
                  {g.entries.map((e) => (
                    <PaletteCard key={e.Z} element={e} accent={g.accent} onPick={onPick} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  )
}
