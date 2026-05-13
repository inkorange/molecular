'use client'

import { Html } from '@react-three/drei'
import type { Vector3Tuple } from 'three'
import { getLibraryEntry, type LibraryCategory } from '@/src/data/molecules'

interface MoleculeLabelProps {
  libraryId: string
  /** 3D anchor in the parent group's local space. The HTML projects to
   *  screen coordinates at this point, then a small CSS offset shifts
   *  the chip away from dead-center so it doesn't sit on top of bonds. */
  position?: Vector3Tuple
}

// Faint per-category tint applied to the molecule name. Matches the
// vocabulary used elsewhere in the demo player so the chip feels part
// of the same design system.
const CATEGORY_NAME_COLOR: Record<LibraryCategory, string> = {
  'water-solvents': '#5cc6ff',
  'acids-bases': '#ff7a8c',
  hydrocarbons: '#ffd97a',
  'salts-ionic': '#c89eff',
  biological: '#a4ff8c',
  gases: '#dffaff',
}

/**
 * HTML chip naming a library molecule with its formula + common name.
 * Renders as a DOM overlay anchored to a 3D point via drei's `<Html>` —
 * not as a Billboard inside the scene — so it stays at constant pixel
 * size regardless of camera zoom and doesn't need any per-frame scaling
 * logic. The chip sits slightly off-center vertically so it floats just
 * below the molecule without occluding bonds.
 */
export function MoleculeLabel({ libraryId, position = [0, 0, 0] }: MoleculeLabelProps) {
  const entry = getLibraryEntry(libraryId)
  if (!entry) return null
  const nameColor = CATEGORY_NAME_COLOR[entry.category]

  return (
    <Html
      position={position}
      // center anchors the HTML's center on the projected point; the
      // CSS transform on the inner chip then nudges it downward so it
      // sits just below the molecule's center.
      center
      // Don't intercept pointer events — the chip is purely informational
      // and shouldn't block clicks on atoms underneath.
      style={{ pointerEvents: 'none' }}
      // Disable occlusion testing — labels should always read, even when
      // the molecule rotates atoms in front of the anchor point.
      zIndexRange={[20, 0]}
    >
      <div
        className="select-none whitespace-nowrap rounded-lg border border-[#5cc6ff]/30 bg-[#0d0a22]/85 px-4 py-2 text-center font-sans backdrop-blur"
        style={{ transform: 'translateY(48px)' }}
      >
        <div className="font-extrabold text-[#dffaff] text-sm leading-none">{entry.formula}</div>
        <div className="mt-0.5 text-[10px] leading-none tracking-wide" style={{ color: nameColor }}>
          {entry.name}
        </div>
      </div>
    </Html>
  )
}
