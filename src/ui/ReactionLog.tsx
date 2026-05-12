'use client'

import { useStore } from '@/src/store'

export function ReactionLog() {
  const log = useStore((s) => s.lab.reactions)
  if (log.length === 0) {
    return <div className="p-4 text-center text-xs text-[#6a6f95]">No reactions yet.</div>
  }
  return (
    <ul className="flex flex-col gap-1 p-3 text-sm">
      {log
        .slice()
        .reverse()
        .map((r) => (
          <li
            key={`${r.id}-${r.ts ?? 0}`}
            className="rounded-md bg-[#14112e] px-3 py-2 font-mono text-[#dffaff]"
          >
            <div>{r.equation}</div>
            <div className="text-[10px] text-[#6a6f95]">
              {r.id} · {r.enthalpy}
            </div>
          </li>
        ))}
    </ul>
  )
}
