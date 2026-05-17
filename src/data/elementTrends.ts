/**
 * Periodic-trend numeric data for all 118 elements. Kept separate from
 * `elementsFull.ts` so the core table stays focused on positional /
 * shell data and so this richer-but-bulky table can be edited
 * independently.
 *
 * Values are standard reference numbers (Pauling-scale electronegativity,
 * Slater/Clementi atomic radii in picometres, first-ionization energy
 * in kJ/mol, melting point at 1 atm in kelvin). For synthetic heavies
 * where the property hasn't been measured, the value is `null` and the
 * UI renders the tile in a neutral "no data" tone.
 *
 * Sources: IUPAC 2013, NIST atomic-properties tables, CRC Handbook.
 */

export type TrendKey = 'atomicRadius' | 'electronegativity' | 'ionizationEnergy' | 'meltingPoint'

export interface ElementTrends {
  /** Calculated atomic radius (Clementi 1963), in picometres. */
  atomicRadius: number | null
  /** Pauling-scale electronegativity. Noble gases without measured
   *  values are `null` so the gradient skips them rather than mapping
   *  them to "low electronegativity" (misleading). */
  electronegativity: number | null
  /** First ionization energy in kJ/mol. */
  ionizationEnergy: number | null
  /** Melting point at 1 atm, in kelvin. `null` for elements that
   *  sublime (e.g. carbon, arsenic) or whose state isn't condensed
   *  at standard pressure (e.g. helium). */
  meltingPoint: number | null
}

// Compact source rows: [Z, atomicRadius, electronegativity, ionizationEnergy, meltingPoint].
// `null` in any slot means "not measured / not applicable".
type TrendRow = readonly [number, number | null, number | null, number | null, number | null]

const RAW: readonly TrendRow[] = [
  [1, 53, 2.2, 1312, 14],
  [2, 31, null, 2372, null],
  [3, 167, 0.98, 520, 454],
  [4, 112, 1.57, 899, 1560],
  [5, 87, 2.04, 801, 2349],
  [6, 67, 2.55, 1086, null],
  [7, 56, 3.04, 1402, 63],
  [8, 48, 3.44, 1314, 54],
  [9, 42, 3.98, 1681, 53],
  [10, 38, null, 2081, 25],
  [11, 190, 0.93, 496, 371],
  [12, 145, 1.31, 738, 923],
  [13, 118, 1.61, 577, 933],
  [14, 111, 1.9, 786, 1687],
  [15, 98, 2.19, 1012, 317],
  [16, 88, 2.58, 1000, 388],
  [17, 79, 3.16, 1251, 172],
  [18, 71, null, 1521, 84],
  [19, 243, 0.82, 419, 337],
  [20, 194, 1.0, 590, 1115],
  [21, 184, 1.36, 633, 1814],
  [22, 176, 1.54, 659, 1941],
  [23, 171, 1.63, 651, 2183],
  [24, 166, 1.66, 653, 2180],
  [25, 161, 1.55, 717, 1519],
  [26, 156, 1.83, 762, 1811],
  [27, 152, 1.88, 760, 1768],
  [28, 149, 1.91, 737, 1728],
  [29, 145, 1.9, 746, 1358],
  [30, 142, 1.65, 906, 693],
  [31, 136, 1.81, 579, 303],
  [32, 125, 2.01, 762, 1211],
  [33, 114, 2.18, 947, null],
  [34, 103, 2.55, 941, 494],
  [35, 94, 2.96, 1140, 266],
  [36, 88, 3.0, 1351, 116],
  [37, 265, 0.82, 403, 312],
  [38, 219, 0.95, 549, 1050],
  [39, 212, 1.22, 600, 1799],
  [40, 206, 1.33, 640, 2128],
  [41, 198, 1.6, 652, 2750],
  [42, 190, 2.16, 684, 2896],
  [43, 183, 1.9, 702, 2430],
  [44, 178, 2.2, 710, 2607],
  [45, 173, 2.28, 720, 2237],
  [46, 169, 2.2, 804, 1828],
  [47, 165, 1.93, 731, 1235],
  [48, 161, 1.69, 868, 594],
  [49, 156, 1.78, 558, 430],
  [50, 145, 1.96, 709, 505],
  [51, 133, 2.05, 834, 904],
  [52, 123, 2.1, 869, 723],
  [53, 115, 2.66, 1008, 387],
  [54, 108, 2.6, 1170, 161],
  [55, 298, 0.79, 376, 302],
  [56, 253, 0.89, 503, 1000],
  [57, 226, 1.1, 538, 1193],
  [58, 210, 1.12, 534, 1068],
  [59, 247, 1.13, 527, 1208],
  [60, 206, 1.14, 533, 1297],
  [61, 205, 1.13, 540, 1315],
  [62, 238, 1.17, 545, 1345],
  [63, 231, 1.2, 547, 1099],
  [64, 233, 1.2, 593, 1585],
  [65, 225, 1.2, 566, 1629],
  [66, 228, 1.22, 573, 1680],
  [67, 226, 1.23, 581, 1734],
  [68, 226, 1.24, 589, 1802],
  [69, 222, 1.25, 597, 1818],
  [70, 222, 1.1, 603, 1097],
  [71, 217, 1.27, 524, 1925],
  [72, 208, 1.3, 659, 2506],
  [73, 200, 1.5, 761, 3290],
  [74, 193, 2.36, 770, 3695],
  [75, 188, 1.9, 760, 3459],
  [76, 185, 2.2, 840, 3306],
  [77, 180, 2.2, 880, 2719],
  [78, 177, 2.28, 870, 2041],
  [79, 174, 2.54, 890, 1337],
  [80, 171, 2.0, 1007, 234],
  [81, 156, 1.62, 589, 577],
  [82, 154, 2.33, 716, 601],
  [83, 143, 2.02, 703, 545],
  [84, 135, 2.0, 812, 527],
  [85, 127, 2.2, 920, 575],
  [86, 120, null, 1037, 202],
  [87, null, 0.7, 380, 300],
  [88, 215, 0.9, 509, 973],
  [89, 195, 1.1, 499, 1323],
  [90, 180, 1.3, 587, 2115],
  [91, 180, 1.5, 568, 1841],
  [92, 175, 1.38, 597, 1405],
  [93, 175, 1.36, 604, 917],
  [94, 175, 1.28, 584, 913],
  [95, 175, 1.13, 578, 1449],
  [96, null, 1.28, 581, 1613],
  [97, null, 1.3, 601, 1259],
  [98, null, 1.3, 608, 1173],
  [99, null, 1.3, 619, 1133],
  [100, null, 1.3, 627, 1800],
  [101, null, 1.3, 635, 1100],
  [102, null, 1.3, 642, 1100],
  [103, null, null, null, 1900],
  [104, null, null, null, 2400],
  [105, null, null, null, null],
  [106, null, null, null, null],
  [107, null, null, null, null],
  [108, null, null, null, null],
  [109, null, null, null, null],
  [110, null, null, null, null],
  [111, null, null, null, null],
  [112, null, null, null, null],
  [113, null, null, null, null],
  [114, null, null, null, null],
  [115, null, null, null, null],
  [116, null, null, null, null],
  [117, null, null, null, null],
  [118, null, null, null, null],
] as const

const TRENDS_BY_Z = new Map<number, ElementTrends>(
  RAW.map(([Z, atomicRadius, electronegativity, ionizationEnergy, meltingPoint]) => [
    Z,
    { atomicRadius, electronegativity, ionizationEnergy, meltingPoint },
  ]),
)

/** Look up trend values for a given Z. Returns a record where any
 *  individual field may be `null` for elements that lack the measured
 *  property (or for transactinides where it's predicted but not
 *  experimentally confirmed). */
export function getElementTrends(Z: number): ElementTrends {
  return (
    TRENDS_BY_Z.get(Z) ?? {
      atomicRadius: null,
      electronegativity: null,
      ionizationEnergy: null,
      meltingPoint: null,
    }
  )
}

/** Metadata for each trend — used by the UI to render the segmented
 *  control, legend, and units. */
export const TREND_META: Record<
  TrendKey,
  {
    label: string
    short: string
    unit: string
    /** One-sentence student-facing description. */
    description: string
  }
> = {
  atomicRadius: {
    label: 'Atomic radius',
    short: 'Radius',
    unit: 'pm',
    description: 'How big the atom is (picometres). Grows down a group, shrinks across a period.',
  },
  electronegativity: {
    label: 'Electronegativity',
    short: 'EN',
    unit: '',
    description:
      'How greedy the atom is for electrons (Pauling scale, 0-4). Fluorine is the most greedy; group-1 metals barely hold their own.',
  },
  ionizationEnergy: {
    label: 'Ionization energy',
    short: 'IE',
    unit: 'kJ/mol',
    description:
      'Energy needed to rip off an electron. Climbs across a period (atoms hold tight) and falls down a group (outer electrons are farther away).',
  },
  meltingPoint: {
    label: 'Melting point',
    short: 'MP',
    unit: 'K',
    description:
      'Temperature where the solid becomes liquid (kelvin). Tungsten is the all-time champ at 3695 K; gases melt below 100 K.',
  },
}
