export type ReactionType =
  | 'synthesis'
  | 'decomposition'
  | 'displacement'
  | 'combustion'
  | 'neutralization'
  // Nuclear reactions — distinct from the chemistry types above. Used only
  // by the demonstration player for fusion / fission / decay visuals; the
  // chemistry engine doesn't simulate any of them, so no matching entries
  // appear in the REACTIONS table below. Listed here so the type is the
  // single source of truth for what a demo's `reactionType` can be.
  | 'fusion'
  | 'fission'
  | 'decay'

export interface Stoich {
  formula: string
  count: number
}

export interface Reaction {
  id: string
  type: ReactionType
  reactants: Stoich[]
  products: Stoich[]
  activationEnergy: number
  enthalpy: 'exothermic' | 'endothermic'
  notes: string
}

export const REACTIONS: readonly Reaction[] = [
  // ---- Synthesis ----
  {
    id: 'water-synthesis',
    type: 'synthesis',
    reactants: [
      { formula: 'H2', count: 2 },
      { formula: 'O2', count: 1 },
    ],
    products: [{ formula: 'H2O', count: 2 }],
    activationEnergy: 2,
    enthalpy: 'exothermic',
    notes: 'Hydrogen burns in oxygen to form water. Highly exothermic.',
  },
  {
    id: 'ammonia-synthesis',
    type: 'synthesis',
    reactants: [
      { formula: 'N2', count: 1 },
      { formula: 'H2', count: 3 },
    ],
    products: [{ formula: 'NH3', count: 2 }],
    activationEnergy: 3,
    enthalpy: 'exothermic',
    notes: 'Haber process: N₂ and H₂ form ammonia under high pressure.',
  },
  {
    id: 'nacl-synthesis',
    type: 'synthesis',
    reactants: [
      { formula: 'Na', count: 2 },
      { formula: 'Cl2', count: 1 },
    ],
    products: [{ formula: 'NaCl', count: 2 }],
    activationEnergy: 1.5,
    enthalpy: 'exothermic',
    notes: 'Sodium reacts violently with chlorine gas to form table salt.',
  },
  {
    id: 'mgo-synthesis',
    type: 'synthesis',
    reactants: [
      { formula: 'Mg', count: 2 },
      { formula: 'O2', count: 1 },
    ],
    products: [{ formula: 'MgO', count: 2 }],
    activationEnergy: 2,
    enthalpy: 'exothermic',
    notes: 'Magnesium burns with a bright white flame to form magnesium oxide.',
  },
  {
    id: 'co2-from-c',
    type: 'synthesis',
    reactants: [
      { formula: 'C', count: 1 },
      { formula: 'O2', count: 1 },
    ],
    products: [{ formula: 'CO2', count: 1 }],
    activationEnergy: 2,
    enthalpy: 'exothermic',
    notes: 'Carbon burns in oxygen to form carbon dioxide.',
  },
  {
    id: 'co-from-c-limited-o2',
    type: 'synthesis',
    reactants: [
      { formula: 'C', count: 2 },
      { formula: 'O2', count: 1 },
    ],
    products: [{ formula: 'CO', count: 2 }],
    activationEnergy: 2.5,
    enthalpy: 'exothermic',
    notes: 'With limited oxygen, carbon forms carbon monoxide instead of CO₂.',
  },
  {
    id: 'h2-synthesis-from-h',
    type: 'synthesis',
    reactants: [{ formula: 'H', count: 2 }],
    products: [{ formula: 'H2', count: 1 }],
    activationEnergy: 0.5,
    enthalpy: 'exothermic',
    notes: 'Two hydrogen atoms readily pair into H₂.',
  },
  {
    id: 'o2-synthesis-from-o',
    type: 'synthesis',
    reactants: [{ formula: 'O', count: 2 }],
    products: [{ formula: 'O2', count: 1 }],
    activationEnergy: 0.5,
    enthalpy: 'exothermic',
    notes: 'Two oxygen atoms pair into O₂.',
  },
  {
    id: 'cl2-synthesis-from-cl',
    type: 'synthesis',
    reactants: [{ formula: 'Cl', count: 2 }],
    products: [{ formula: 'Cl2', count: 1 }],
    activationEnergy: 0.5,
    enthalpy: 'exothermic',
    notes: 'Two chlorine atoms pair into Cl₂.',
  },
  {
    id: 'caco3-synthesis',
    type: 'synthesis',
    reactants: [
      { formula: 'CaO', count: 1 },
      { formula: 'CO2', count: 1 },
    ],
    products: [{ formula: 'CaCO3', count: 1 }],
    activationEnergy: 2,
    enthalpy: 'exothermic',
    notes: 'Calcium oxide absorbs CO₂ to form calcium carbonate (limestone).',
  },

  // ---- Combustion ----
  {
    id: 'methane-combustion',
    type: 'combustion',
    reactants: [
      { formula: 'CH4', count: 1 },
      { formula: 'O2', count: 2 },
    ],
    products: [
      { formula: 'CO2', count: 1 },
      { formula: 'H2O', count: 2 },
    ],
    activationEnergy: 2.5,
    enthalpy: 'exothermic',
    notes: 'Burning natural gas (methane) produces carbon dioxide and water.',
  },
  {
    id: 'ethane-combustion',
    type: 'combustion',
    reactants: [
      { formula: 'C2H6', count: 2 },
      { formula: 'O2', count: 7 },
    ],
    products: [
      { formula: 'CO2', count: 4 },
      { formula: 'H2O', count: 6 },
    ],
    activationEnergy: 2.7,
    enthalpy: 'exothermic',
    notes: 'Ethane combusts completely to CO₂ and water.',
  },
  {
    id: 'ethanol-combustion',
    type: 'combustion',
    reactants: [
      { formula: 'C2H6O', count: 1 },
      { formula: 'O2', count: 3 },
    ],
    products: [
      { formula: 'CO2', count: 2 },
      { formula: 'H2O', count: 3 },
    ],
    activationEnergy: 2.5,
    enthalpy: 'exothermic',
    notes: 'Ethanol (drinking alcohol) burns cleanly to CO₂ and water.',
  },
  {
    id: 'propane-combustion',
    type: 'combustion',
    reactants: [
      { formula: 'C3H8', count: 1 },
      { formula: 'O2', count: 5 },
    ],
    products: [
      { formula: 'CO2', count: 3 },
      { formula: 'H2O', count: 4 },
    ],
    activationEnergy: 2.6,
    enthalpy: 'exothermic',
    notes: 'Propane (BBQ gas) burns to CO₂ and water.',
  },

  // ---- Neutralization ----
  {
    id: 'hcl-naoh',
    type: 'neutralization',
    reactants: [
      { formula: 'HCl', count: 1 },
      { formula: 'NaOH', count: 1 },
    ],
    products: [
      { formula: 'NaCl', count: 1 },
      { formula: 'H2O', count: 1 },
    ],
    activationEnergy: 0.8,
    enthalpy: 'exothermic',
    notes: 'A strong acid and a strong base neutralize into salt and water.',
  },
  {
    id: 'h2so4-naoh',
    type: 'neutralization',
    reactants: [
      { formula: 'H2SO4', count: 1 },
      { formula: 'NaOH', count: 2 },
    ],
    products: [
      { formula: 'Na2SO4', count: 1 },
      { formula: 'H2O', count: 2 },
    ],
    activationEnergy: 1,
    enthalpy: 'exothermic',
    notes: 'Sulfuric acid + sodium hydroxide → sodium sulfate + water.',
  },
  {
    id: 'hno3-koh',
    type: 'neutralization',
    reactants: [
      { formula: 'HNO3', count: 1 },
      { formula: 'KOH', count: 1 },
    ],
    products: [
      { formula: 'KNO3', count: 1 },
      { formula: 'H2O', count: 1 },
    ],
    activationEnergy: 0.8,
    enthalpy: 'exothermic',
    notes: 'Nitric acid + potassium hydroxide → potassium nitrate + water.',
  },

  // ---- Displacement ----
  {
    id: 'zn-hcl',
    type: 'displacement',
    reactants: [
      { formula: 'Zn', count: 1 },
      { formula: 'HCl', count: 2 },
    ],
    products: [
      { formula: 'ZnCl2', count: 1 },
      { formula: 'H2', count: 1 },
    ],
    activationEnergy: 1.2,
    enthalpy: 'exothermic',
    notes: 'Zinc displaces hydrogen from hydrochloric acid; bubbles of H₂ form.',
  },
  {
    id: 'fe-cuso4',
    type: 'displacement',
    reactants: [
      { formula: 'Fe', count: 1 },
      { formula: 'CuSO4', count: 1 },
    ],
    products: [
      { formula: 'FeSO4', count: 1 },
      { formula: 'Cu', count: 1 },
    ],
    activationEnergy: 1.5,
    enthalpy: 'exothermic',
    notes: 'Iron displaces copper from copper sulfate; copper plates out.',
  },
  {
    id: 'mg-hcl',
    type: 'displacement',
    reactants: [
      { formula: 'Mg', count: 1 },
      { formula: 'HCl', count: 2 },
    ],
    products: [
      { formula: 'MgCl2', count: 1 },
      { formula: 'H2', count: 1 },
    ],
    activationEnergy: 1,
    enthalpy: 'exothermic',
    notes: 'Magnesium reacts vigorously with hydrochloric acid, releasing H₂.',
  },

  // ---- Decomposition ----
  {
    id: 'water-electrolysis',
    type: 'decomposition',
    reactants: [{ formula: 'H2O', count: 2 }],
    products: [
      { formula: 'H2', count: 2 },
      { formula: 'O2', count: 1 },
    ],
    activationEnergy: 4,
    enthalpy: 'endothermic',
    notes: 'Electricity splits water into hydrogen and oxygen gas.',
  },
  {
    id: 'h2o2-decomp',
    type: 'decomposition',
    reactants: [{ formula: 'H2O2', count: 2 }],
    products: [
      { formula: 'H2O', count: 2 },
      { formula: 'O2', count: 1 },
    ],
    activationEnergy: 1.5,
    enthalpy: 'exothermic',
    notes: 'Hydrogen peroxide decomposes into water and oxygen — fizzing in cuts.',
  },
  {
    id: 'caco3-decomp',
    type: 'decomposition',
    reactants: [{ formula: 'CaCO3', count: 1 }],
    products: [
      { formula: 'CaO', count: 1 },
      { formula: 'CO2', count: 1 },
    ],
    activationEnergy: 3.5,
    enthalpy: 'endothermic',
    notes: 'Heating limestone produces quicklime and CO₂ — the basis of cement.',
  },
  {
    id: 'kclo3-decomp',
    type: 'decomposition',
    reactants: [{ formula: 'KClO3', count: 2 }],
    products: [
      { formula: 'KCl', count: 2 },
      { formula: 'O2', count: 3 },
    ],
    activationEnergy: 2,
    enthalpy: 'exothermic',
    notes: 'Potassium chlorate decomposes on heating, releasing oxygen.',
  },
  {
    id: 'nh3-decomp',
    type: 'decomposition',
    reactants: [{ formula: 'NH3', count: 2 }],
    products: [
      { formula: 'N2', count: 1 },
      { formula: 'H2', count: 3 },
    ],
    activationEnergy: 4,
    enthalpy: 'endothermic',
    notes: 'Ammonia decomposes back into nitrogen and hydrogen at high temperatures.',
  },
] as const

// Multiset-keyed lookup.
function reactantKey(reactants: readonly Stoich[]): string {
  return [...reactants]
    .map((r) => `${r.formula}:${r.count}`)
    .sort()
    .join('|')
}

const REACTION_INDEX = new Map<string, Reaction>()
for (const r of REACTIONS) REACTION_INDEX.set(reactantKey(r.reactants), r)

/**
 * Look up a reaction whose reactants exactly match the given multiset.
 * Returns undefined if no match.
 */
export function findReaction(input: readonly Stoich[]): Reaction | undefined {
  return REACTION_INDEX.get(reactantKey(input))
}
