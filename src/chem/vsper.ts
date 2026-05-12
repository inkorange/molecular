import { getElement } from './elements'
import type { Atom, SceneSnapshot, Vec3 } from './types'

// Normalized bond length in scene space (per-pair tuning can come later).
export const BOND_LENGTH = 1.0

export interface BondingSite {
  position: Vec3
  direction: Vec3
}

// Canonical unit-direction sets per electron-domain count (VSEPR).
// Each set's first vector points along +x so we can rotate the whole set
// to align that first slot with the first existing neighbor's direction.
const LINEAR: Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
]

const TRIGONAL_PLANAR: Vec3[] = [
  [1, 0, 0],
  [-0.5, Math.sqrt(3) / 2, 0],
  [-0.5, -Math.sqrt(3) / 2, 0],
]

// Tetrahedral set rotated so the first vector is +x.
// Canonical tetrahedral angle = acos(-1/3) ≈ 109.47°.
// Other three vertices sit symmetrically with x = -1/3.
const TETRAHEDRAL: Vec3[] = (() => {
  const inv3 = -1 / 3
  const r = Math.sqrt(1 - inv3 * inv3) // sin of polar angle from +x
  const sin120 = Math.sqrt(3) / 2
  return [
    [1, 0, 0],
    [inv3, r, 0],
    [inv3, r * -0.5, r * sin120],
    [inv3, r * -0.5, -r * sin120],
  ]
})()

const GEOMETRY: Record<number, Vec3[]> = {
  1: [[1, 0, 0]],
  2: LINEAR,
  3: TRIGONAL_PLANAR,
  4: TETRAHEDRAL,
}

function normalize(v: number[]): Vec3 {
  const len = Math.hypot(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0) || 1
  return [(v[0] ?? 0) / len, (v[1] ?? 0) / len, (v[2] ?? 0) / len]
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

function scale(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s]
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

// Rotate a set of unit directions so that its first slot ([1,0,0]) maps to `target`.
// Uses Rodrigues' formula. If target is already +x, returns the set unchanged.
// If target is -x, applies a 180° rotation about +y.
function alignFirstSlotTo(dirs: Vec3[], target: Vec3): Vec3[] {
  const xAxis: Vec3 = [1, 0, 0]
  const t = normalize([target[0], target[1], target[2]])
  const c = dot(xAxis, t)
  if (c > 0.9999) return dirs
  if (c < -0.9999) {
    // 180° rotation about y: (x,y,z) -> (-x, y, -z)
    return dirs.map((v) => [-v[0], v[1], -v[2]] as Vec3)
  }
  const axis = normalize([...cross(xAxis, t)])
  const s = Math.sqrt(1 - c * c) // sin(theta) since axis is unit
  return dirs.map((v) => {
    // Rodrigues: v_rot = v*cos + (axis x v)*sin + axis*(axis·v)*(1-cos)
    const cx = cross(axis, v)
    const k = dot(axis, v) * (1 - c)
    return [
      v[0] * c + cx[0] * s + axis[0] * k,
      v[1] * c + cx[1] * s + axis[1] * k,
      v[2] * c + cx[2] * s + axis[2] * k,
    ] as Vec3
  })
}

/**
 * Returns world-space positions where the given atom still has free valence,
 * oriented per VSEPR. Geometry chosen by total electron-domain count (bonds + lone pairs).
 * Existing neighbor directions reserve geometry slots first; lone pairs reserve next;
 * remaining slots are the open bonding sites.
 */
export function getBondingSites(atom: Atom, scene: SceneSnapshot): BondingSite[] {
  const el = getElement(atom.Z)
  if (el.bondingCapacity === 0) return []

  // 1) Sum the order of bonds this atom is already part of and collect neighbor directions.
  let usedBonds = 0
  const neighborDirs: Vec3[] = []
  for (const b of Object.values(scene.bonds)) {
    if (b.atomA !== atom.id && b.atomB !== atom.id) continue
    usedBonds += b.order
    const otherId = b.atomA === atom.id ? b.atomB : b.atomA
    const other = scene.atoms[otherId]
    if (!other) continue
    neighborDirs.push(
      normalize([
        other.position[0] - atom.position[0],
        other.position[1] - atom.position[1],
        other.position[2] - atom.position[2],
      ]),
    )
  }

  const remainingBonds = el.bondingCapacity - usedBonds
  if (remainingBonds <= 0) return []

  // 2) Lone-pair count: each covalent bond uses 1 of this atom's valence electrons.
  // (A double bond consumes 2, etc.) Leftover electrons pair up into lone pairs.
  const electronsInBonds = usedBonds + remainingBonds
  const electronsLeftForLonePairs = Math.max(0, el.valence - electronsInBonds)
  const computedLonePairs = Math.floor(electronsLeftForLonePairs / 2)

  const neighborCount = neighborDirs.length
  const totalDomains = neighborCount + remainingBonds + computedLonePairs

  // 3) Pick canonical geometry; degrade anything past 4 to tetrahedral for v1.
  const canonical = GEOMETRY[Math.min(totalDomains, 4)] ?? GEOMETRY[4]!

  // 4) Rotate the canonical set so its first slot aligns with the first neighbor (if any).
  // This guarantees that remaining slots sit at the correct VSEPR angles relative to the
  // ACTUAL neighbor direction — not the closest canonical slot direction.
  const first = neighborDirs[0]
  const directions: Vec3[] = first ? alignFirstSlotTo(canonical, first) : canonical

  // 5) Reserve slots for existing neighbors (closest-dot-wins). Slot 0 is already aligned
  // to neighbor 0; subsequent neighbors greedily take the closest unused slot.
  const used: number[] = []
  for (const nd of neighborDirs) {
    let best = -1
    let bestDot = -Infinity
    for (let i = 0; i < directions.length; i++) {
      if (used.includes(i)) continue
      const d = dot(nd, directions[i]!)
      if (d > bestDot) {
        bestDot = d
        best = i
      }
    }
    if (best >= 0) used.push(best)
  }

  // 6) Reserve slots for lone pairs. Prefer slots FARTHEST from any existing neighbor so
  // lone pairs sit opposite the bond pairs (canonical AX_nE_m geometry). With no neighbors
  // yet, prefer slots farthest from previously-placed lone pairs to spread them out.
  for (let lp = 0; lp < computedLonePairs; lp++) {
    let best = -1
    let bestScore = -Infinity
    for (let i = 0; i < directions.length; i++) {
      if (used.includes(i)) continue
      let maxDot = -Infinity
      if (neighborDirs.length > 0) {
        for (const nd of neighborDirs) {
          const dval = dot(directions[i]!, nd)
          if (dval > maxDot) maxDot = dval
        }
      } else {
        for (const u of used) {
          const dval = dot(directions[i]!, directions[u]!)
          if (dval > maxDot) maxDot = dval
        }
        if (maxDot === -Infinity) maxDot = -1
      }
      const score = -maxDot
      if (score > bestScore) {
        bestScore = score
        best = i
      }
    }
    if (best >= 0) used.push(best)
  }

  // 7) Whatever directions are left are the open bonding sites.
  const sites: BondingSite[] = []
  for (let i = 0; i < directions.length; i++) {
    if (used.includes(i)) continue
    if (sites.length >= remainingBonds) break
    const dir = directions[i]!
    sites.push({
      position: add(atom.position, scale(dir, BOND_LENGTH)),
      direction: dir,
    })
  }

  return sites
}
