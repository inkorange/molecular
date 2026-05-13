/**
 * Curated step-by-step chemistry demonstrations. Each entry pairs a
 * reaction from `src/chem/reactions.ts` with display metadata, an
 * ingredient layout, and per-audience step text. The /demo player drives
 * the three-step flow (ingredients → combine → results) and the
 * reaction-type effect vocabulary is keyed off `effectKind` below.
 */

import type { ReactionType } from '@/src/chem/reactions'

/**
 * One thing in the Ingredients step. Two flavours:
 *   - `library`: spawn an existing library molecule (e.g. 'hydrogen-gas')
 *   - `atom`: spawn a single bare atom by atomic number (for monoatomic
 *     elements like Na, Cl, Zn that don't have a library entry)
 */
export type DemoIngredient =
  | { kind: 'library'; libraryId: string; count: number }
  | { kind: 'atom'; Z: number; count: number }

export interface DemoStepText {
  elementary: string
  advanced: string
}

export interface Demonstration {
  /** URL slug — used in /demo/[id]. */
  id: string
  /** Display title in the picker dialog. */
  title: string
  /** One-line summary in the picker card. Audience-neutral. */
  summary: string
  /** Reaction id from REACTIONS — used to look up reactants, products, enthalpy. */
  reactionId: string
  /** Engine reaction type. Drives the effect vocabulary in the player. */
  reactionType: ReactionType
  /** Difficulty band — sorts cards in the picker (1 easy → 5 advanced). */
  difficulty: 1 | 2 | 3 | 4 | 5
  /**
   * Effect signature for the combine animation. Maps to a specific visual
   * treatment in `<ReactionEffect>`: synthesis flashes bond formations,
   * combustion adds fire particles, electrolysis arcs and splits, etc.
   */
  effectKind: 'synthesis' | 'combustion' | 'decomposition' | 'neutralization' | 'displacement'
  /** Ingredient layout shown in the Ingredients step. */
  ingredients: DemoIngredient[]
  /**
   * Optional override for what to spawn as products. When omitted, the
   * /demo player derives products from the engine reaction's stoichiometry.
   * Useful for the "atoms" demos where products visually differ.
   */
  products?: DemoIngredient[]
  /** Step text, per audience level. */
  steps: {
    ingredients: DemoStepText
    combine: DemoStepText
    results: DemoStepText
  }
}

export const DEMOS: Demonstration[] = [
  {
    id: 'water-synthesis',
    title: 'Making water',
    summary: 'Two hydrogen gases meet one oxygen gas and form water.',
    reactionId: 'water-synthesis',
    reactionType: 'synthesis',
    difficulty: 1,
    effectKind: 'synthesis',
    ingredients: [
      { kind: 'library', libraryId: 'hydrogen-gas', count: 2 },
      { kind: 'library', libraryId: 'oxygen-gas', count: 1 },
    ],
    steps: {
      ingredients: {
        elementary:
          "We have two hydrogens (the small white pairs) and one oxygen (the big red pair). They're going to come together to make water!",
        advanced:
          'Reactants: 2 H₂ (g) and 1 O₂ (g). The hydrogen and oxygen molecules each carry a covalent bond that will break and reform as polar O–H bonds.',
      },
      combine: {
        elementary:
          'The atoms snap together! Each oxygen grabs two hydrogens — and now we have two water molecules (H₂O).',
        advanced:
          'The H–H and O=O bonds break; the freed atoms form new polar O–H bonds. The reaction is highly exothermic — energy is released as heat and light.',
      },
      results: {
        elementary:
          "We made 2 water molecules! Water is what fish swim in, what we drink, and what clouds are made of. This reaction also gives off heat — it's like a tiny explosion.",
        advanced:
          '2 H₂ + O₂ → 2 H₂O. ΔH ≈ −572 kJ/mol — strongly exothermic. The same reaction powers hydrogen fuel cells and was used by the Space Shuttle main engines.',
      },
    },
  },
  {
    id: 'ammonia-synthesis',
    title: 'Building ammonia',
    summary: 'Three hydrogens grab one nitrogen to make ammonia, NH₃.',
    reactionId: 'ammonia-synthesis',
    reactionType: 'synthesis',
    difficulty: 2,
    effectKind: 'synthesis',
    ingredients: [
      { kind: 'library', libraryId: 'hydrogen-gas', count: 3 },
      { kind: 'library', libraryId: 'nitrogen-gas', count: 1 },
    ],
    steps: {
      ingredients: {
        elementary:
          'Three hydrogen pairs and one nitrogen pair. Nitrogen really wants to share electrons with hydrogen.',
        advanced:
          'Reactants: 3 H₂ (g) and 1 N₂ (g). N₂ has a stable triple bond — breaking it is the energy barrier this reaction must clear.',
      },
      combine: {
        elementary:
          "The nitrogen atoms split apart and each one grabs three hydrogens. We've made two ammonia molecules!",
        advanced:
          'The N≡N triple bond breaks; each N forms three N–H bonds. The Haber–Bosch process runs this industrially at high temperature and pressure with an iron catalyst.',
      },
      results: {
        elementary:
          'Ammonia (NH₃) is the main ingredient in farm fertilizer. Without this reaction, we could not grow enough food for the planet.',
        advanced:
          'N₂ + 3 H₂ → 2 NH₃. ΔH ≈ −92 kJ/mol — exothermic but slow without a catalyst. The Haber–Bosch process produces ~150 million tons of ammonia annually for fertilizer.',
      },
    },
  },
  {
    id: 'nacl-synthesis',
    title: 'Forming table salt',
    summary: 'Sodium gives up an electron to chlorine — and you get salt.',
    reactionId: 'nacl-synthesis',
    reactionType: 'synthesis',
    difficulty: 2,
    effectKind: 'synthesis',
    // Sodium has no library entry — render as a bare atom. Chlorine is
    // similarly monoatomic for the demo since the library only ships
    // chlorine inside compounds.
    ingredients: [
      { kind: 'atom', Z: 11, count: 2 },
      { kind: 'atom', Z: 17, count: 2 },
    ],
    products: [{ kind: 'library', libraryId: 'sodium-chloride', count: 2 }],
    steps: {
      ingredients: {
        elementary:
          'A sodium atom (the purple one) and a chlorine atom (green). Sodium is really eager to give away an electron, and chlorine is really eager to grab one.',
        advanced:
          "Reactants: 2 Na (s) and Cl₂ (g) shown here as 2 Cl atoms. Sodium's 3s¹ electron is loosely held; chlorine has 7 valence electrons and needs one more for an octet.",
      },
      combine: {
        elementary:
          'Sodium hands its electron to chlorine. Now sodium has a positive charge and chlorine has a negative charge — and they stick together like magnets!',
        advanced:
          'Each Na donates its 3s¹ electron to a Cl 3p hole. The resulting Na⁺ and Cl⁻ ions are bound by an electrostatic ionic bond — no shared electrons, just opposite charges.',
      },
      results: {
        elementary:
          'Salt! The same stuff on your dinner table. Notice how this reaction is different from making water — no electron sharing, just a swap.',
        advanced:
          '2 Na + Cl₂ → 2 NaCl. ΔH ≈ −411 kJ/mol per NaCl — highly exothermic. The classic example of an ionic bond: electron transfer rather than covalent sharing.',
      },
    },
  },
  {
    id: 'methane-combustion',
    title: 'Burning natural gas',
    summary: 'Methane plus oxygen makes fire — and carbon dioxide and water.',
    reactionId: 'methane-combustion',
    reactionType: 'combustion',
    difficulty: 3,
    effectKind: 'combustion',
    ingredients: [
      { kind: 'library', libraryId: 'methane', count: 1 },
      { kind: 'library', libraryId: 'oxygen-gas', count: 2 },
    ],
    steps: {
      ingredients: {
        elementary:
          'One methane molecule (CH₄, the stuff in your stove) and two oxygens. We just need a tiny spark to start the reaction.',
        advanced:
          'Reactants: CH₄ (g) and 2 O₂ (g). Methane is the simplest hydrocarbon; complete combustion requires 2 mol O₂ per mol CH₄.',
      },
      combine: {
        elementary:
          'Boom! The methane bursts apart. Carbon grabs two oxygens to make CO₂, and the hydrogens grab oxygens to make water.',
        advanced:
          'The C–H bonds and O=O bonds break; new C=O and O–H bonds form. The reaction is strongly exothermic; the visible flame is hot CO₂ and H₂O incandescing.',
      },
      results: {
        elementary:
          'We made carbon dioxide (CO₂, the bubbles in soda) and water. Burning natural gas is how many homes heat themselves — but the CO₂ also makes the planet warmer.',
        advanced:
          'CH₄ + 2 O₂ → CO₂ + 2 H₂O. ΔH ≈ −891 kJ/mol — the basis of natural-gas energy. CO₂ is a greenhouse gas; this reaction is a major contributor to anthropogenic climate change.',
      },
    },
  },
  {
    id: 'water-electrolysis',
    title: 'Splitting water',
    summary: 'Run electricity through water and it comes apart.',
    reactionId: 'water-electrolysis',
    reactionType: 'decomposition',
    difficulty: 3,
    effectKind: 'decomposition',
    ingredients: [{ kind: 'library', libraryId: 'water', count: 2 }],
    steps: {
      ingredients: {
        elementary:
          'Two water molecules. Water looks simple, but it stores a LOT of energy in its bonds — and we can pull it apart with electricity.',
        advanced:
          'Reactants: 2 H₂O (l). The reverse of water synthesis. Endothermic — requires an external energy input (electrical) to break the polar O–H bonds.',
      },
      combine: {
        elementary:
          'Zap! Electricity pulls the molecules apart. The hydrogens pair up and the oxygens pair up.',
        advanced:
          'At the cathode: 4 H⁺ + 4 e⁻ → 2 H₂. At the anode: 2 H₂O → O₂ + 4 H⁺ + 4 e⁻. Net: 2 H₂O → 2 H₂ + O₂. ΔH > 0 (endothermic) — input energy stored as chemical bonds.',
      },
      results: {
        elementary:
          'Hydrogen gas and oxygen gas! Hydrogen is what hopes to fuel future cars — clean burning, just makes water back when it does.',
        advanced:
          '2 H₂O → 2 H₂ + O₂. ΔH ≈ +572 kJ/mol — the exact reverse of water synthesis. Electrolysis is the basis of green hydrogen production for fuel cells and industrial chemistry.',
      },
    },
  },
  {
    id: 'hcl-naoh',
    title: 'Neutralizing an acid',
    summary: 'Strong acid meets strong base. They cancel each other out.',
    reactionId: 'hcl-naoh',
    reactionType: 'neutralization',
    difficulty: 2,
    effectKind: 'neutralization',
    ingredients: [
      { kind: 'library', libraryId: 'hydrochloric-acid', count: 1 },
      { kind: 'library', libraryId: 'sodium-hydroxide', count: 1 },
    ],
    steps: {
      ingredients: {
        elementary:
          'On the left: hydrochloric acid, a strong acid. On the right: sodium hydroxide (lye), a strong base. Both can burn skin on their own.',
        advanced:
          'Reactants: HCl (aq) and NaOH (aq). HCl fully dissociates into H⁺ + Cl⁻; NaOH fully dissociates into Na⁺ + OH⁻ in water.',
      },
      combine: {
        elementary:
          'The hydrogen from the acid jumps to the OH from the base — and they make water. The leftover sodium and chlorine pair up as salt.',
        advanced:
          "Net ionic equation: H⁺ + OH⁻ → H₂O. The acid's H and the base's OH combine to form water; Na⁺ and Cl⁻ remain as spectator ions, crystallising into NaCl.",
      },
      results: {
        elementary:
          'Just salt water! Two dangerous chemicals mixed to make something you could safely drink (in small amounts). That\'s what "neutralize" means.',
        advanced:
          'HCl + NaOH → NaCl + H₂O. ΔH ≈ −57 kJ/mol — the heat of neutralisation. The basis of acid-base titration and many industrial pH-control processes.',
      },
    },
  },
  {
    id: 'zn-hcl',
    title: 'Zinc displaces hydrogen',
    summary: 'A more reactive metal kicks hydrogen out of an acid.',
    reactionId: 'zn-hcl',
    reactionType: 'displacement',
    difficulty: 4,
    effectKind: 'displacement',
    // Zinc isn't in the library either — render as atom.
    ingredients: [
      { kind: 'atom', Z: 30, count: 1 },
      { kind: 'library', libraryId: 'hydrochloric-acid', count: 2 },
    ],
    steps: {
      ingredients: {
        elementary:
          'A zinc atom (a metal) and two hydrochloric acid molecules. Zinc is more "reactive" than hydrogen — it wants to bond more.',
        advanced:
          'Reactants: Zn (s) and 2 HCl (aq). Zinc sits above hydrogen on the activity series, so Zn can reduce H⁺ to H₂.',
      },
      combine: {
        elementary:
          "Zinc shoves hydrogen out of the way! Zinc takes hydrogen's place with the chlorine, and the freed hydrogens bubble up as hydrogen gas.",
        advanced:
          'Zn(s) → Zn²⁺(aq) + 2 e⁻ (oxidation); 2 H⁺(aq) + 2 e⁻ → H₂(g) (reduction). Net redox: Zn + 2 HCl → ZnCl₂ + H₂.',
      },
      results: {
        elementary:
          'Zinc chloride and hydrogen gas bubbles. This is how a chemistry class often makes hydrogen — the bubbles you see rising in beakers.',
        advanced:
          'Zn + 2 HCl → ZnCl₂ + H₂. A classic single-displacement redox reaction. Used industrially to galvanise iron and as a lab-bench hydrogen source.',
      },
    },
  },
]

const DEMOS_BY_ID = new Map(DEMOS.map((d) => [d.id, d]))

export function getDemonstration(id: string): Demonstration | undefined {
  return DEMOS_BY_ID.get(id)
}
