/**
 * Full Z 1–118 periodic-table data set, separate from the chem engine's
 * `src/chem/elements.ts` (which stops at Z 36). This dataset is for the
 * /elements explorer surface — display only, not used for bonding /
 * VSEPR / reaction logic.
 *
 * The narrower `Element` type in `src/chem/types.ts` stays unchanged so
 * the engine's existing assumptions about bonding-capable elements
 * don't shift.
 */

import type { ElementCategory } from '@/src/chem/types'

/**
 * Wider category set covering the heavies the chem engine doesn't model.
 * `post-transition` covers the p-block metals (Al, Ga, In, Sn, Tl, Pb,
 * Bi…) the engine groups under `other-metal`. Adding it here keeps the
 * chem `ElementCategory` enum stable.
 */
export type PeriodicCategory = ElementCategory | 'post-transition' | 'lanthanide' | 'actinide'

export interface PeriodicElement {
  Z: number
  symbol: string
  name: string
  /** URL-safe lowercased name with hyphens. */
  slug: string
  mass: number
  category: PeriodicCategory
  /** Row 1–7 for the main block, 8 for lanthanides, 9 for actinides. */
  row: number
  /** Column 1–18 in the textbook layout. */
  column: number
  /** Ground-state shell occupancies. Approximate for heavy elements. */
  shells: readonly number[]
}

/**
 * Compute the (row, column) of an element in the textbook 18×9 layout.
 * Lanthanides and actinides are placed on rows 8 and 9, columns 3–17.
 */
function position(Z: number): { row: number; column: number } {
  if (Z === 1) return { row: 1, column: 1 }
  if (Z === 2) return { row: 1, column: 18 }
  if (Z <= 4) return { row: 2, column: Z - 2 } // Li=1, Be=2
  if (Z <= 10) return { row: 2, column: Z + 8 } // B..Ne = 13..18
  if (Z <= 12) return { row: 3, column: Z - 10 } // Na=1, Mg=2
  if (Z <= 18) return { row: 3, column: Z } // Al=13..Ar=18
  if (Z <= 36) return { row: 4, column: Z - 18 } // K=1..Kr=18
  if (Z <= 54) return { row: 5, column: Z - 36 } // Rb=1..Xe=18
  if (Z <= 56) return { row: 6, column: Z - 54 } // Cs=1, Ba=2
  if (Z <= 71) return { row: 8, column: Z - 54 } // La..Lu (3..17 on the lanthanide row)
  if (Z <= 86) return { row: 6, column: Z - 68 } // Hf=4..Rn=18
  if (Z <= 88) return { row: 7, column: Z - 86 } // Fr=1, Ra=2
  if (Z <= 103) return { row: 9, column: Z - 86 } // Ac..Lr (3..17 on the actinide row)
  return { row: 7, column: Z - 100 } // Rf=4..Og=18
}

/** Slugify an element name: lowercase, hyphenate spaces. */
function makeSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

// Compact source rows: [Z, symbol, name, mass, category, ...shells].
// Categories use the wider PeriodicCategory set. The shells array is the
// standard ground-state configuration for each element — for elements
// with Madelung anomalies (Cr, Cu, Pd, Ag, Au, Pt, …) we still record
// the actual filling so the 3D viz matches what students see in their
// textbooks.
type RawRow = readonly [number, string, string, number, PeriodicCategory, ...number[]]

const RAW: readonly RawRow[] = [
  [1, 'H', 'Hydrogen', 1.008, 'nonmetal', 1],
  [2, 'He', 'Helium', 4.003, 'noble', 2],
  [3, 'Li', 'Lithium', 6.94, 'alkali', 2, 1],
  [4, 'Be', 'Beryllium', 9.012, 'alkaline', 2, 2],
  [5, 'B', 'Boron', 10.81, 'metalloid', 2, 3],
  [6, 'C', 'Carbon', 12.01, 'nonmetal', 2, 4],
  [7, 'N', 'Nitrogen', 14.01, 'nonmetal', 2, 5],
  [8, 'O', 'Oxygen', 16.0, 'nonmetal', 2, 6],
  [9, 'F', 'Fluorine', 19.0, 'halogen', 2, 7],
  [10, 'Ne', 'Neon', 20.18, 'noble', 2, 8],
  [11, 'Na', 'Sodium', 22.99, 'alkali', 2, 8, 1],
  [12, 'Mg', 'Magnesium', 24.31, 'alkaline', 2, 8, 2],
  [13, 'Al', 'Aluminum', 26.98, 'post-transition', 2, 8, 3],
  [14, 'Si', 'Silicon', 28.09, 'metalloid', 2, 8, 4],
  [15, 'P', 'Phosphorus', 30.97, 'nonmetal', 2, 8, 5],
  [16, 'S', 'Sulfur', 32.07, 'nonmetal', 2, 8, 6],
  [17, 'Cl', 'Chlorine', 35.45, 'halogen', 2, 8, 7],
  [18, 'Ar', 'Argon', 39.95, 'noble', 2, 8, 8],
  [19, 'K', 'Potassium', 39.1, 'alkali', 2, 8, 8, 1],
  [20, 'Ca', 'Calcium', 40.08, 'alkaline', 2, 8, 8, 2],
  [21, 'Sc', 'Scandium', 44.96, 'transition', 2, 8, 9, 2],
  [22, 'Ti', 'Titanium', 47.87, 'transition', 2, 8, 10, 2],
  [23, 'V', 'Vanadium', 50.94, 'transition', 2, 8, 11, 2],
  [24, 'Cr', 'Chromium', 52.0, 'transition', 2, 8, 13, 1],
  [25, 'Mn', 'Manganese', 54.94, 'transition', 2, 8, 13, 2],
  [26, 'Fe', 'Iron', 55.85, 'transition', 2, 8, 14, 2],
  [27, 'Co', 'Cobalt', 58.93, 'transition', 2, 8, 15, 2],
  [28, 'Ni', 'Nickel', 58.69, 'transition', 2, 8, 16, 2],
  [29, 'Cu', 'Copper', 63.55, 'transition', 2, 8, 18, 1],
  [30, 'Zn', 'Zinc', 65.38, 'transition', 2, 8, 18, 2],
  [31, 'Ga', 'Gallium', 69.72, 'post-transition', 2, 8, 18, 3],
  [32, 'Ge', 'Germanium', 72.63, 'metalloid', 2, 8, 18, 4],
  [33, 'As', 'Arsenic', 74.92, 'metalloid', 2, 8, 18, 5],
  [34, 'Se', 'Selenium', 78.97, 'nonmetal', 2, 8, 18, 6],
  [35, 'Br', 'Bromine', 79.9, 'halogen', 2, 8, 18, 7],
  [36, 'Kr', 'Krypton', 83.8, 'noble', 2, 8, 18, 8],
  [37, 'Rb', 'Rubidium', 85.47, 'alkali', 2, 8, 18, 8, 1],
  [38, 'Sr', 'Strontium', 87.62, 'alkaline', 2, 8, 18, 8, 2],
  [39, 'Y', 'Yttrium', 88.91, 'transition', 2, 8, 18, 9, 2],
  [40, 'Zr', 'Zirconium', 91.22, 'transition', 2, 8, 18, 10, 2],
  [41, 'Nb', 'Niobium', 92.91, 'transition', 2, 8, 18, 12, 1],
  [42, 'Mo', 'Molybdenum', 95.95, 'transition', 2, 8, 18, 13, 1],
  [43, 'Tc', 'Technetium', 98, 'transition', 2, 8, 18, 13, 2],
  [44, 'Ru', 'Ruthenium', 101.07, 'transition', 2, 8, 18, 15, 1],
  [45, 'Rh', 'Rhodium', 102.91, 'transition', 2, 8, 18, 16, 1],
  [46, 'Pd', 'Palladium', 106.42, 'transition', 2, 8, 18, 18],
  [47, 'Ag', 'Silver', 107.87, 'transition', 2, 8, 18, 18, 1],
  [48, 'Cd', 'Cadmium', 112.41, 'transition', 2, 8, 18, 18, 2],
  [49, 'In', 'Indium', 114.82, 'post-transition', 2, 8, 18, 18, 3],
  [50, 'Sn', 'Tin', 118.71, 'post-transition', 2, 8, 18, 18, 4],
  [51, 'Sb', 'Antimony', 121.76, 'metalloid', 2, 8, 18, 18, 5],
  [52, 'Te', 'Tellurium', 127.6, 'metalloid', 2, 8, 18, 18, 6],
  [53, 'I', 'Iodine', 126.9, 'halogen', 2, 8, 18, 18, 7],
  [54, 'Xe', 'Xenon', 131.29, 'noble', 2, 8, 18, 18, 8],
  [55, 'Cs', 'Cesium', 132.91, 'alkali', 2, 8, 18, 18, 8, 1],
  [56, 'Ba', 'Barium', 137.33, 'alkaline', 2, 8, 18, 18, 8, 2],
  [57, 'La', 'Lanthanum', 138.91, 'lanthanide', 2, 8, 18, 18, 9, 2],
  [58, 'Ce', 'Cerium', 140.12, 'lanthanide', 2, 8, 18, 19, 9, 2],
  [59, 'Pr', 'Praseodymium', 140.91, 'lanthanide', 2, 8, 18, 21, 8, 2],
  [60, 'Nd', 'Neodymium', 144.24, 'lanthanide', 2, 8, 18, 22, 8, 2],
  [61, 'Pm', 'Promethium', 145, 'lanthanide', 2, 8, 18, 23, 8, 2],
  [62, 'Sm', 'Samarium', 150.36, 'lanthanide', 2, 8, 18, 24, 8, 2],
  [63, 'Eu', 'Europium', 151.96, 'lanthanide', 2, 8, 18, 25, 8, 2],
  [64, 'Gd', 'Gadolinium', 157.25, 'lanthanide', 2, 8, 18, 25, 9, 2],
  [65, 'Tb', 'Terbium', 158.93, 'lanthanide', 2, 8, 18, 27, 8, 2],
  [66, 'Dy', 'Dysprosium', 162.5, 'lanthanide', 2, 8, 18, 28, 8, 2],
  [67, 'Ho', 'Holmium', 164.93, 'lanthanide', 2, 8, 18, 29, 8, 2],
  [68, 'Er', 'Erbium', 167.26, 'lanthanide', 2, 8, 18, 30, 8, 2],
  [69, 'Tm', 'Thulium', 168.93, 'lanthanide', 2, 8, 18, 31, 8, 2],
  [70, 'Yb', 'Ytterbium', 173.05, 'lanthanide', 2, 8, 18, 32, 8, 2],
  [71, 'Lu', 'Lutetium', 174.97, 'lanthanide', 2, 8, 18, 32, 9, 2],
  [72, 'Hf', 'Hafnium', 178.49, 'transition', 2, 8, 18, 32, 10, 2],
  [73, 'Ta', 'Tantalum', 180.95, 'transition', 2, 8, 18, 32, 11, 2],
  [74, 'W', 'Tungsten', 183.84, 'transition', 2, 8, 18, 32, 12, 2],
  [75, 'Re', 'Rhenium', 186.21, 'transition', 2, 8, 18, 32, 13, 2],
  [76, 'Os', 'Osmium', 190.23, 'transition', 2, 8, 18, 32, 14, 2],
  [77, 'Ir', 'Iridium', 192.22, 'transition', 2, 8, 18, 32, 15, 2],
  [78, 'Pt', 'Platinum', 195.08, 'transition', 2, 8, 18, 32, 17, 1],
  [79, 'Au', 'Gold', 196.97, 'transition', 2, 8, 18, 32, 18, 1],
  [80, 'Hg', 'Mercury', 200.59, 'transition', 2, 8, 18, 32, 18, 2],
  [81, 'Tl', 'Thallium', 204.38, 'post-transition', 2, 8, 18, 32, 18, 3],
  [82, 'Pb', 'Lead', 207.2, 'post-transition', 2, 8, 18, 32, 18, 4],
  [83, 'Bi', 'Bismuth', 208.98, 'post-transition', 2, 8, 18, 32, 18, 5],
  [84, 'Po', 'Polonium', 209, 'post-transition', 2, 8, 18, 32, 18, 6],
  [85, 'At', 'Astatine', 210, 'halogen', 2, 8, 18, 32, 18, 7],
  [86, 'Rn', 'Radon', 222, 'noble', 2, 8, 18, 32, 18, 8],
  [87, 'Fr', 'Francium', 223, 'alkali', 2, 8, 18, 32, 18, 8, 1],
  [88, 'Ra', 'Radium', 226, 'alkaline', 2, 8, 18, 32, 18, 8, 2],
  [89, 'Ac', 'Actinium', 227, 'actinide', 2, 8, 18, 32, 18, 9, 2],
  [90, 'Th', 'Thorium', 232.04, 'actinide', 2, 8, 18, 32, 18, 10, 2],
  [91, 'Pa', 'Protactinium', 231.04, 'actinide', 2, 8, 18, 32, 20, 9, 2],
  [92, 'U', 'Uranium', 238.03, 'actinide', 2, 8, 18, 32, 21, 9, 2],
  [93, 'Np', 'Neptunium', 237, 'actinide', 2, 8, 18, 32, 22, 9, 2],
  [94, 'Pu', 'Plutonium', 244, 'actinide', 2, 8, 18, 32, 24, 8, 2],
  [95, 'Am', 'Americium', 243, 'actinide', 2, 8, 18, 32, 25, 8, 2],
  [96, 'Cm', 'Curium', 247, 'actinide', 2, 8, 18, 32, 25, 9, 2],
  [97, 'Bk', 'Berkelium', 247, 'actinide', 2, 8, 18, 32, 27, 8, 2],
  [98, 'Cf', 'Californium', 251, 'actinide', 2, 8, 18, 32, 28, 8, 2],
  [99, 'Es', 'Einsteinium', 252, 'actinide', 2, 8, 18, 32, 29, 8, 2],
  [100, 'Fm', 'Fermium', 257, 'actinide', 2, 8, 18, 32, 30, 8, 2],
  [101, 'Md', 'Mendelevium', 258, 'actinide', 2, 8, 18, 32, 31, 8, 2],
  [102, 'No', 'Nobelium', 259, 'actinide', 2, 8, 18, 32, 32, 8, 2],
  [103, 'Lr', 'Lawrencium', 266, 'actinide', 2, 8, 18, 32, 32, 8, 3],
  [104, 'Rf', 'Rutherfordium', 267, 'transition', 2, 8, 18, 32, 32, 10, 2],
  [105, 'Db', 'Dubnium', 268, 'transition', 2, 8, 18, 32, 32, 11, 2],
  [106, 'Sg', 'Seaborgium', 269, 'transition', 2, 8, 18, 32, 32, 12, 2],
  [107, 'Bh', 'Bohrium', 270, 'transition', 2, 8, 18, 32, 32, 13, 2],
  [108, 'Hs', 'Hassium', 269, 'transition', 2, 8, 18, 32, 32, 14, 2],
  [109, 'Mt', 'Meitnerium', 278, 'transition', 2, 8, 18, 32, 32, 15, 2],
  [110, 'Ds', 'Darmstadtium', 281, 'transition', 2, 8, 18, 32, 32, 16, 2],
  [111, 'Rg', 'Roentgenium', 282, 'transition', 2, 8, 18, 32, 32, 17, 2],
  [112, 'Cn', 'Copernicium', 285, 'transition', 2, 8, 18, 32, 32, 18, 2],
  [113, 'Nh', 'Nihonium', 286, 'post-transition', 2, 8, 18, 32, 32, 18, 3],
  [114, 'Fl', 'Flerovium', 289, 'post-transition', 2, 8, 18, 32, 32, 18, 4],
  [115, 'Mc', 'Moscovium', 290, 'post-transition', 2, 8, 18, 32, 32, 18, 5],
  [116, 'Lv', 'Livermorium', 293, 'post-transition', 2, 8, 18, 32, 32, 18, 6],
  [117, 'Ts', 'Tennessine', 294, 'halogen', 2, 8, 18, 32, 32, 18, 7],
  [118, 'Og', 'Oganesson', 294, 'noble', 2, 8, 18, 32, 32, 18, 8],
] as const

export const PERIODIC_ELEMENTS: readonly PeriodicElement[] = RAW.map(
  ([Z, symbol, name, mass, category, ...shells]) => {
    const { row, column } = position(Z)
    return {
      Z,
      symbol,
      name,
      slug: makeSlug(name),
      mass,
      category,
      row,
      column,
      shells,
    }
  },
)

const BY_Z = new Map<number, PeriodicElement>(PERIODIC_ELEMENTS.map((e) => [e.Z, e]))
const BY_SLUG = new Map<string, PeriodicElement>(PERIODIC_ELEMENTS.map((e) => [e.slug, e]))
const BY_SYMBOL = new Map<string, PeriodicElement>(PERIODIC_ELEMENTS.map((e) => [e.symbol, e]))

export function getPeriodicElement(Z: number): PeriodicElement | undefined {
  return BY_Z.get(Z)
}

export function getPeriodicElementBySlug(slug: string): PeriodicElement | undefined {
  return BY_SLUG.get(slug)
}

export function getPeriodicElementBySymbol(symbol: string): PeriodicElement | undefined {
  return BY_SYMBOL.get(symbol)
}

/** All element slugs — used to build the sitemap. */
export function listElementSlugs(): readonly string[] {
  return PERIODIC_ELEMENTS.map((e) => e.slug)
}
