import type { BondOrder, BondType, Vec3 } from '@/src/chem/types'

export type LibraryCategory =
  | 'water-solvents'
  | 'acids-bases'
  | 'hydrocarbons'
  | 'salts-ionic'
  | 'biological'
  | 'gases'

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  'water-solvents',
  'acids-bases',
  'hydrocarbons',
  'salts-ionic',
  'biological',
  'gases',
]

export const CATEGORY_LABEL: Record<LibraryCategory, string> = {
  'water-solvents': 'Water & Solvents',
  'acids-bases': 'Acids & Bases',
  hydrocarbons: 'Hydrocarbons',
  'salts-ionic': 'Salts & Ionic',
  biological: 'Biological',
  gases: 'Gases',
}

export interface LibraryAtom {
  Z: number
  position: Vec3
}

export interface LibraryBond {
  atomAIndex: number
  atomBIndex: number
  order: BondOrder
  type?: BondType
}

export interface LibraryMolecule {
  id: string
  name: string
  formula: string
  category: LibraryCategory
  description: string
  uses?: string
  atoms: LibraryAtom[]
  bonds: LibraryBond[]
}

// Bond-length unit ≈ 1 in scene space.
const BL = 1.0

function extras(): LibraryMolecule[] {
  return [
    {
      id: 'sulfuric-acid',
      name: 'Sulfuric Acid',
      formula: 'H2SO4',
      category: 'acids-bases',
      description: 'A strong mineral acid; widely used in industry.',
      atoms: [
        { Z: 16, position: [0, 0, 0] },
        { Z: 8, position: [BL, BL, BL * 0.4] },
        { Z: 8, position: [-BL, -BL, BL * 0.4] },
        { Z: 8, position: [-BL, BL, -BL * 0.6] },
        { Z: 8, position: [BL, -BL, -BL * 0.6] },
        { Z: 1, position: [-BL * 1.6, BL * 1.6, -BL * 1.0] },
        { Z: 1, position: [BL * 1.6, -BL * 1.6, -BL * 1.0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 2 },
        { atomAIndex: 0, atomBIndex: 2, order: 2 },
        { atomAIndex: 0, atomBIndex: 3, order: 1 },
        { atomAIndex: 0, atomBIndex: 4, order: 1 },
        { atomAIndex: 3, atomBIndex: 5, order: 1 },
        { atomAIndex: 4, atomBIndex: 6, order: 1 },
      ],
    },
    {
      id: 'hydrogen-peroxide',
      name: 'Hydrogen Peroxide',
      formula: 'H2O2',
      category: 'water-solvents',
      description: 'A pale-blue liquid; decomposes into water and oxygen.',
      atoms: [
        { Z: 8, position: [-0.6, 0, 0] },
        { Z: 8, position: [0.6, 0, 0] },
        { Z: 1, position: [-1.0, 0.8, 0.3] },
        { Z: 1, position: [1.0, -0.8, -0.3] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 1 },
        { atomAIndex: 0, atomBIndex: 2, order: 1 },
        { atomAIndex: 1, atomBIndex: 3, order: 1 },
      ],
    },
    {
      id: 'acetic-acid',
      name: 'Acetic Acid',
      formula: 'C2H4O2',
      category: 'acids-bases',
      description: 'The active ingredient in vinegar.',
      atoms: [
        { Z: 6, position: [-1.0, 0, 0] },
        { Z: 6, position: [0.4, 0, 0] },
        { Z: 8, position: [1.1, 1.0, 0] },
        { Z: 8, position: [1.1, -1.0, 0] },
        { Z: 1, position: [-1.6, 0.8, 0.5] },
        { Z: 1, position: [-1.6, 0.8, -0.5] },
        { Z: 1, position: [-1.6, -0.8, 0] },
        { Z: 1, position: [2.0, -1.3, 0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 1 },
        { atomAIndex: 1, atomBIndex: 2, order: 2 },
        { atomAIndex: 1, atomBIndex: 3, order: 1 },
        { atomAIndex: 3, atomBIndex: 7, order: 1 },
        { atomAIndex: 0, atomBIndex: 4, order: 1 },
        { atomAIndex: 0, atomBIndex: 5, order: 1 },
        { atomAIndex: 0, atomBIndex: 6, order: 1 },
      ],
    },
    {
      id: 'calcium-carbonate',
      name: 'Calcium Carbonate',
      formula: 'CaCO3',
      category: 'salts-ionic',
      description: 'Found in limestone, chalk, and seashells.',
      atoms: [
        { Z: 20, position: [-1.8, 0, 0] },
        { Z: 6, position: [0.2, 0, 0] },
        { Z: 8, position: [1.2, 0.9, 0] },
        { Z: 8, position: [1.2, -0.9, 0] },
        { Z: 8, position: [-0.8, 0, 0.9] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 4, order: 1, type: 'ionic' },
        { atomAIndex: 1, atomBIndex: 2, order: 2 },
        { atomAIndex: 1, atomBIndex: 3, order: 1 },
        { atomAIndex: 1, atomBIndex: 4, order: 1 },
      ],
    },
    {
      id: 'magnesium-oxide',
      name: 'Magnesium Oxide',
      formula: 'MgO',
      category: 'salts-ionic',
      description: 'A white solid used in refractory linings.',
      atoms: [
        { Z: 12, position: [-0.6, 0, 0] },
        { Z: 8, position: [0.6, 0, 0] },
      ],
      bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1, type: 'ionic' }],
    },
    {
      id: 'methanol',
      name: 'Methanol',
      formula: 'CH4O',
      category: 'biological',
      description: 'The simplest alcohol; toxic to humans.',
      atoms: [
        { Z: 6, position: [-0.6, 0, 0] },
        { Z: 8, position: [0.8, 0, 0] },
        { Z: 1, position: [-1.2, 0.8, 0.5] },
        { Z: 1, position: [-1.2, 0.8, -0.5] },
        { Z: 1, position: [-1.2, -0.8, 0] },
        { Z: 1, position: [1.4, 0.7, 0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 1 },
        { atomAIndex: 1, atomBIndex: 5, order: 1 },
        { atomAIndex: 0, atomBIndex: 2, order: 1 },
        { atomAIndex: 0, atomBIndex: 3, order: 1 },
        { atomAIndex: 0, atomBIndex: 4, order: 1 },
      ],
    },
    {
      id: 'glucose',
      name: 'Glucose',
      formula: 'C6H12O6',
      category: 'biological',
      description: 'A simple sugar used by cells for energy.',
      atoms: ((): LibraryAtom[] => {
        const atoms: LibraryAtom[] = []
        for (let i = 0; i < 6; i++) atoms.push({ Z: 6, position: [(i - 2.5) * 1.4, 0, 0] })
        for (let i = 0; i < 6; i++)
          atoms.push({ Z: 8, position: [(i - 2.5) * 1.4, i % 2 === 0 ? 1.2 : -1.2, 0] })
        for (let i = 0; i < 6; i++)
          atoms.push({ Z: 1, position: [(i - 2.5) * 1.4, i % 2 === 0 ? 2.0 : -2.0, 0] })
        for (let i = 0; i < 6; i++) atoms.push({ Z: 1, position: [(i - 2.5) * 1.4 + 0.5, 0, 0.9] })
        return atoms
      })(),
      bonds: ((): LibraryBond[] => {
        const bonds: LibraryBond[] = []
        for (let i = 0; i < 5; i++) bonds.push({ atomAIndex: i, atomBIndex: i + 1, order: 1 })
        for (let i = 0; i < 6; i++) bonds.push({ atomAIndex: i, atomBIndex: 6 + i, order: 1 })
        for (let i = 0; i < 6; i++) bonds.push({ atomAIndex: 6 + i, atomBIndex: 12 + i, order: 1 })
        for (let i = 0; i < 6; i++) bonds.push({ atomAIndex: i, atomBIndex: 18 + i, order: 1 })
        return bonds
      })(),
    },
    {
      id: 'acetone',
      name: 'Acetone',
      formula: 'C3H6O',
      category: 'biological',
      description: 'A common solvent (nail polish remover).',
      atoms: [
        { Z: 6, position: [-1.4, 0, 0] },
        { Z: 6, position: [0, 0, 0] },
        { Z: 6, position: [1.4, 0, 0] },
        { Z: 8, position: [0, 1.2, 0] },
        { Z: 1, position: [-2.0, 0.7, 0.5] },
        { Z: 1, position: [-2.0, 0.7, -0.5] },
        { Z: 1, position: [-2.0, -0.7, 0] },
        { Z: 1, position: [2.0, 0.7, 0.5] },
        { Z: 1, position: [2.0, 0.7, -0.5] },
        { Z: 1, position: [2.0, -0.7, 0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 1 },
        { atomAIndex: 1, atomBIndex: 2, order: 1 },
        { atomAIndex: 1, atomBIndex: 3, order: 2 },
        { atomAIndex: 0, atomBIndex: 4, order: 1 },
        { atomAIndex: 0, atomBIndex: 5, order: 1 },
        { atomAIndex: 0, atomBIndex: 6, order: 1 },
        { atomAIndex: 2, atomBIndex: 7, order: 1 },
        { atomAIndex: 2, atomBIndex: 8, order: 1 },
        { atomAIndex: 2, atomBIndex: 9, order: 1 },
      ],
    },
    {
      id: 'chloromethane',
      name: 'Chloromethane',
      formula: 'CH3Cl',
      category: 'hydrocarbons',
      description: 'A simple chlorinated hydrocarbon.',
      atoms: [
        { Z: 6, position: [0, 0, 0] },
        { Z: 17, position: [1.4, 0, 0] },
        { Z: 1, position: [-0.5, 0.85, 0.5] },
        { Z: 1, position: [-0.5, 0.85, -0.5] },
        { Z: 1, position: [-0.5, -0.85, 0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 1 },
        { atomAIndex: 0, atomBIndex: 2, order: 1 },
        { atomAIndex: 0, atomBIndex: 3, order: 1 },
        { atomAIndex: 0, atomBIndex: 4, order: 1 },
      ],
    },
    {
      id: 'carbon-monoxide',
      name: 'Carbon Monoxide',
      formula: 'CO',
      category: 'gases',
      description: 'A colorless toxic gas with a triple bond.',
      atoms: [
        { Z: 6, position: [-0.55, 0, 0] },
        { Z: 8, position: [0.55, 0, 0] },
      ],
      bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 3 }],
    },
    {
      id: 'chlorine-gas',
      name: 'Chlorine Gas',
      formula: 'Cl2',
      category: 'gases',
      description: 'A yellow-green diatomic gas.',
      atoms: [
        { Z: 17, position: [-0.85, 0, 0] },
        { Z: 17, position: [0.85, 0, 0] },
      ],
      bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1 }],
    },
    {
      id: 'potassium-chloride',
      name: 'Potassium Chloride',
      formula: 'ClK',
      category: 'salts-ionic',
      description: 'A salt used as a sodium-chloride substitute.',
      atoms: [
        { Z: 19, position: [-0.85, 0, 0] },
        { Z: 17, position: [0.85, 0, 0] },
      ],
      bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1, type: 'ionic' }],
    },
    {
      id: 'calcium-oxide',
      name: 'Calcium Oxide',
      formula: 'CaO',
      category: 'salts-ionic',
      description: 'Quicklime; used in cement production.',
      atoms: [
        { Z: 20, position: [-0.85, 0, 0] },
        { Z: 8, position: [0.85, 0, 0] },
      ],
      bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1, type: 'ionic' }],
    },
    {
      id: 'potassium-hydroxide',
      name: 'Potassium Hydroxide',
      formula: 'KOH',
      category: 'acids-bases',
      description: 'A strong base; caustic potash.',
      atoms: [
        { Z: 19, position: [-1.0, 0, 0] },
        { Z: 8, position: [0, 0, 0] },
        { Z: 1, position: [0.85, 0.4, 0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 1, type: 'ionic' },
        { atomAIndex: 1, atomBIndex: 2, order: 1 },
      ],
    },
    {
      id: 'formaldehyde',
      name: 'Formaldehyde',
      formula: 'CH2O',
      category: 'biological',
      description: 'A pungent gas used as a preservative.',
      atoms: [
        { Z: 6, position: [0, 0, 0] },
        { Z: 8, position: [0, 1.2, 0] },
        { Z: 1, position: [0.9, -0.5, 0] },
        { Z: 1, position: [-0.9, -0.5, 0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 2 },
        { atomAIndex: 0, atomBIndex: 2, order: 1 },
        { atomAIndex: 0, atomBIndex: 3, order: 1 },
      ],
    },
    {
      id: 'urea',
      name: 'Urea',
      formula: 'CH4N2O',
      category: 'biological',
      description: 'A nitrogenous waste product excreted by mammals.',
      atoms: [
        { Z: 6, position: [0, 0, 0] },
        { Z: 8, position: [0, 1.2, 0] },
        { Z: 7, position: [-1.1, -0.7, 0] },
        { Z: 7, position: [1.1, -0.7, 0] },
        { Z: 1, position: [-1.8, -0.3, 0.6] },
        { Z: 1, position: [-1.8, -0.3, -0.6] },
        { Z: 1, position: [1.8, -0.3, 0.6] },
        { Z: 1, position: [1.8, -0.3, -0.6] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 2 },
        { atomAIndex: 0, atomBIndex: 2, order: 1 },
        { atomAIndex: 0, atomBIndex: 3, order: 1 },
        { atomAIndex: 2, atomBIndex: 4, order: 1 },
        { atomAIndex: 2, atomBIndex: 5, order: 1 },
        { atomAIndex: 3, atomBIndex: 6, order: 1 },
        { atomAIndex: 3, atomBIndex: 7, order: 1 },
      ],
    },
    {
      id: 'hydrofluoric-acid',
      name: 'Hydrofluoric Acid',
      formula: 'FH',
      category: 'acids-bases',
      description: 'A weak acid notorious for etching glass.',
      atoms: [
        { Z: 1, position: [-0.45, 0, 0] },
        { Z: 9, position: [0.45, 0, 0] },
      ],
      bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1 }],
    },
    {
      id: 'nitric-acid',
      name: 'Nitric Acid',
      formula: 'HNO3',
      category: 'acids-bases',
      description: 'A strong acid used in fertilizer production.',
      atoms: [
        { Z: 7, position: [0, 0, 0] },
        { Z: 8, position: [-1.0, 0.8, 0] },
        { Z: 8, position: [1.0, 0.8, 0] },
        { Z: 8, position: [0, -1.2, 0] },
        { Z: 1, position: [0.7, -1.8, 0] },
      ],
      bonds: [
        { atomAIndex: 0, atomBIndex: 1, order: 2 },
        { atomAIndex: 0, atomBIndex: 2, order: 1 },
        { atomAIndex: 0, atomBIndex: 3, order: 1 },
        { atomAIndex: 3, atomBIndex: 4, order: 1 },
      ],
    },
  ]
}

export const LIBRARY: LibraryMolecule[] = [
  {
    id: 'water',
    name: 'Water',
    formula: 'H2O',
    category: 'water-solvents',
    description: 'The most common compound on Earth.',
    uses: 'Universal solvent; required for life.',
    atoms: [
      { Z: 8, position: [0, 0.2, 0] },
      { Z: 1, position: [-0.85, -0.45, 0] },
      { Z: 1, position: [0.85, -0.45, 0] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 1 },
      { atomAIndex: 0, atomBIndex: 2, order: 1 },
    ],
  },
  {
    id: 'methane',
    name: 'Methane',
    formula: 'CH4',
    category: 'hydrocarbons',
    description: 'The simplest hydrocarbon. Main component of natural gas.',
    uses: 'Heating, cooking, electricity generation.',
    atoms: [
      { Z: 6, position: [0, 0, 0] },
      { Z: 1, position: [BL, BL, BL] },
      { Z: 1, position: [-BL, -BL, BL] },
      { Z: 1, position: [-BL, BL, -BL] },
      { Z: 1, position: [BL, -BL, -BL] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 1 },
      { atomAIndex: 0, atomBIndex: 2, order: 1 },
      { atomAIndex: 0, atomBIndex: 3, order: 1 },
      { atomAIndex: 0, atomBIndex: 4, order: 1 },
    ],
  },
  {
    id: 'carbon-dioxide',
    name: 'Carbon Dioxide',
    formula: 'CO2',
    category: 'gases',
    description: 'Linear molecule with two C=O double bonds.',
    uses: 'Photosynthesis input; greenhouse gas.',
    atoms: [
      { Z: 6, position: [0, 0, 0] },
      { Z: 8, position: [-BL * 1.2, 0, 0] },
      { Z: 8, position: [BL * 1.2, 0, 0] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 2 },
      { atomAIndex: 0, atomBIndex: 2, order: 2 },
    ],
  },
  {
    id: 'ammonia',
    name: 'Ammonia',
    formula: 'NH3',
    category: 'gases',
    description: 'Pyramidal molecule with a lone pair on nitrogen.',
    uses: 'Fertilizer; cleaning products.',
    atoms: [
      { Z: 7, position: [0, 0.2, 0] },
      { Z: 1, position: [BL * 0.94, -0.3, 0] },
      { Z: 1, position: [-BL * 0.47, -0.3, BL * 0.82] },
      { Z: 1, position: [-BL * 0.47, -0.3, -BL * 0.82] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 1 },
      { atomAIndex: 0, atomBIndex: 2, order: 1 },
      { atomAIndex: 0, atomBIndex: 3, order: 1 },
    ],
  },
  {
    id: 'sodium-chloride',
    name: 'Sodium Chloride',
    formula: 'NaCl',
    category: 'salts-ionic',
    description: 'Common table salt. Held together by ionic bonds.',
    uses: 'Seasoning, preservation, biological electrolyte.',
    atoms: [
      { Z: 11, position: [-BL * 0.6, 0, 0] },
      { Z: 17, position: [BL * 0.6, 0, 0] },
    ],
    bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1, type: 'ionic' }],
  },
  {
    id: 'hydrogen-gas',
    name: 'Hydrogen Gas',
    formula: 'H2',
    category: 'gases',
    description: 'Diatomic hydrogen — a single covalent bond.',
    atoms: [
      { Z: 1, position: [-0.35, 0, 0] },
      { Z: 1, position: [0.35, 0, 0] },
    ],
    bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1 }],
  },
  {
    id: 'oxygen-gas',
    name: 'Oxygen Gas',
    formula: 'O2',
    category: 'gases',
    description: 'Diatomic oxygen with a double bond.',
    atoms: [
      { Z: 8, position: [-0.6, 0, 0] },
      { Z: 8, position: [0.6, 0, 0] },
    ],
    bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 2 }],
  },
  {
    id: 'nitrogen-gas',
    name: 'Nitrogen Gas',
    formula: 'N2',
    category: 'gases',
    description: 'Diatomic nitrogen with a strong triple bond.',
    atoms: [
      { Z: 7, position: [-0.55, 0, 0] },
      { Z: 7, position: [0.55, 0, 0] },
    ],
    bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 3 }],
  },
  {
    id: 'hydrochloric-acid',
    name: 'Hydrochloric Acid',
    formula: 'HCl',
    category: 'acids-bases',
    description: 'Strong acid; one of the simplest.',
    uses: 'Stomach acid; industrial pH adjustment.',
    atoms: [
      { Z: 1, position: [-0.6, 0, 0] },
      { Z: 17, position: [0.6, 0, 0] },
    ],
    bonds: [{ atomAIndex: 0, atomBIndex: 1, order: 1 }],
  },
  {
    id: 'sodium-hydroxide',
    name: 'Sodium Hydroxide',
    formula: 'NaOH',
    category: 'acids-bases',
    description: 'A strong base; "caustic soda."',
    atoms: [
      { Z: 11, position: [-BL * 1.0, 0, 0] },
      { Z: 8, position: [0, 0, 0] },
      { Z: 1, position: [BL * 0.85, 0.4, 0] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 1, type: 'ionic' },
      { atomAIndex: 1, atomBIndex: 2, order: 1 },
    ],
  },
  {
    id: 'ethanol',
    name: 'Ethanol',
    formula: 'C2H6O',
    category: 'biological',
    description: 'Drinking alcohol; common solvent.',
    atoms: [
      { Z: 6, position: [-BL * 0.75, 0, 0] },
      { Z: 6, position: [BL * 0.75, 0, 0] },
      { Z: 8, position: [BL * 1.6, 0.7, 0] },
      { Z: 1, position: [-BL * 1.3, 0.7, 0.5] },
      { Z: 1, position: [-BL * 1.3, 0.7, -0.5] },
      { Z: 1, position: [-BL * 1.3, -0.7, 0] },
      { Z: 1, position: [BL * 0.75, -0.7, 0.8] },
      { Z: 1, position: [BL * 0.75, -0.7, -0.8] },
      { Z: 1, position: [BL * 2.3, 1.0, 0] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 1 },
      { atomAIndex: 1, atomBIndex: 2, order: 1 },
      { atomAIndex: 2, atomBIndex: 8, order: 1 },
      { atomAIndex: 0, atomBIndex: 3, order: 1 },
      { atomAIndex: 0, atomBIndex: 4, order: 1 },
      { atomAIndex: 0, atomBIndex: 5, order: 1 },
      { atomAIndex: 1, atomBIndex: 6, order: 1 },
      { atomAIndex: 1, atomBIndex: 7, order: 1 },
    ],
  },
  {
    id: 'ethane',
    name: 'Ethane',
    formula: 'C2H6',
    category: 'hydrocarbons',
    description: 'Two-carbon alkane.',
    atoms: [
      { Z: 6, position: [-BL * 0.75, 0, 0] },
      { Z: 6, position: [BL * 0.75, 0, 0] },
      { Z: 1, position: [-BL * 1.4, 0.8, 0.4] },
      { Z: 1, position: [-BL * 1.4, 0.8, -0.4] },
      { Z: 1, position: [-BL * 1.4, -0.8, 0] },
      { Z: 1, position: [BL * 1.4, 0.8, 0.4] },
      { Z: 1, position: [BL * 1.4, 0.8, -0.4] },
      { Z: 1, position: [BL * 1.4, -0.8, 0] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 1 },
      { atomAIndex: 0, atomBIndex: 2, order: 1 },
      { atomAIndex: 0, atomBIndex: 3, order: 1 },
      { atomAIndex: 0, atomBIndex: 4, order: 1 },
      { atomAIndex: 1, atomBIndex: 5, order: 1 },
      { atomAIndex: 1, atomBIndex: 6, order: 1 },
      { atomAIndex: 1, atomBIndex: 7, order: 1 },
    ],
  },
  {
    id: 'propane',
    name: 'Propane',
    formula: 'C3H8',
    category: 'hydrocarbons',
    description: 'Three-carbon alkane. BBQ fuel.',
    atoms: [
      { Z: 6, position: [-BL * 1.5, 0, 0] },
      { Z: 6, position: [0, 0, 0] },
      { Z: 6, position: [BL * 1.5, 0, 0] },
      { Z: 1, position: [-BL * 2.0, 0.85, 0] },
      { Z: 1, position: [-BL * 2.0, -0.5, 0.7] },
      { Z: 1, position: [-BL * 2.0, -0.5, -0.7] },
      { Z: 1, position: [0, 0.85, 0.7] },
      { Z: 1, position: [0, 0.85, -0.7] },
      { Z: 1, position: [BL * 2.0, 0.85, 0] },
      { Z: 1, position: [BL * 2.0, -0.5, 0.7] },
      { Z: 1, position: [BL * 2.0, -0.5, -0.7] },
    ],
    bonds: [
      { atomAIndex: 0, atomBIndex: 1, order: 1 },
      { atomAIndex: 1, atomBIndex: 2, order: 1 },
      { atomAIndex: 0, atomBIndex: 3, order: 1 },
      { atomAIndex: 0, atomBIndex: 4, order: 1 },
      { atomAIndex: 0, atomBIndex: 5, order: 1 },
      { atomAIndex: 1, atomBIndex: 6, order: 1 },
      { atomAIndex: 1, atomBIndex: 7, order: 1 },
      { atomAIndex: 2, atomBIndex: 8, order: 1 },
      { atomAIndex: 2, atomBIndex: 9, order: 1 },
      { atomAIndex: 2, atomBIndex: 10, order: 1 },
    ],
  },
  ...extras(),
]

const BY_ID = new Map(LIBRARY.map((m) => [m.id, m]))

export function getLibraryEntry(id: string): LibraryMolecule | undefined {
  return BY_ID.get(id)
}
